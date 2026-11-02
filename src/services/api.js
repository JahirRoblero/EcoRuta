const API_URL = import.meta.env.VITE_API_URL;

export async function iniciarSesion(correo, contrasena) {
  const respuesta = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      correo,
      contrasena,
    }),
  });

  if (respuesta.status === 401) {
    throw new Error("Correo o contraseña incorrectos");
  }

  if (!respuesta.ok) {
    throw new Error("No se pudo iniciar sesión");
  }

  return await respuesta.json();
}

export async function obtenerDatosPrivados() {
  const token = localStorage.getItem("token");

  const respuesta = await fetch(`${API_URL}/api/auth/privado`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (respuesta.status === 401) {
    localStorage.removeItem("token");
    throw new Error("Sesión expirada o no válida");
  }

  if (!respuesta.ok) {
    throw new Error("No se pudo consultar el backend");
  }

  return await respuesta.json();
}
