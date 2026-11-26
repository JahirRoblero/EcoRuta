import { apiFetch } from "./api";

export function obtenerReportes(estado) {
  const consulta = estado ? `?estado=${encodeURIComponent(estado)}` : "";
  return apiFetch(`/api/admin/reportes${consulta}`);
}

export function cambiarEstadoReporte(idReporte, estado) {
  return apiFetch(`/api/admin/reportes/${encodeURIComponent(idReporte)}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
  });
}
