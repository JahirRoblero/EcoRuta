import { apiFetch } from "./api";

// Mientras el backend admin no esté listo, se usan mocks.
// Cuando los endpoints existan, cambiar a false (o borrar las ramas de mock)
// manteniendo las mismas firmas de función.
const USAR_MOCKS = true;

const MOCK_RUTAS = [
  {
    nombre: "Centro Histórico",
    descripcion: "Recolección en el centro de la ciudad, incluye zócalo y catedral",
    distancia_km: 12.5,
    activo: true,
    fecha_creacion: "2025-09-15T10:00:00Z",
    colonias: 4,
  },
  {
    nombre: "Colonia Reforma",
    descripcion: "Zona residencial norte, cobertura martes y jueves",
    distancia_km: 8.3,
    activo: true,
    fecha_creacion: "2025-09-20T10:00:00Z",
    colonias: 3,
  },
  {
    nombre: "San Felipe del Agua",
    descripcion: "Zona norte con calles estrechas, acceso limitado",
    distancia_km: 15.2,
    activo: true,
    fecha_creacion: "2025-10-01T10:00:00Z",
    colonias: 2,
  },
  {
    nombre: "Trinidad de las Huertas",
    descripcion: "Zona sur de la ciudad",
    distancia_km: 10.1,
    activo: false,
    fecha_creacion: "2025-07-10T10:00:00Z",
    colonias: 2,
  },
  {
    nombre: "San Juan Chapultepec",
    descripcion: "Zona este, cobertura miércoles",
    distancia_km: 9.4,
    activo: true,
    fecha_creacion: "2025-10-15T10:00:00Z",
    colonias: 1,
  },
];

function simularRed(datos, ms = 400) {
  return new Promise((resolver) => {
    setTimeout(() => resolver(datos), ms);
  });
}

// ===== USUARIOS (Angel) =====
// ...

// ===== OPERADORES (Angel) =====
// ...

// ===== RUTAS (Daniel) =====

export function obtenerRutas() {
  if (USAR_MOCKS) {
    return simularRed([...MOCK_RUTAS]);
  }
  return apiFetch("/api/admin/rutas");
}

export function desactivarRuta(nombre) {
  if (USAR_MOCKS) {
    const ruta = MOCK_RUTAS.find((r) => r.nombre === nombre);
    if (ruta) ruta.activo = false;
    return simularRed(null, 300);
  }
  return apiFetch(`/api/admin/rutas/${encodeURIComponent(nombre)}/desactivar`, {
    method: "PATCH",
  });
}

export function activarRuta(nombre) {
  if (USAR_MOCKS) {
    const ruta = MOCK_RUTAS.find((r) => r.nombre === nombre);
    if (ruta) ruta.activo = true;
    return simularRed(null, 300);
  }
  return apiFetch(`/api/admin/rutas/${encodeURIComponent(nombre)}/activar`, {
    method: "PATCH",
  });
}

export function eliminarRuta(nombre) {
  if (USAR_MOCKS) {
    const idx = MOCK_RUTAS.findIndex((r) => r.nombre === nombre);
    if (idx >= 0) MOCK_RUTAS.splice(idx, 1);
    return simularRed(null, 300);
  }
  return apiFetch(`/api/admin/rutas/${encodeURIComponent(nombre)}`, {
    method: "DELETE",
  });
}

// ===== REPORTES (Daniel) =====
// ...