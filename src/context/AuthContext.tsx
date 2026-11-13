import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import type { ReactNode } from "react";
import { obtenerRol } from "../services/sesion";

interface AuthContextType {
  token: string | null;
  rol: string | null;
  estaAutenticado: boolean;
  guardarSesion: (token: string) => void;
  cerrarSesion: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function obtenerExpiracion(token: string): number | null {
  try {
    const partes = token.split(".");

    if (partes.length !== 3) return null;

    const payload = JSON.parse(
      atob(partes[1].replace(/-/g, "+").replace(/_/g, "/")),
    );

    if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) {
      return null;
    }

    return payload.exp * 1000;
  } catch {
    return null;
  }
}

function obtenerTokenInicial(): string | null {
  const token = localStorage.getItem("token");

  if (!token) return null;

  const expiracion = obtenerExpiracion(token);

  if (!expiracion || expiracion <= Date.now()) {
    localStorage.removeItem("token");
    return null;
  }

  return token;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(obtenerTokenInicial);

  const guardarSesion = useCallback((nuevoToken: string) => {
    const expiracion = obtenerExpiracion(nuevoToken);

    if (!expiracion || expiracion <= Date.now()) {
      localStorage.removeItem("token");
      setToken(null);
      return;
    }

    localStorage.setItem("token", nuevoToken);
    setToken(nuevoToken);
  }, []);

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
  }, []);

  useEffect(() => {
    if (!token) return;

    const expiracion = obtenerExpiracion(token);

    if (!expiracion || expiracion <= Date.now()) {
      cerrarSesion();
      return;
    }

    const tiempoRestante = expiracion - Date.now();

    const temporizador = window.setTimeout(cerrarSesion, tiempoRestante);

    const verificarExpiracion = () => {
      if (Date.now() >= expiracion) {
        cerrarSesion();
      }
    };

    window.addEventListener("focus", verificarExpiracion);

    return () => {
      window.clearTimeout(temporizador);
      window.removeEventListener("focus", verificarExpiracion);
    };
  }, [token, cerrarSesion]);

  useEffect(() => {
    window.addEventListener("ecorruta:sesion-expirada", cerrarSesion);

    return () => {
      window.removeEventListener("ecorruta:sesion-expirada", cerrarSesion);
    };
  }, [cerrarSesion]);

  useEffect(() => {
    const sincronizar = (evento: StorageEvent) => {
      if (evento.key !== "token") return;

      const nuevoToken = evento.newValue;

      if (!nuevoToken) {
        setToken(null);
        return;
      }

      const expiracion = obtenerExpiracion(nuevoToken);

      setToken(expiracion && expiracion > Date.now() ? nuevoToken : null);
    };

    window.addEventListener("storage", sincronizar);

    return () => {
      window.removeEventListener("storage", sincronizar);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        rol: obtenerRol(token),
        estaAutenticado: Boolean(token),
        guardarSesion,
        cerrarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error("useAuth debe utilizarse dentro de AuthProvider");
  }

  return contexto;
}
