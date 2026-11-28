import { apiFetch } from "./api";

export function obtenerUsuarios(rol) {
  const consulta = rol ? `?rol=${encodeURIComponent(rol)}` : "";
  return apiFetch(`/api/admin/usuarios${consulta}`);
}

export function activarUsuario(correo) {
  return apiFetch(`/api/admin/usuarios/${encodeURIComponent(correo)}/activar`, {
    method: "PATCH",
  });
}

export function desactivarUsuario(correo) {
  return apiFetch(`/api/admin/usuarios/${encodeURIComponent(correo)}/desactivar`, {
    method: "PATCH",
  });
}

export function cambiarRolUsuario(correo, rol) {
  return apiFetch(`/api/admin/usuarios/${encodeURIComponent(correo)}/rol`, {
    method: "PATCH",
    body: JSON.stringify({ rol }),
  });
}
