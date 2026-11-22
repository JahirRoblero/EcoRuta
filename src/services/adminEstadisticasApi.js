import { apiFetch } from "./api";

export function obtenerEstadisticas() {
  return apiFetch("/api/admin/estadisticas");
}