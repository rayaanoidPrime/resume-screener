const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface AuthResponse {
  token?: string;
  message?: string;
  error?: string;
  userId?: string;
}

interface SessionResponse {
  sessionId: string;
  error?: string;
}

interface ResumeResponse {
  resumeId: string;
  extractedText: string | null;
  status: "processed" | "review_needed";
}

export const authApi = {
  async register(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Registration failed");
    }
    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }
    return data;
  },
};

export const sessionApi = {
  async createSession(
    jobDescription: string,
    token: string
  ): Promise<SessionResponse> {
    const response = await fetch(`${API_URL}/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ jobDescription }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to create session");
    }
    return data;
  },

  async uploadResume(
    sessionId: string,
    file: File,
    token: string
  ): Promise<ResumeResponse> {
    const formData = new FormData();
    formData.append("resume", file);

    const response = await fetch(`${API_URL}/sessions/${sessionId}/resumes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to upload resume");
    }
    return data;
  },
};
