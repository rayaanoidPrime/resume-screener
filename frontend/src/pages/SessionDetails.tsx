import { FormEvent, useState, useRef } from "react";
import { useParams, Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { sessionApi } from "../services/api";

interface ResumeUploadResult {
  resumeId: string;
  extractedText: string | null;
  status: "processed" | "review_needed";
}

export default function SessionDetails() {
  const { sessionId } = useParams();
  const { isAuthenticated, token } = useAuth();
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedResumes, setUploadedResumes] = useState<ResumeUploadResult[]>(
    []
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const file = fileInputRef.current?.files?.[0];
    if (!file || !sessionId || !token) {
      setError("Please select a file to upload");
      return;
    }

    setUploading(true);
    try {
      const result = await sessionApi.uploadResume(sessionId, file, token);
      setUploadedResumes((prev) => [...prev, result]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload resume");
    } finally {
      setUploading(false);
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
                Upload Resume
              </label>
              <div className="mt-1 flex items-center space-x-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.docx"
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
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Uploaded Resumes
            </h2>
            {uploadedResumes.map((resume, index) => (
              <div key={resume.resumeId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500">
                    Resume #{index + 1}
                  </span>
                  <span
                    className={`text-sm font-medium px-2 py-1 rounded-full ${
                      resume.status === "processed"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {resume.status === "processed"
                      ? "Processed"
                      : "Review Needed"}
                  </span>
                </div>
                {resume.status === "processed" && resume.extractedText ? (
                  <div className="mt-2 p-4 bg-gray-50 rounded border text-sm text-gray-700 whitespace-pre-wrap">
                    {resume.extractedText}
                  </div>
                ) : (
                  <div className="mt-2 p-4 bg-yellow-50 rounded border text-sm text-yellow-700">
                    Text extraction needs review. Please check the file
                    manually.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
