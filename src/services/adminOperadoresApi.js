import { apiFetch } from "./api";

// true = datos de prueba (sin backend). false = backend real.
const USAR_MOCKS = false;

const MOCK_OPERADORES = [
  { correo: "juan.perez@correo.com", nombre: "Juan", apellidoPaterno: "Pérez", apellidoMaterno: null, activo: true, fechaRegistro: "2026-09-20T10:00:00Z" },
];

const MOCK_VEHICULOS = [
  { placa: "OAX-DEMO-01", numeroEconomico: "ECO-CAN-01", marca: "International", modelo: null, capacidadKg: 8000, estado: "DISPONIBLE", activo: true },
  { placa: "OAX-DEMO-02", numeroEconomico: "ECO-CAN-02", marca: "Freightliner", modelo: null, capacidadKg: 9000, estado: "MANTENIMIENTO", activo: true },
];

function simularRed(datos, ms = 400) {
  return new Promise((resolver) => setTimeout(() => resolver(datos), ms));
}

export function obtenerOperadores() {
  if (USAR_MOCKS) return simularRed(MOCK_OPERADORES.map((o) => ({ ...o })));
  return apiFetch("/api/admin/operadores");
}

export function obtenerVehiculos(estado) {
  if (USAR_MOCKS) {
    const lista = estado ? MOCK_VEHICULOS.filter((v) => v.estado === estado) : MOCK_VEHICULOS;
    return simularRed(lista.map((v) => ({ ...v })));
  }
  const consulta = estado ? `?estado=${encodeURIComponent(estado)}` : "";
  return apiFetch(`/api/admin/vehiculos${consulta}`);
}

// datos: { correo, nombre, apellidoPaterno, apellidoMaterno, contrasenaTemporal }
// La respuesta nunca incluye la contraseña.
export function crearOperador(datos) {
  if (USAR_MOCKS) {
    const nuevo = {
      correo: datos.correo.trim().toLowerCase(),
      nombre: datos.nombre,
      apellidoPaterno: datos.apellidoPaterno,
      apellidoMaterno: datos.apellidoMaterno || null,
      activo: true,
      fechaRegistro: new Date().toISOString(),
    };
    MOCK_OPERADORES.push(nuevo);
    return simularRed({ ...nuevo }, 300);
  }
  return apiFetch("/api/admin/operadores", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}
