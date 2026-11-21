import { createContext } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { LoginUser } from "../../api/authApi";

export interface AuthContextType {
  isAuthenticated: boolean;
  user: LoginUser | null;
  login: (token: string, refreshToken: string, userData: LoginUser) => void;
  logout: () => void;
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
