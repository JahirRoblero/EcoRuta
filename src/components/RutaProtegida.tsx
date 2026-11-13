import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";

interface RutaProtegidaProps {
  roles?: string[];
}

export default function RutaProtegida({ roles }: RutaProtegidaProps) {
  const { estaAutenticado, rol } = useAuth();
  const location = useLocation();

  if (!estaAutenticado) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && (!rol || !roles.includes(rol))) {
    return <Navigate to={rol === "CONDUCTOR" ? "/operador" : "/"} replace />;
  }

  return <Outlet />;
}
