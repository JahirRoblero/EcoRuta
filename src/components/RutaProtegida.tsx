import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import type { Rol } from "../context/AuthContext";

interface Props {
  rolRequerido?: Rol;
}

export default function RutaProtegida({ rolRequerido }: Props) {
  const { estaAutenticado, rol } = useAuth();
  const location = useLocation();

  if (!estaAutenticado) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (rolRequerido && rol !== rolRequerido) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
