import { apiFetch } from "./api";

// true = datos de prueba (sin backend). false = backend real.
const USAR_MOCKS = false;

const MOCK_REPORTES = [
  { idReporte: 3, titulo: "Basura acumulada en la esquina", descripcion: "Bolsas sin recoger desde el lunes.", imagenUrl: null, estado: "PENDIENTE", latitud: null, longitud: null, fechaReporte: "2026-11-18T09:15:00-06:00", fechaAtencion: null, autorNombre: "María López", autorCorreo: "maria.lopez@correo.com", coloniaNombre: "Reforma", coloniaCodigoPostal: "68050" },
  { idReporte: 2, titulo: "El camión no pasó", descripcion: "No pasó el miércoles.", imagenUrl: null, estado: "EN_PROCESO", latitud: null, longitud: null, fechaReporte: "2026-11-17T18:40:00-06:00", fechaAtencion: null, autorNombre: "Ana Ruiz", autorCorreo: "ana.ruiz@correo.com", coloniaNombre: "Centro", coloniaCodigoPostal: "68000" },
  { idReporte: 1, titulo: "Contenedor roto", descripcion: "La tapa está rota.", imagenUrl: null, estado: "ATENDIDO", latitud: null, longitud: null, fechaReporte: "2026-11-15T11:00:00-06:00", fechaAtencion: "2026-11-16T10:00:00-06:00", autorNombre: "Juan Pérez", autorCorreo: "juan.perez@correo.com", coloniaNombre: "San Felipe del Agua", coloniaCodigoPostal: "68020" },
];

function simularRed(datos, ms = 400) {
  return new Promise((resolver) => setTimeout(() => resolver(datos), ms));
}

export function obtenerReportes(estado) {
  if (USAR_MOCKS) {
    const lista = estado ? MOCK_REPORTES.filter((r) => r.estado === estado) : MOCK_REPORTES;
    return simularRed(lista.map((r) => ({ ...r })));
  }
  const consulta = estado ? `?estado=${encodeURIComponent(estado)}` : "";
  return apiFetch(`/api/admin/reportes${consulta}`);
}

export function cambiarEstadoReporte(idReporte, estado) {
  if (USAR_MOCKS) {
    const reporte = MOCK_REPORTES.find((r) => r.idReporte === idReporte);
    if (reporte) {
      reporte.estado = estado;
      reporte.fechaAtencion = estado === "ATENDIDO" ? new Date().toISOString() : null;
    }
    return simularRed(null, 300);
  }
  return apiFetch(`/api/admin/reportes/${encodeURIComponent(idReporte)}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
  });
}
