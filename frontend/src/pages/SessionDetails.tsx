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

interface ResumeDetails {
  filePath: string;
  extractedText: string;
  mimeType: string;
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
  };
  metricScores: {
    keywordScore: number;
    totalScore: number;
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
  const [resumeDetails, setResumeDetails] = useState<ResumeDetails | null>(
    null
  );
  const [loadingResume, setLoadingResume] = useState(false);

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

  const handleViewResume = async (resumeId: string) => {
    if (!sessionId || !token) return;

    setLoadingResume(true);
    try {
      const details = await sessionApi.getResumeDetails(
        sessionId,
        resumeId,
        token
      );
      setResumeDetails(details);
      setViewingResume({
        resumeId,
        filePath: details.filePath,
        mimeType: details.mimeType,
        extractedText: details.extractedText,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load resume details"
      );
    } finally {
      setLoadingResume(false);
    }
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
                            onClick={() => handleViewResume(candidate.resumeId)}
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
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-7xl h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Resume Details
                </h3>
                {resumeDetails?.structuredData.contact_info.name && (
                  <p className="text-sm text-gray-600 mt-1">
                    {resumeDetails.structuredData.contact_info.name}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setViewingResume(null);
                  setResumeDetails(null);
                }}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex gap-6 flex-1 min-h-0 pt-4">
              {/* Left Panel - Document Preview */}
              <div className="w-1/3 flex flex-col bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Document Preview
                </h4>
                <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden bg-white">
                  {viewingResume.mimeType === "application/pdf" ? (
                    <iframe
                      src={`/uploads/${viewingResume.filePath}`}
                      className="w-full h-full"
                      title="PDF Preview"
                    />
                  ) : (
                    <div className="w-full h-full p-4 overflow-auto">
                      <p className="text-sm text-gray-500 text-center mt-4">
                        Preview not available for this file type
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Middle Panel - Structured Data */}
              <div className="w-1/3 flex flex-col">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Parsed Information
                </h4>
                {loadingResume ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : resumeDetails ? (
                  <div className="flex-1 overflow-y-auto pr-4 space-y-6">
                    {/* Contact Information */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <h5 className="font-semibold text-gray-900">
                          Contact Information
                        </h5>
                      </div>
                      <div className="p-4 space-y-2">
                        {Object.entries(
                          resumeDetails.structuredData.contact_info
                        )
                          .filter(([_, value]) => value !== null)
                          .map(([key, value]) => (
                            <p key={key} className="text-sm">
                              <span className="font-medium text-gray-700 capitalize">
                                {key.replace("_", " ")}:
                              </span>{" "}
                              <span className="text-gray-900">{value}</span>
                            </p>
                          ))}
                      </div>
                    </div>

                    {/* Summary */}
                    {resumeDetails.structuredData.summary && (
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                          <h5 className="font-semibold text-gray-900">
                            Professional Summary
                          </h5>
                        </div>
                        <div className="p-4">
                          <p className="text-sm text-gray-700">
                            {resumeDetails.structuredData.summary}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Experience */}
                    {resumeDetails.structuredData.experience.length > 0 && (
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                          <h5 className="font-semibold text-gray-900">
                            Work Experience
                          </h5>
                        </div>
                        <div className="divide-y divide-gray-200">
                          {resumeDetails.structuredData.experience.map(
                            (exp, index) => (
                              <div key={index} className="p-4">
                                <h6 className="font-medium text-gray-900">
                                  {exp.title}
                                </h6>
                                <p className="text-sm text-gray-700 mt-1">
                                  {exp.company}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                  {exp.dates} • {exp.location}
                                </p>
                                {exp.description.length > 0 && (
                                  <ul className="mt-2 space-y-1">
                                    {exp.description.map((desc, i) => (
                                      <li
                                        key={i}
                                        className="text-sm text-gray-600 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-gray-400"
                                      >
                                        {desc}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Skills */}
                    {Object.keys(resumeDetails.structuredData.skills).length >
                      0 && (
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                          <h5 className="font-semibold text-gray-900">
                            Skills
                          </h5>
                        </div>
                        <div className="p-4 space-y-4">
                          {Object.entries(
                            resumeDetails.structuredData.skills
                          ).map(([category, skills]) =>
                            skills && skills.length > 0 ? (
                              <div key={category}>
                                <h6 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                                  {category.replace("_", " ")}
                                </h6>
                                <div className="flex flex-wrap gap-2">
                                  {skills.map((skill, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : null
                          )}
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {resumeDetails.structuredData.education && (
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                          <h5 className="font-semibold text-gray-900">
                            Education
                          </h5>
                        </div>
                        <div className="divide-y divide-gray-200">
                          {resumeDetails.structuredData.education.map(
                            (edu, index) => (
                              <div key={index} className="p-4">
                                <h6 className="font-medium text-gray-900">
                                  {edu.degree} in {edu.field}
                                </h6>
                                <p className="text-sm text-gray-700 mt-1">
                                  {edu.institution}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                  {edu.dates}
                                </p>
                                {edu.gpa && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    GPA: {edu.gpa}
                                  </p>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Projects */}
                    {resumeDetails.structuredData.projects.length > 0 && (
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                          <h5 className="font-semibold text-gray-900">
                            Projects
                          </h5>
                        </div>
                        <div className="divide-y divide-gray-200">
                          {resumeDetails.structuredData.projects.map(
                            (project, index) => (
                              <div key={index} className="p-4">
                                <div className="flex items-center justify-between">
                                  <h6 className="font-medium text-gray-900">
                                    {project.name}
                                  </h6>
                                  {project.link && (
                                    <a
                                      href={project.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:text-blue-800"
                                    >
                                      View Project ↗
                                    </a>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-2">
                                  {project.description}
                                </p>
                                {project.technologies.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {project.technologies.map((tech, i) => (
                                      <span
                                        key={i}
                                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
                                      >
                                        {tech}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm text-gray-500">
                      No resume data available
                    </p>
                  </div>
                )}
              </div>

              {/* Right Panel - Extracted Text */}
              <div className="w-1/3 flex flex-col bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Raw Text
                  </h4>
                  {!editingResume && (
                    <button
                      onClick={() =>
                        setEditingResume({
                          id: viewingResume.resumeId,
                          extractedText: viewingResume.extractedText,
                        })
                      }
                      className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg
                        className="h-3.5 w-3.5 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit
                    </button>
                  )}
                </div>
                {editingResume?.id === viewingResume.resumeId ? (
                  <div className="flex-1 flex flex-col">
                    <textarea
                      value={editingResume.extractedText}
                      onChange={(e) =>
                        setEditingResume({
                          ...editingResume,
                          extractedText: e.target.value,
                        })
                      }
                      className="flex-1 p-4 text-sm border rounded-lg resize-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                      placeholder="Enter extracted text..."
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingResume(null)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {saving ? (
                          <>
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 p-4 border rounded-lg overflow-auto bg-white">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {viewingResume.extractedText || "No text available"}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
