import { apiFetch } from "./api";

export function obtenerRutas() {
  return apiFetch("/api/admin/rutas");
}

export function obtenerRuta(nombre) {
  return apiFetch(`/api/admin/rutas/${encodeURIComponent(nombre)}`);
}

export function obtenerColonias() {
  return apiFetch("/api/admin/colonias");
}

export function crearRuta(datos) {
  return apiFetch("/api/admin/rutas", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

export function editarRuta(nombre, datos) {
  return apiFetch(`/api/admin/rutas/${encodeURIComponent(nombre)}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
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