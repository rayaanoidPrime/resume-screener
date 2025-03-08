import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { sessionApi } from "../services/api";
import JobDetailsForm from "../components/JobDetailsForm";

interface Session {
  id: string;
  jobTitle: string;
  jobDescription: string;
  department: string;
  location: string;
  createdAt: string;
  _count: {
    candidates: number;
  };
}

export default function Dashboard() {
  const [showForm, setShowForm] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSessions = async () => {
      if (!token) return;
      try {
        const data = await sessionApi.getSessions(token);
        setSessions(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch sessions"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [token]);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
          >
            Create Session
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-white shadow rounded-lg p-6">
          <JobDetailsForm />
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading sessions...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          ) : sessions.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {sessions.map((session) => (
                <li key={session.id}>
                  <div
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/sessions/${session.id}`)}
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-indigo-600 truncate">
                            {session.jobTitle}
                          </h3>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <span className="truncate">
                              {session.department}
                            </span>
                            <span className="mx-2">•</span>
                            <span>{session.location}</span>
                          </div>
                        </div>
                        <div className="ml-4 flex flex-col items-end">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {session._count.candidates}{" "}
                            {session._count.candidates === 1
                              ? "Resume"
                              : "Resumes"}
                          </span>
                          <time
                            className="mt-2 text-sm text-gray-500"
                            dateTime={session.createdAt}
                          >
                            {formatDate(session.createdAt)}
                          </time>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {session.jobDescription}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">
                No sessions found. Create one to get started!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
