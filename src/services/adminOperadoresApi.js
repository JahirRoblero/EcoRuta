import { apiFetch } from "./api";

export function obtenerOperadores() {
  return apiFetch("/api/admin/operadores");
}

export function obtenerVehiculos(estado) {
  const consulta = estado ? `?estado=${encodeURIComponent(estado)}` : "";
  return apiFetch(`/api/admin/vehiculos${consulta}`);
}

// datos: { correo, nombre, apellidoPaterno, apellidoMaterno, contrasenaTemporal }
// La respuesta nunca incluye la contraseña.
export function crearOperador(datos) {
  return apiFetch("/api/admin/operadores", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}
