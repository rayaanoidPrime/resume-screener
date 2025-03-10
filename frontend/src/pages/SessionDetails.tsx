import { FormEvent, useState, useRef, useEffect } from "react";
import { useParams, Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { sessionApi } from "../services/api";
import CandidateMetrics from "../components/CandidateMetrics";
import CandidateComparison from "../components/CandidateComparison";
import SkillsMatchVisualizer from "../components/SkillsMatchVisualizer";

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
    qualitativeScore?: number;
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
  const [selectedCandidates, setSelectedCandidates] = useState<
    RankedCandidate[]
  >([]);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    const fetchSessionDetails = async () => {
      if (!sessionId || !token) return;
      try {
        const data = await sessionApi.getSession(sessionId, token);
        setSessionDetails(data);

        // Fetch rankings after getting session details
        try {
          const rankingsData = await sessionApi.getRankings(sessionId, token);
          if (rankingsData && Array.isArray(rankingsData)) {
            setRankings(rankingsData);
          }
        } catch (rankingsErr) {
          console.error("Failed to fetch rankings:", rankingsErr);
          // Don't set error here as we still have session details
        }
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
    setError("");

    console.log("Fetching rankings for session:", sessionId);

    try {
      const data = await sessionApi.getRankings(sessionId, token);
      console.log("Received rankings:", data);

      if (data && Array.isArray(data)) {
        setRankings(data);

        // Show success message only when manually fetching rankings after upload
        const successMessage = document.createElement("div");
        successMessage.className =
          "fixed bottom-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md animate-fadeIn";
        successMessage.innerHTML = `
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium">Successfully evaluated ${data.length} candidates!</p>
            </div>
          </div>
        `;
        document.body.appendChild(successMessage);

        setTimeout(() => {
          if (document.body.contains(successMessage)) {
            document.body.removeChild(successMessage);
          }
        }, 5000);
      } else {
        console.error("Invalid rankings data:", data);
        setError("Received invalid rankings data from server");
      }
    } catch (err) {
      console.error("Error fetching rankings:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch rankings");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const handleJobStatusUpdate = (statuses: Record<string, string>) => {
    console.log("Updating job statuses:", statuses);

    // Create a new status map with the updated statuses
    const statusMap: Record<string, JobStatus> = { ...jobStatuses };

    Object.entries(statuses).forEach(([jobId, status]) => {
      statusMap[jobId] = {
        jobId,
        status,
        progress:
          status === "completed"
            ? 100
            : status === "failed"
            ? 0
            : status === "active"
            ? 75
            : 25,
      };
    });

    console.log("Updated status map:", statusMap);
    setJobStatuses(statusMap);
  };

  useEffect(() => {
    if (!sessionId || !token || !uploadedResumes.length) return;

    console.log("Setting up polling for job statuses...", {
      uploadedResumes,
      jobStatuses: Object.keys(jobStatuses).length,
    });

    const jobIds = uploadedResumes.flatMap((resume) => resume.jobIds);
    if (!jobIds.length) return;

    console.log("Job IDs to poll:", jobIds);

    const pollStatus = async () => {
      try {
        console.log("Polling job statuses...");
        const statuses = await sessionApi.getResumeStatuses(
          sessionId,
          jobIds,
          token
        );
        console.log("Received job statuses:", statuses);
        handleJobStatusUpdate(statuses);

        // Stop polling if all jobs are completed or failed
        const allCompleted = Object.values(statuses).every(
          (status) => status === "completed" || status === "failed"
        );

        if (allCompleted) {
          console.log("All jobs completed or failed, stopping polling");
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = undefined;
          }

          // Automatically fetch rankings when all jobs are completed
          const hasCompletedJobs = Object.values(statuses).some(
            (status) => status === "completed"
          );

          if (hasCompletedJobs) {
            console.log(
              "Some jobs completed successfully, fetching rankings..."
            );
            // Add a small delay to ensure backend processing is complete
            setTimeout(() => {
              fetchRankings();
            }, 1000);
          }
        }
      } catch (error) {
        console.error("Failed to get job statuses:", error);
      }
    };

    // Initial poll
    pollStatus();

    // Set up polling interval
    if (!pollingIntervalRef.current) {
      console.log("Setting up polling interval (5 seconds)");
      pollingIntervalRef.current = window.setInterval(pollStatus, 5000);
    }

    return () => {
      console.log("Cleaning up polling interval");
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = undefined;
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

  // Toggle candidate selection for comparison
  const toggleCandidateSelection = (candidate: RankedCandidate) => {
    if (selectedCandidates.some((c) => c.resumeId === candidate.resumeId)) {
      setSelectedCandidates(
        selectedCandidates.filter((c) => c.resumeId !== candidate.resumeId)
      );
    } else {
      if (selectedCandidates.length < 5) {
        // Limit to 5 candidates for comparison
        setSelectedCandidates([...selectedCandidates, candidate]);
      } else {
        setError("You can compare up to 5 candidates at a time");
      }
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
              <h1 className="text-2xl font-bold text-white tracking-wide">
                {sessionDetails.jobTitle}
              </h1>
              <div className="mt-2 flex flex-wrap gap-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white text-blue-800">
                  {sessionDetails.department}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white text-blue-800">
                  {sessionDetails.location}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white text-blue-800">
                  {sessionDetails.employmentType}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white text-blue-800">
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
                  shadow-sm text-sm font-medium rounded-md text-on-dark bg-blue-600 
                  hover:bg-blue-700 focus:outline-none focus:ring-2 
                  focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </form>

            {/* Processing Status Section */}
            {Object.keys(jobStatuses).length > 0 && (
              <div className="mt-6 border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Processing Status
                  </h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <svg
                      className="h-4 w-4 mr-1 text-gray-400 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>Updating every 5 seconds</span>
                  </div>
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="text-sm font-medium text-blue-800">
                      Total Jobs
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {Object.keys(jobStatuses).length}
                    </div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                    <div className="text-sm font-medium text-yellow-800">
                      Waiting
                    </div>
                    <div className="text-2xl font-bold text-yellow-900">
                      {
                        Object.values(jobStatuses).filter(
                          (s) => s.status === "waiting"
                        ).length
                      }
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <div className="text-sm font-medium text-green-800">
                      Completed
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      {
                        Object.values(jobStatuses).filter(
                          (s) => s.status === "completed"
                        ).length
                      }
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                    <div className="text-sm font-medium text-red-800">
                      Failed
                    </div>
                    <div className="text-2xl font-bold text-red-900">
                      {
                        Object.values(jobStatuses).filter(
                          (s) => s.status === "failed"
                        ).length
                      }
                    </div>
                  </div>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {Object.values(jobStatuses).map((status) => (
                    <div
                      key={status.jobId}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-200 transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center">
                          {status.status === "completed" && (
                            <svg
                              className="h-5 w-5 mr-2 text-green-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                          {status.status === "failed" && (
                            <svg
                              className="h-5 w-5 mr-2 text-red-500"
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
                          )}
                          {status.status === "active" && (
                            <svg
                              className="h-5 w-5 mr-2 text-blue-500 animate-spin"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          )}
                          {status.status === "waiting" && (
                            <svg
                              className="h-5 w-5 mr-2 text-yellow-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          )}
                          <span
                            className={`text-sm font-medium ${
                              status.status === "completed"
                                ? "text-green-600"
                                : status.status === "failed"
                                ? "text-red-600"
                                : status.status === "active"
                                ? "text-blue-600"
                                : "text-yellow-600"
                            }`}
                          >
                            Job {status.jobId.substring(0, 8)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                            {status.status.toUpperCase()}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            {status.progress}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`rounded-full h-2 transition-all duration-500 ${
                            status.status === "completed"
                              ? "bg-green-500"
                              : status.status === "failed"
                              ? "bg-red-500"
                              : status.status === "active"
                              ? "bg-blue-500"
                              : "bg-yellow-500"
                          }`}
                          style={{ width: `${status.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Completion notice */}
                {Object.values(jobStatuses).every(
                  (status) =>
                    status.status === "completed" || status.status === "failed"
                ) && (
                  <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md border border-green-200 animate-fadeIn">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-green-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">
                          Processing Complete
                        </h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>
                            All resume processing jobs have completed. You can
                            now evaluate the candidates.
                          </p>
                        </div>
                        <div className="mt-4">
                          <button
                            onClick={fetchRankings}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-on-dark bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <svg
                              className="mr-2 h-5 w-5 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                              />
                            </svg>
                            Evaluate Candidates
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rankings Section with CandidateMetrics */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Candidate Rankings
              </h2>

              {/* Add Compare button when candidates are selected */}
              {selectedCandidates.length > 1 && (
                <button
                  onClick={() => setShowComparison(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-on-dark bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Compare Selected ({selectedCandidates.length})
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Evaluating candidates...</p>
              </div>
            ) : rankings.length > 0 ? (
              <>
                {/* Add CandidateMetrics component */}
                <div className="mb-8">
                  <CandidateMetrics rankings={rankings} />
                </div>

                {/* Existing rankings table with selection checkboxes */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Select
                        </th>
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
                        <tr
                          key={candidate.resumeId}
                          className={
                            selectedCandidates.some(
                              (c) => c.resumeId === candidate.resumeId
                            )
                              ? "bg-blue-50"
                              : ""
                          }
                        >
                          <td className="px-3 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedCandidates.some(
                                (c) => c.resumeId === candidate.resumeId
                              )}
                              onChange={() =>
                                toggleCandidateSelection(candidate)
                              }
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {candidate.structuredData?.contact_info?.name ||
                              "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>
                              {candidate.structuredData?.contact_info
                                ?.email && (
                                <div>
                                  {candidate.structuredData.contact_info.email}
                                </div>
                              )}
                              {candidate.structuredData?.contact_info
                                ?.phone && (
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
                                handleViewResume(candidate.resumeId)
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
              </>
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

      {/* Resume Viewing Modal with SkillsMatchVisualizer */}
      {viewingResume && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
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
              {/* Middle Panel - Structured Data */}
              <div className="w-1/2 flex flex-col overflow-hidden">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Parsed Information
                </h4>
                {loadingResume ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : resumeDetails ? (
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {/* Contact Information */}
                    <div className="bg-white rounded-lg border border-gray-200">
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
                            <p key={key} className="text-sm break-words">
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
                      <div className="bg-white rounded-lg border border-gray-200">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                          <h5 className="font-semibold text-gray-900">
                            Professional Summary
                          </h5>
                        </div>
                        <div className="p-4">
                          <p className="text-sm text-gray-700 break-words">
                            {resumeDetails.structuredData.summary}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Experience */}
                    {resumeDetails.structuredData.experience.length > 0 && (
                      <div className="bg-white rounded-lg border border-gray-200">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                          <h5 className="font-semibold text-gray-900">
                            Work Experience
                          </h5>
                        </div>
                        <div className="divide-y divide-gray-200">
                          {(resumeDetails.structuredData.experience || []).map(
                            (exp, index) => (
                              <div key={index} className="p-4">
                                <h6 className="font-medium text-gray-900 break-words">
                                  {exp?.title || "Unknown Position"}
                                </h6>
                                <p className="text-sm text-gray-700 mt-1 break-words">
                                  {exp?.company || "Unknown Company"}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                  {exp?.dates || "No dates"} •{" "}
                                  {exp?.location || "No location"}
                                </p>
                                {exp?.description?.length > 0 && (
                                  <ul className="mt-2 space-y-1">
                                    {(exp?.description || []).map((desc, i) => (
                                      <li
                                        key={i}
                                        className="text-sm text-gray-600 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-gray-400 break-words"
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
                    {Object.keys(resumeDetails.structuredData.skills || {})
                      .length > 0 && (
                      <div className="bg-white rounded-lg border border-gray-200">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                          <h5 className="font-semibold text-gray-900">
                            Skills
                          </h5>
                        </div>
                        <div className="p-4">
                          {Object.entries(
                            resumeDetails.structuredData.skills || {}
                          ).map(([category, skills]) =>
                            skills && skills.length > 0 ? (
                              <div key={category} className="mb-4 last:mb-0">
                                <h6 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                                  {category.replace("_", " ")}
                                </h6>
                                <div className="flex flex-wrap gap-1.5">
                                  {(skills || []).map((skill, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
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
                      <div className="bg-white rounded-lg border border-gray-200">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                          <h5 className="font-semibold text-gray-900">
                            Education
                          </h5>
                        </div>
                        <div className="divide-y divide-gray-200">
                          {(resumeDetails.structuredData.education || []).map(
                            (edu, index) => (
                              <div key={index} className="p-4">
                                <h6 className="font-medium text-gray-900 break-words">
                                  {edu?.degree || "Degree"} in{" "}
                                  {edu?.field || "Unknown Field"}
                                </h6>
                                <p className="text-sm text-gray-700 mt-1 break-words">
                                  {edu?.institution || "Unknown Institution"}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                  {edu?.dates || "No dates"}
                                </p>
                                {edu?.gpa && (
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
                    {resumeDetails.structuredData?.projects?.length > 0 && (
                      <div className="bg-white rounded-lg border border-gray-200">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                          <h5 className="font-semibold text-gray-900">
                            Projects
                          </h5>
                        </div>
                        <div className="divide-y divide-gray-200">
                          {(resumeDetails.structuredData?.projects || []).map(
                            (project, index) => (
                              <div key={index} className="p-4">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <h6 className="font-medium text-gray-900 break-words">
                                    {project?.name || "Untitled Project"}
                                  </h6>
                                  {project?.link && (
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
                                <p className="text-sm text-gray-600 mt-2 break-words">
                                  {project?.description ||
                                    "No description available"}
                                </p>
                                {project?.technologies?.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {(project?.technologies || []).map(
                                      (tech, i) => (
                                        <span
                                          key={i}
                                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
                                        >
                                          {tech}
                                        </span>
                                      )
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Skills Match Visualizer */}
                    <div className="bg-white rounded-lg border border-gray-200">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <h5 className="font-semibold text-gray-900">
                          Skills Match
                        </h5>
                      </div>
                      <div className="p-4">
                        <SkillsMatchVisualizer
                          requiredSkills={sessionDetails?.requiredSkills || []}
                          preferredSkills={
                            sessionDetails?.preferredSkills || []
                          }
                          candidateSkills={
                            resumeDetails.structuredData.skills || {}
                          }
                        />
                      </div>
                    </div>
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
              <div className="w-1/2 flex flex-col bg-gray-50 rounded-lg p-4">
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

      {/* Candidate Comparison Modal */}
      {showComparison && (
        <CandidateComparison
          candidates={selectedCandidates.map((candidate) => ({
            resumeId: candidate.resumeId,
            candidateId: candidate.candidateId,
            name:
              candidate.structuredData?.contact_info?.name ||
              "Unknown Candidate",
            scores: {
              keywordScore: candidate.scores?.keywordScore || 0,
              qualitativeScore: candidate.scores?.qualitativeScore || 0,
              totalScore: candidate.scores?.totalScore || 0,
            },
            structuredData: {
              contact_info: {
                name: candidate.structuredData?.contact_info?.name || null,
                email: candidate.structuredData?.contact_info?.email || null,
                phone: candidate.structuredData?.contact_info?.phone || null,
              },
              skills: candidate.structuredData?.skills || {},
              experience: candidate.structuredData?.experience || [],
            },
          }))}
          requiredSkills={sessionDetails?.requiredSkills || []}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
}
