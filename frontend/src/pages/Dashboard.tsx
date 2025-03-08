import { useState } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import JobDetailsForm from "../components/JobDetailsForm";

export default function Dashboard() {
  const [showForm, setShowForm] = useState(false);
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

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
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-lg text-gray-700">Welcome to your dashboard!</p>
          <p className="mt-2 text-gray-600">
            Create a new session to start screening resumes.
          </p>
        </div>
      )}
    </div>
  );
}
