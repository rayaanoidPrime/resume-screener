import { FormEvent, useState, useRef, useEffect } from "react";
import { useParams, Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { sessionApi } from "../services/api";

interface JobStatus {
  jobId: string;
  status: string;
  progress: number;
}

interface JobStatusResponse {
  jobId: string;
  status: string;
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

interface EvaluationResult {
  candidateId: string;
  keywordScore: number;
  totalScore: number;
}

interface SelectedCandidate {
  candidateId: string;
  keywordScore: number;
  totalScore: number;
}

interface ViewingResume {
  resumeId: string;
  filePath: string;
  mimeType: string;
  extractedText: string;
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
  const [evaluationResults, setEvaluationResults] = useState<
    EvaluationResult[]
  >([]);
  const [selectedCandidate, setSelectedCandidate] =
    useState<SelectedCandidate | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingIntervalRef = useRef<number | undefined>(undefined);
  const [viewingResume, setViewingResume] = useState<ViewingResume | null>(
    null
  );

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

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

  const handleEvaluate = async () => {
    if (!sessionId || !token) return;

    setIsEvaluating(true);
    try {
      const results = await sessionApi.evaluateSession(sessionId, token);
      setEvaluationResults(results);
    } catch (error) {
      console.error("Evaluation failed:", error);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Session Details
        </h1>
        <p className="text-gray-600 mb-6">Session ID: {sessionId}</p>

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Upload Resumes
              </label>
              <div className="mt-1 flex items-center space-x-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.docx"
                  multiple
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <button
                  type="submit"
                  disabled={uploading}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    uploading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}
          </div>
        </form>

        {uploadedResumes.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Processed Resumes
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Resume #
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Job ID
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {uploadedResumes.map((resume, index) => {
                    const jobId = resume.jobIds[0];
                    const jobStatus = jobStatuses[jobId];
                    return (
                      <tr key={jobId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Resume #{index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {jobId.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${
                              jobStatus?.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : jobStatus?.status === "failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {jobStatus?.status === "completed"
                              ? "Completed"
                              : jobStatus?.status === "failed"
                              ? "Failed"
                              : jobStatus?.status === "waiting"
                              ? "Waiting"
                              : "Processing"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() =>
                              setViewingResume({
                                resumeId: resume.files[0]?.resumeId || "",
                                filePath: resume.files[0]?.filePath || "",
                                mimeType: resume.files[0]?.mimeType || "",
                                extractedText: resume.extractedText || "",
                              })
                            }
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View/Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* View/Edit Resume Modal */}
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

        <div className="mt-4">
          <button
            onClick={handleEvaluate}
            disabled={isEvaluating}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
          >
            {isEvaluating ? "Evaluating..." : "Evaluate Resumes"}
          </button>
        </div>

        {evaluationResults.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Evaluation Results</h2>
            <div className="flex flex-col gap-2">
              {evaluationResults
                .sort((a, b) => b.totalScore - a.totalScore)
                .map((result) => (
                  <div
                    key={result.candidateId}
                    onClick={() => setSelectedCandidate(result)}
                    className="p-4 bg-gray-100 rounded cursor-pointer hover:bg-gray-200"
                  >
                    <div className="flex justify-between items-center">
                      <span>Candidate {result.candidateId.slice(0, 8)}</span>
                      <span className="font-semibold">
                        Score: {(result.totalScore * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {selectedCandidate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Evaluation Details</h3>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Keyword Score:</span>{" "}
                  {(selectedCandidate.keywordScore * 100).toFixed(1)}%
                </p>
                <p>
                  <span className="font-medium">Total Score:</span>{" "}
                  {(selectedCandidate.totalScore * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
