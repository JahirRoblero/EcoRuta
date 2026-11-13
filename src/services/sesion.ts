/** Obtiene el rol (CIUDADANO, CONDUCTOR, ADMINISTRADOR) guardado en el JWT. */
export function obtenerRol(token: string | null): string | null {
  if (!token) return null;

  try {
    const partes = token.split(".");

    if (partes.length !== 3) return null;

    const payload = JSON.parse(
      atob(partes[1].replace(/-/g, "+").replace(/_/g, "/")),
    );

    return typeof payload.rol === "string" ? payload.rol : null;
  } catch {
    return null;
  }
}
