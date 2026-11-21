import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";

export const PublicRoute = () => {
  const { user } = useAuth();

  // Nếu đã login rồi thì không cho vào trang login nữa, đá về dashboard/home
  return !user ? <Outlet /> : <Navigate to="/" replace />;
};
