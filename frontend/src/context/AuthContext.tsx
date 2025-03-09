import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authApi } from "../services/api";

interface User {
  id?: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      setIsAuthenticated(true);
      
      // Extract user email from token (simplified approach)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.email) {
          setUser({ email: payload.email });
        }
      } catch (error) {
        console.error("Failed to parse token:", error);
      }
    } else {
      localStorage.removeItem("token");
      setIsAuthenticated(false);
      setUser(null);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    if (response.token) {
      setToken(response.token);
      setUser({ email });
    }
  };

  const register = async (email: string, password: string) => {
    await authApi.register(email, password);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, token, user, login, logout, register }}
    >
      {children}
    </AuthContext.Provider>
  );
}
