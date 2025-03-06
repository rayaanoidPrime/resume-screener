import { BrowserRouter as Router, Routes, Route, Link } from "react-router";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex-shrink-0 flex items-center">
                <Link
                  to="/"
                  className="text-xl sm:text-2xl font-bold text-indigo-600"
                >
                  Resume Screener
                </Link>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-indigo-600 px-2 sm:px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 sm:px-4 py-2 rounded-md text-sm font-medium"
                >
                  Register
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="flex-grow">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                  <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-gray-900">
                      Welcome to Resume Screener
                    </h1>
                    <p className="mt-4 text-center text-gray-600 text-base sm:text-lg">
                      Upload and analyze resumes with ease
                    </p>
                  </div>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
