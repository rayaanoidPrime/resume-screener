import { FormEvent, useState, useRef, useEffect } from "react";
import { useParams, Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { sessionApi } from "../services/api";

interface JobStatus {
  jobId: string;
  status: string;
  progress: number;
}

interface ResumeUploadResult {
  jobIds: string[];
  message: string;
  extractedText?: string;
  files: {
    jobId: string;
    resumeId: string;
    filePath: string;
    mimeType: string;
  }[];
  resumeId?: string;
}

interface EditingResume {
  id: string;
  extractedText: string;
}

interface ViewingResume {
  resumeId: string;
  filePath: string;
  mimeType: string;
  extractedText: string;
}

interface RankedCandidate {
  resumeId: string;
  candidateId: string;
  filePath: string;
  scores: {
    keywordScore: number;
    totalScore: number;
  };
  structuredData: {
    contact_info: {
      name: string | null;
      email: string | null;
      phone: string | null;
      location: string | null;
      linkedin: string | null;
      portfolio: string | null;
    };
    summary: string | null;
    experience: {
      company: string;
      title: string;
      dates: string;
      location: string;
      description: string[];
    }[];
    education:
      | {
          institution: string;
          degree: string;
          field: string;
          dates: string;
          gpa: string | null;
        }[]
      | null;
    skills: {
      programming_languages?: string[];
      frameworks?: string[];
      databases?: string[];
      tools?: string[];
    };
    certifications: {
      name: string;
      issuer: string;
      date: string;
    }[];
    projects: {
      name: string;
      description: string;
      technologies: string[];
      link: string;
    }[];
    languages: {
      language: string;
      proficiency: string;
    }[];
    additional: Record<string, string | string[]> | null;
    confidence: {
      contact_info: "high" | "medium" | "low";
      summary: "high" | "medium" | "low";
      experience: "high" | "medium" | "low";
      education: "high" | "medium" | "low";
      skills: "high" | "medium" | "low";
      certifications: "high" | "medium" | "low";
      projects: "high" | "medium" | "low";
      languages: "high" | "medium" | "low";
      additional: "high" | "medium" | "low";
    };
  };
}

export default function SessionDetails() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { isAuthenticated, token } = useAuth();
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedResumes, setUploadedResumes] = useState<ResumeUploadResult[]>(
    []
  );
  const [jobStatuses, setJobStatuses] = useState<Record<string, JobStatus>>({});
  const [editingResume, setEditingResume] = useState<EditingResume | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const [rankings, setRankings] = useState<RankedCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingIntervalRef = useRef<number | undefined>(undefined);
  const [viewingResume, setViewingResume] = useState<ViewingResume | null>(
    null
  );

  useEffect(() => {
    const fetchSessionDetails = async () => {
      if (!sessionId || !token) return;
      try {
        const data = await sessionApi.getSession(sessionId, token);
        setSessionDetails(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch session details"
        );
      } finally {
        setLoadingSession(false);
      }
    };

    fetchSessionDetails();
  }, [sessionId, token]);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const fetchRankings = async () => {
    if (!sessionId || !token) return;

    setLoading(true);
    try {
      const data = await sessionApi.getRankings(sessionId, token);
      setRankings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch rankings");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const handleJobStatusUpdate = (statuses: Record<string, string>) => {
    const statusMap: Record<string, JobStatus> = {};
    Object.entries(statuses).forEach(([jobId, status]) => {
      statusMap[jobId] = {
        jobId,
        status,
        progress: status === "completed" ? 100 : status === "failed" ? 0 : 50,
      };
    });
    setJobStatuses(statusMap);
  };

  useEffect(() => {
    if (!sessionId || !token || !uploadedResumes.length) return;

    const jobIds = uploadedResumes.flatMap((resume) => resume.jobIds);
    if (!jobIds.length) return;

    const pollStatus = async () => {
      try {
        const statuses = await sessionApi.getResumeStatuses(
          sessionId,
          jobIds,
          token
        );
        handleJobStatusUpdate(statuses);

        // Stop polling if all jobs are completed or failed
        const allCompleted = Object.values(statuses).every(
          (status) => status === "completed" || status === "failed"
        );
        if (allCompleted && pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      } catch (error) {
        console.error("Failed to get job statuses:", error);
      }
    };

    // Initial poll
    pollStatus();

    // Set up polling interval
    pollingIntervalRef.current = window.setInterval(pollStatus, 5000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [sessionId, token, uploadedResumes]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const files = fileInputRef.current?.files;
    if (!files || files.length === 0 || !sessionId || !token) {
      setError("Please select files to upload");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      const result = await sessionApi.uploadResumes(sessionId, formData, token);
      setUploadedResumes((prev) => [...prev, result]);

      // Initialize job statuses
      const initialStatuses: Record<string, JobStatus> = {};
      result.jobIds.forEach((jobId) => {
        initialStatuses[jobId] = {
          jobId,
          status: "waiting",
          progress: 0,
        };
      });
      setJobStatuses(initialStatuses);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload resumes");
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-500";
      case "failed":
        return "text-red-500";
      case "waiting":
      case "active":
        return "text-yellow-500";
      default:
        return "text-gray-500";
    }
  };

  const handleSave = async (resumeId: string, extractedText: string) => {
    if (!token) return;

    setSaving(true);
    try {
      const updatedResume = await sessionApi.updateResume(
        resumeId,
        extractedText,
        token
      );
      setUploadedResumes((prev) =>
        prev.map((resume) =>
          resume.files.some((file) => file.resumeId === resumeId)
            ? {
                ...resume,
                extractedText: updatedResume.extractedText,
                status: updatedResume.status as "processed" | "review_needed",
              }
            : resume
        )
      );
      setEditingResume(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update resume");
    } finally {
      setSaving(false);
    }
  };

  const formatScore = (score: number) => {
    return `${(score * 100).toFixed(1)}%`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {loadingSession ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      ) : sessionDetails ? (
        <div className="space-y-8">
          {/* Job Details Header */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
              <h1 className="text-2xl font-bold text-white">
                {sessionDetails.jobTitle}
              </h1>
              <div className="mt-2 flex flex-wrap gap-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-200 text-blue-800">
                  {sessionDetails.department}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-200 text-blue-800">
                  {sessionDetails.location}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-200 text-blue-800">
                  {sessionDetails.employmentType}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-200 text-blue-800">
                  {sessionDetails.experienceLevel}
                </span>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Job Description
                </h2>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {sessionDetails.jobDescription}
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    Required Skills
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {sessionDetails.requiredSkills?.map((skill: string) => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {sessionDetails.preferredSkills?.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                      Preferred Skills
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {sessionDetails.preferredSkills?.map((skill: string) => (
                        <span
                          key={skill}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    Key Responsibilities
                  </h2>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    {sessionDetails.responsibilities?.map((resp: string) => (
                      <li key={resp}>{resp}</li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                      Required Education
                    </h2>
                    <p className="text-gray-600">
                      {sessionDetails.educationRequired}
                    </p>
                  </div>
                  {sessionDetails.educationPreferred && (
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-3">
                        Preferred Education
                      </h2>
                      <p className="text-gray-600">
                        {sessionDetails.educationPreferred}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Resume Upload Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Upload Resumes
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="resumes"
                  className="block text-sm font-medium text-gray-700"
                >
                  Upload Resumes
                </label>
                <input
                  type="file"
                  id="resumes"
                  name="resumes"
                  multiple
                  accept=".pdf,.doc,.docx"
                  ref={fileInputRef}
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>
              <button
                type="submit"
                disabled={uploading}
                className="inline-flex justify-center py-2 px-4 border border-transparent 
                  shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 
                  hover:bg-blue-700 focus:outline-none focus:ring-2 
                  focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </form>
          </div>

          {/* Processing Status Section */}
          {Object.keys(jobStatuses).length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Processing Status
              </h2>
              <div className="space-y-2">
                {Object.values(jobStatuses).map((status) => (
                  <div
                    key={status.jobId}
                    className="flex items-center justify-between"
                  >
                    <span className={getStatusColor(status.status)}>
                      Job {status.jobId}: {status.status}
                    </span>
                    <div className="w-1/2 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 rounded-full h-2"
                        style={{ width: `${status.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Candidate Rankings Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Candidate Rankings
              </h2>
              <button
                onClick={fetchRankings}
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent 
                  shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 
                  hover:bg-blue-700 focus:outline-none focus:ring-2 
                  focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? "Ranking..." : "Rank Candidates"}
              </button>
            </div>
            {loading ? (
              <p className="text-gray-600">Loading rankings...</p>
            ) : rankings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Candidate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Match Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Keyword Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rankings.map((candidate, index) => (
                      <tr key={candidate.resumeId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {candidate.structuredData?.contact_info?.name ||
                            "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>
                            {candidate.structuredData?.contact_info?.email && (
                              <div>
                                {candidate.structuredData.contact_info.email}
                              </div>
                            )}
                            {candidate.structuredData?.contact_info?.phone && (
                              <div>
                                {candidate.structuredData.contact_info.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatScore(candidate.scores?.totalScore || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatScore(candidate.scores?.keywordScore || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() =>
                              setViewingResume({
                                resumeId: candidate.resumeId,
                                filePath: candidate.filePath,
                                mimeType: "", // This will be determined when viewing
                                extractedText: "", // This will be loaded when viewing
                              })
                            }
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            View Resume
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600">No evaluated resumes yet.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">Failed to load job details.</p>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {viewingResume && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-6xl h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Resume Preview & Edit</h3>
              <button
                onClick={() => setViewingResume(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex gap-4 flex-1 min-h-0">
              <div className="w-1/2 flex flex-col">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Document Preview
                </h4>
                <div className="flex-1 border rounded-lg overflow-hidden">
                  {viewingResume.mimeType === "application/pdf" ? (
                    <iframe
                      src={`/uploads/${viewingResume.filePath}`}
                      className="w-full h-full"
                      title="PDF Preview"
                    />
                  ) : (
                    <div className="w-full h-full p-4 overflow-auto bg-gray-50">
                      <pre className="text-sm whitespace-pre-wrap">
                        Document preview not available
                      </pre>
                    </div>
                  )}
                </div>
              </div>
              <div className="w-1/2 flex flex-col">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Extracted Text
                </h4>
                <div className="flex-1 flex flex-col">
                  {editingResume?.id === viewingResume.resumeId ? (
                    <>
                      <textarea
                        value={editingResume.extractedText}
                        onChange={(e) =>
                          setEditingResume({
                            ...editingResume,
                            extractedText: e.target.value,
                          })
                        }
                        className="flex-1 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingResume(null)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() =>
                            handleSave(
                              editingResume.id,
                              editingResume.extractedText
                            )
                          }
                          disabled={saving}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50"
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 p-4 border rounded-lg overflow-auto bg-gray-50 mb-4">
                        <pre className="text-sm whitespace-pre-wrap">
                          {viewingResume.extractedText || "No text available"}
                        </pre>
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() =>
                            setEditingResume({
                              id: viewingResume.resumeId,
                              extractedText: viewingResume.extractedText,
                            })
                          }
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
                        >
                          Edit
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
