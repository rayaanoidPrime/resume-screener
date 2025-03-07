import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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

interface ResumeFile {
  jobId: string;
  resumeId: string;
  filePath: string;
  mimeType: string;
}

interface ResumeResponse {
  jobIds: string[];
  message: string;
  files: ResumeFile[];
}

interface ResumeUpdateResponse {
  id: string;
  extractedText: string;
  status: string;
}

export const authApi = {
  async register(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post("/auth/register", { email, password });
    return response.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },
};

export const sessionApi = {
  async createSession(
    jobDescription: string,
    token: string
  ): Promise<SessionResponse> {
    const response = await api.post(
      "/sessions",
      { jobDescription },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  uploadResumes: async (
    sessionId: string,
    formData: FormData,
    token: string
  ): Promise<ResumeResponse> => {
    const response = await api.post(
      `/sessions/${sessionId}/resumes`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  getResumeStatuses: async (
    sessionId: string,
    jobIds: string[],
    token: string
  ): Promise<{ [jobId: string]: string }> => {
    const response = await api.get(
      `/sessions/${sessionId}/resumes/status?jobIds=${jobIds.join(",")}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  updateResume: async (
    resumeId: string,
    extractedText: string,
    token: string
  ): Promise<ResumeUpdateResponse> => {
    const response = await api.patch(
      `/sessions/resumes/${resumeId}`,
      { extractedText },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  evaluateSession: async (sessionId: string, token: string) => {
    const response = await api.post(
      `/sessions/${sessionId}/evaluate`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },
};
