import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SessionDetails from "./pages/SessionDetails";
import Navbar from "./components/Navbar";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/sessions/:sessionId" element={<SessionDetails />} />
              <Route
                path="/"
                element={
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
                      <div className="text-center max-w-3xl mx-auto">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                          Streamline Your Hiring Process
                        </h1>
                        <p className="mt-6 text-xl text-gray-600">
                          3S Resume Screener helps HR professionals evaluate candidates faster and more effectively.
                        </p>
                        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                          <a href="/register" className="btn btn-primary px-8 py-3 text-base">
                            Get Started
                          </a>
                          <a href="/login" className="btn btn-secondary px-8 py-3 text-base">
                            Sign In
                          </a>
                        </div>
                      </div>
                      
                      {/* Features section */}
                      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                        <div className="card p-6">
                          <div className="h-12 w-12 rounded-md bg-blue-100 flex items-center justify-center mb-4">
                            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Bulk Resume Upload</h3>
                          <p className="text-gray-600">
                            Upload multiple resumes at once and process them in the background.
                          </p>
                        </div>
                        
                        <div className="card p-6">
                          <div className="h-12 w-12 rounded-md bg-green-100 flex items-center justify-center mb-4">
                            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Ranking</h3>
                          <p className="text-gray-600">
                            Automatically rank candidates based on their match to your job requirements.
                          </p>
                        </div>
                        
                        <div className="card p-6">
                          <div className="h-12 w-12 rounded-md bg-purple-100 flex items-center justify-center mb-4">
                            <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Visual Analytics</h3>
                          <p className="text-gray-600">
                            Compare candidates with interactive charts and detailed skill analysis.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              />
            </Routes>
          </main>
          
          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="md:flex md:items-center md:justify-between">
                <div className="flex justify-center md:order-2 space-x-6">
                  <a href="#" className="text-gray-400 hover:text-gray-500">
                    <span className="sr-only">Privacy Policy</span>
                    Privacy
                  </a>
                  <a href="#" className="text-gray-400 hover:text-gray-500">
                    <span className="sr-only">Terms of Service</span>
                    Terms
                  </a>
                  <a href="#" className="text-gray-400 hover:text-gray-500">
                    <span className="sr-only">Contact</span>
                    Contact
                  </a>
                </div>
                <div className="mt-8 md:mt-0 md:order-1">
                  <p className="text-center text-base text-gray-400">
                    &copy; 2025 3S Capital Resume Screener. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
