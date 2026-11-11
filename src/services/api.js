const API_URL = import.meta.env.VITE_API_URL;

export async function apiFetch(ruta, opciones = {}) {
  const { requiereAuth = true, headers = {}, ...configuracion } = opciones;

  const token = localStorage.getItem("token");

  const encabezados = new Headers(headers);

  if (
    configuracion.body &&
    !(configuracion.body instanceof FormData) &&
    !encabezados.has("Content-Type")
  ) {
    encabezados.set("Content-Type", "application/json");
  }

  if (requiereAuth && token) {
    encabezados.set("Authorization", `Bearer ${token}`);
  }

  const respuesta = await fetch(`${API_URL}${ruta}`, {
    ...configuracion,
    headers: encabezados,
  });

  if (respuesta.status === 401 && requiereAuth) {
    if (localStorage.getItem("token") === token) {
      window.dispatchEvent(new Event("ecorruta:sesion-expirada"));
    }

    const error = new Error("Sesión expirada o no válida");
    error.status = 401;

    throw error;
  }

  if (!respuesta.ok) {
    const mensaje =
      respuesta.status === 401
        ? "Correo o contraseña incorrectos"
        : `Error HTTP: ${respuesta.status}`;

    const error = new Error(mensaje);
    error.status = respuesta.status;

    throw error;
  }

  if (respuesta.status === 204) {
    return null;
  }

  return respuesta.json();
}

export function iniciarSesion(correo, contrasena) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    requiereAuth: false,
    body: JSON.stringify({
      correo,
      contrasena,
    }),
  });
}

export function obtenerDatosPrivados() {
  return apiFetch("/api/auth/privado");
}

export function obtenerReportesRecientes() {
  return apiFetch("/api/reportes/recientes");
}

export function obtenerReportesCompletos() {
  return apiFetch("/api/reportes/todos-reportes");
}

export function obtenerMiRuta() {
  return apiFetch("/api/rutas/mi-ruta");
}

export function crearReporte(datos, imagen) {
  const formulario = new FormData();

  formulario.append(
    "datos",
    new Blob([JSON.stringify(datos)], { type: "application/json" }),
  );

  if (imagen) {
    formulario.append("imagen", imagen, imagen.name);
  }

  return apiFetch("/api/reportes", {
    method: "POST",
    body: formulario,
  });
}

export function obtenerUrlImagen(imagenUrl) {
  if (!imagenUrl) return null;

  if (imagenUrl.startsWith("https://") || imagenUrl.startsWith("http://")) {
    return imagenUrl;
  }

  const base = import.meta.env.VITE_API_URL.replace(/\/$/, "");

  const ruta = imagenUrl.startsWith("/") ? imagenUrl : `/${imagenUrl}`;

  return `${base}${ruta}`;
}

export function obtenerRutasDisponibles() {
  return apiFetch("/api/rutas/disponibles");
}

export function obtenerPuntosAcopio(opciones = {}) {
  return apiFetch("/api/puntos-acopio", opciones);
}

export function registrarUsuario(datos) {
  return apiFetch("/api/auth/registro", {
    method: "POST",
    requiereAuth: false,
    body: JSON.stringify(datos),
  });
}

export function enviarCodigoVerificacion(correo) {
  return apiFetch("/api/auth/registro/enviar-codigo", {
    method: "POST",
    requiereAuth: false,
    body: JSON.stringify({ correo }),
  });
}
