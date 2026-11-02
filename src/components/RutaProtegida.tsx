import { Navigate, Outlet, useLocation } from "react-router";

export default function RutaProtegida() {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
