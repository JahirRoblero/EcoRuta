// Validaciones compartidas por los formularios (registro, inicio de sesión).

const REGEX_CORREO = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

/** Letras (con acentos y ñ) y espacios. */
const NO_PERMITIDOS_NOMBRE = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]/g;

/**
 * Quita del texto todo lo que no sea letra o espacio y evita
 * espacios al inicio o repetidos mientras el usuario escribe.
 */
export function limpiarNombre(valor: string): string {
  return valor
    .replace(NO_PERMITIDOS_NOMBRE, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^\s+/, "");
}

/** Quita espacios del correo (no se permiten en una dirección). */
export function limpiarCorreo(valor: string): string {
  return valor.replace(/\s/g, "");
}

/** Deja solo dígitos, hasta la longitud indicada. */
export function soloDigitos(valor: string, longitud: number): string {
  return valor.replace(/\D/g, "").slice(0, longitud);
}

export function validarObligatorio(valor: string, campo: string): string {
  return valor.trim() ? "" : `${campo} es obligatorio.`;
}

export function validarNombre(
  valor: string,
  campo: string,
  obligatorio = true,
): string {
  const texto = valor.trim();

  if (!texto) return obligatorio ? `${campo} es obligatorio.` : "";
  if (texto.length < 2) return `${campo} debe tener al menos 2 letras.`;

  return "";
}

export function validarCorreo(valor: string): string {
  const correo = valor.trim();

  if (!correo) return "El correo electrónico es obligatorio.";
  if (!correo.includes("@")) {
    return "Formato de correo inválido: falta el símbolo @. Ejemplo: nombre@dominio.com";
  }
  if (!REGEX_CORREO.test(correo)) {
    return "Formato de correo inválido. Ejemplo: nombre@dominio.com";
  }

  return "";
}

export interface RequisitoContrasena {
  texto: string;
  cumple: boolean;
}

/** Requisitos de la contraseña y si el valor actual los cumple. */
export function requisitosContrasena(valor: string): RequisitoContrasena[] {
  return [
    { texto: "Mínimo 8 caracteres", cumple: valor.length >= 8 },
    { texto: "Al menos un número", cumple: /\d/.test(valor) },
    {
      texto: "Al menos un carácter especial (por ejemplo ! @ # $ % & * ?)",
      cumple: /[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\s]/.test(valor),
    },
  ];
}

export function validarContrasena(valor: string): string {
  if (!valor) return "La contraseña es obligatoria.";

  const faltantes = requisitosContrasena(valor).filter((r) => !r.cumple);

  if (faltantes.length === 0) return "";

  return `La contraseña no cumple: ${faltantes
    .map((r) => r.texto.replace(/ \(.*\)$/, "").toLowerCase())
    .join(", ")}.`;
}
