import { apiFetch } from "./api";

// true = datos de prueba (sin backend). false = backend real.
const USAR_MOCKS = false;

const MOCK_USUARIOS = [
  { correo: "maria.lopez@correo.com", nombre: "María", apellidoPaterno: "López", apellidoMaterno: null, rol: "CIUDADANO", activo: true, coloniaNombre: "Reforma", coloniaCodigoPostal: "68050", fechaRegistro: "2026-09-15T10:00:00Z" },
  { correo: "juan.perez@correo.com", nombre: "Juan", apellidoPaterno: "Pérez", apellidoMaterno: null, rol: "CONDUCTOR", activo: true, coloniaNombre: "Centro", coloniaCodigoPostal: "68000", fechaRegistro: "2026-09-20T10:00:00Z" },
  { correo: "ana.ruiz@correo.com", nombre: "Ana", apellidoPaterno: "Ruiz", apellidoMaterno: null, rol: "CIUDADANO", activo: false, coloniaNombre: "San Felipe del Agua", coloniaCodigoPostal: "68020", fechaRegistro: "2026-10-01T10:00:00Z" },
  { correo: "admin@ecoruta.mx", nombre: "Carlos", apellidoPaterno: "Méndez", apellidoMaterno: null, rol: "ADMINISTRADOR", activo: true, coloniaNombre: null, coloniaCodigoPostal: null, fechaRegistro: "2026-08-01T10:00:00Z" },
];

function simularRed(datos, ms = 400) {
  return new Promise((resolver) => setTimeout(() => resolver(datos), ms));
}

function cambiarMock(correo, activo) {
  const usuario = MOCK_USUARIOS.find((u) => u.correo === correo);
  if (usuario) usuario.activo = activo;
  return simularRed(null, 300);
}

export function obtenerUsuarios(rol) {
  if (USAR_MOCKS) {
    const lista = rol ? MOCK_USUARIOS.filter((u) => u.rol === rol) : MOCK_USUARIOS;
    return simularRed(lista.map((u) => ({ ...u })));
  }
  const consulta = rol ? `?rol=${encodeURIComponent(rol)}` : "";
  return apiFetch(`/api/admin/usuarios${consulta}`);
}

export function activarUsuario(correo) {
  if (USAR_MOCKS) return cambiarMock(correo, true);
  return apiFetch(`/api/admin/usuarios/${encodeURIComponent(correo)}/activar`, {
    method: "PATCH",
  });
}

export function desactivarUsuario(correo) {
  if (USAR_MOCKS) return cambiarMock(correo, false);
  return apiFetch(`/api/admin/usuarios/${encodeURIComponent(correo)}/desactivar`, {
    method: "PATCH",
  });
}


export function cambiarRolUsuario(correo, rol) {
  if (USAR_MOCKS) {
    const usuario = MOCK_USUARIOS.find((u) => u.correo === correo);
    if (usuario) usuario.rol = rol;
    return simularRed(null, 300);
  }
  return apiFetch(`/api/admin/usuarios/${encodeURIComponent(correo)}/rol`, {
    method: "PATCH",
    body: JSON.stringify({ rol }),
  });
}