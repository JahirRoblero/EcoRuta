import { apiFetch } from "./api";

export function obtenerRutas() {
  return apiFetch("/api/admin/rutas");
}

export function activarRuta(nombre) {
  return apiFetch(`/api/admin/rutas/${encodeURIComponent(nombre)}/activar`, {
    method: "PATCH",
  });
}

export function desactivarRuta(nombre) {
  return apiFetch(`/api/admin/rutas/${encodeURIComponent(nombre)}/desactivar`, {
    method: "PATCH",
  });
}

export function eliminarRuta(nombre) {
  return apiFetch(`/api/admin/rutas/${encodeURIComponent(nombre)}`, {
    method: "DELETE",
  });
}