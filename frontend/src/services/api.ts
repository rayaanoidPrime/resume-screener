import axios, { AxiosError } from "axios";

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

interface JobFormData {
  jobTitle: string;
  department: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  jobDescription: string;
  requiredSkills: string[];
  preferredSkills: string[];
  educationRequired: string;
  educationPreferred: string;
  responsibilities: string[];
}

interface SessionResponse {
  id: string;
  jobTitle: string;
  department: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  jobDescription: string;
  requiredSkills: string[];
  preferredSkills: string[];
  educationRequired: string;
  educationPreferred: string | null;
  responsibilities: string[];
  createdAt: string;
  updatedAt: string;
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

const handleApiError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error: string }>;
    throw new Error(
      axiosError.response?.data?.error ||
        axiosError.message ||
        "An error occurred"
    );
  }
  throw error;
};

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
    data: JobFormData,
    token: string
  ): Promise<SessionResponse> {
    const response = await fetch(`${API_URL}/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to create session");
    }

    return response.json();
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

  getRankings: async (sessionId: string, token: string) => {
    const response = await fetch(`${API_URL}/sessions/${sessionId}/rankings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch rankings");
    }

    return response.json();
  },

  async getSession(sessionId: string, token: string) {
    try {
      const response = await axios.get(`${API_URL}/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getSessions(token: string) {
    try {
      const response = await axios.get(`${API_URL}/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};
