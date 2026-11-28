/**
 * Solicita una sola ubicación cuando el operador pulsa "Actualizar ubicación".
 * No utiliza watchPosition y nunca publica coordenadas automáticamente.
 */
export async function obtenerUbicacionTelefono(): Promise<GeolocationPosition> {
  if (!window.isSecureContext) {
    throw new Error(
      "La ubicación requiere HTTPS. Abre https://ecorruta.com.mx directamente desde el navegador del teléfono.",
    );
  }
  if (!("geolocation" in navigator)) {
    throw new Error(
      "El navegador no tiene acceso a la ubicación. Revisa los permisos de ubicación del navegador y del teléfono.",
    );
  }

  // Algunos navegadores móviles no implementan Permissions API.
  if (navigator.permissions?.query) {
    let denegado = false;
    try {
      const permiso = await navigator.permissions.query({ name: "geolocation" });
      denegado = permiso.state === "denied";
    } catch {
      // Se intentará la API de ubicación igualmente.
    }
    if (denegado) {
      throw new Error(
        "Ecorruta tiene bloqueado el permiso de ubicación para este sitio. Abre la configuración o el candado del navegador, permite Ubicación y vuelve a intentarlo.",
      );
    }
  }

  const solicitar = (opciones: PositionOptions) =>
    new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, opciones);
    });

  try {
    // Intentar GPS de alta precisión (que a veces tarda o falla en interiores).
    return await solicitar({
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 12_000,
    });
  } catch (primerError: unknown) {
    const fallo = primerError as GeolocationPositionError;
    if (fallo?.code === 1) {
      throw new Error(
        "El navegador rechazó el permiso de ubicación. Aunque el GPS del celular esté activado, debes permitir Ubicación para ecorruta.com.mx en el navegador y en los permisos del sistema.",
      );
    }
    // Si no llegó GPS preciso, permitir posición de red/Wi-Fi.
    try {
      return await solicitar({
        enableHighAccuracy: false,
        maximumAge: 10_000,
        timeout: 20_000,
      });
    } catch (segundoError: unknown) {
      const error = segundoError as GeolocationPositionError;
      if (error?.code === 1) {
        throw new Error(
          "Permiso de ubicación denegado. Revisa la configuración del sitio y los permisos del navegador en tu teléfono.",
        );
      }
      if (error?.code === 3) {
        throw new Error(
          "El teléfono tardó demasiado en obtener la ubicación. Intenta desde un lugar con mejor señal, verifica la ubicación del sistema y vuelve a pulsar Actualizar ubicación.",
        );
      }
      if (error?.code === 2) {
        throw new Error(
          "El teléfono no pudo determinar la ubicación. Activa la precisión de ubicación del sistema y comprueba la conexión a Internet o la señal GPS.",
        );
      }
      throw new Error(
        "No fue posible obtener la ubicación. Abre Ecorruta directamente en Chrome o Safari con HTTPS y revisa los permisos del sitio.",
      );
    }
  }
}
