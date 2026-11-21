import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";

interface ProtectedRouteProps {
  roles?: string[];
}

export const ProtectedRoute = ({ roles }: ProtectedRouteProps) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.VaiTro)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
