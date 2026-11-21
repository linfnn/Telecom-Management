import { useEffect, useState, type ReactNode } from "react";
import { fetchMeApi } from "../../api/authApi";
import type { LoginUser } from "../../api/authApi";
import { AuthContext } from "./AuthContextDefinition";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<LoginUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          // Gọi API fetch user thay vì lấy từ localStorage
          const account = await fetchMeApi();
          setUser(account);
          setIsAuthenticated(true);
        } catch {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    void loadUser();
  }, []);

  const login = (token: string, refreshToken: string, userData: LoginUser) => {
    localStorage.setItem("accessToken", token);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      setUser(await fetchMeApi());
    } catch (error) {
      console.error("Failed to refresh user", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, login, logout, loading, setLoading, refreshUser }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
