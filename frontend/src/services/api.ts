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

export interface Resume {
  id: string;
  filePath: string;
  extractedText: string;
  status: string;
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
      [key: string]: string[] | undefined;
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
  evaluation?: {
    keywordScore: number;
    totalScore: number;
  };
}

export interface Bucket {
  id: string;
  name: string;
  isDefault: boolean;
  sessionId: string;
}

export interface Candidate {
  id: string;
  bucketId: string;
  sessionId: string;
  resumes: Resume[];
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

  async getSession(sessionId: string, token: string) {
    try {
      const response = await api.get(`/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getSessions(token: string) {
    try {
      const response = await api.get(`/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  async getResumeDetails(
    sessionId: string,
    resumeId: string,
    token: string
  ): Promise<ResumeDetails> {
    try {
      const response = await api.get(
        `/sessions/${sessionId}/resumes/${resumeId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getBuckets: async (sessionId: string, token: string): Promise<Bucket[]> => {
    const response = await api.get(`/sessions/${sessionId}/buckets`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getCandidates: async (
    sessionId: string,
    token: string
  ): Promise<Candidate[]> => {
    const response = await api.get(`/sessions/${sessionId}/candidates`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  createBucket: async (
    sessionId: string,
    name: string,
    token: string
  ): Promise<Bucket> => {
    const response = await api.post(
      `/sessions/${sessionId}/buckets`,
      { name },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

  updateCandidateBucket: async (
    candidateId: string,
    bucketId: string,
    token: string
  ): Promise<void> => {
    await api.put(
      `/sessions/candidates/${candidateId}/bucket`,
      { bucketId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  },

  deleteBucket: async (
    sessionId: string,
    bucketId: string,
    token: string
  ): Promise<void> => {
    await api.delete(`/sessions/${sessionId}/buckets/${bucketId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  resetBuckets: async (
    sessionId: string,
    token: string
  ): Promise<Candidate[]> => {
    const response = await api.post(
      `/sessions/${sessionId}/buckets/reset`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },
};
