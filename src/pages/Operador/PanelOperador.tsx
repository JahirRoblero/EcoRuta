import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router";

import Footer from "../../components/Inicio/Footer/Footer";
import logoEcorruta from "../../assets/img/LogoEcorrutaBlanco.png";
import { useAuth } from "../../context/AuthContext";
import {
  enviarUbicacion,
  finalizarRecorrido,
  iniciarRecorrido,
  obtenerDatosPrivados,
  obtenerEjecucionesOperador,
  obtenerIncidenciasEjecucion,
  obtenerOpcionesInicio,
  iniciarRutaElegida,
  obtenerUbicacionesEjecucion,
  registrarIncidencia,
} from "../../services/api";
import MapaRecorrido from "./MapaRecorrido";
import type { Coordenada } from "./MapaRecorrido";
import styles from "./PanelOperador.module.css";

interface OpcionesInicio {
  rutas: { nombre: string; descripcion: string | null; colonias: string[] }[];
  vehiculos: {
    placa: string;
    numeroEconomico: string;
    marca: string | null;
    modelo: string | null;
  }[];
}

interface UbicacionRegistrada {
  guardada: boolean;
  latitud: number;
  longitud: number;
}

interface Ejecucion {
  folioEjecucion: number;
  rutaNombre: string;
  rutaDescripcion: string | null;
  geometria: string | null;
  placaVehiculo: string;
  numeroEconomico: string;
  fechaProgramada: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  estado: "PENDIENTE" | "EN_CURSO" | "PAUSADA" | "FINALIZADA" | "CANCELADA";
  observaciones: string | null;
}

interface Incidencia {
  idIncidencia: number;
  titulo: string;
  descripcion: string;
  estado: string;
  fechaHora: string | null;
}

interface Posicion {
  latitud: number;
  longitud: number;
  hora: Date;
}

type EstadoGps = "inactivo" | "buscando" | "activo" | "error";

/** Cada cuánto se envía la posición al servidor (HU-13 CA1: intervalo configurable). */
const INTERVALO_ENVIO_MS = 15_000;

/** Después de este tiempo sin posición nueva, se marca como desactualizada (HU-13 CA2). */
const MINUTOS_DESACTUALIZADA = 2;

const TIPOS_INCIDENCIA = [
  "Avería",
  "Unidad llena",
  "Tráfico",
  "Ausencia de personal",
  "Otra",
];

const TIPOS_IMAGEN = ["image/jpeg", "image/png"];
const TAMANO_MAXIMO = 5 * 1024 * 1024;

const ETIQUETA_ESTADO: Record<Ejecucion["estado"], string> = {
  PENDIENTE: "Programada",
  EN_CURSO: "En curso",
  PAUSADA: "Pausada",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

function mensajeDeError(err: unknown, porDefecto: string): string {
  const fallo = err as Error & { status?: number };

  switch (fallo?.status) {
    case 400:
      return "Revisa los datos capturados.";
    case 403:
      return "No tienes permisos de operador.";
    case 404:
      return "No tienes asignada esa ejecución.";
    case 409:
      return "La acción no es válida en el estado actual del recorrido. Actualiza la página.";
    default:
      return porDefecto;
  }
}

function formatearHora(fecha: string | Date | null): string {
  if (!fecha) return "—";

  return new Date(fecha).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Mexico_City",
  });
}

function hoyEnOaxaca(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Mexico_City",
  });
}

function PanelOperador() {
  const navigate = useNavigate();
  const { cerrarSesion } = useAuth();

  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState(hoyEnOaxaca);

  // Resultado de la última carga; "clave" identifica qué fecha/recarga lo produjo
  const [recarga, setRecarga] = useState(0);
  const [carga, setCarga] = useState<{
    clave: string;
    datos: Ejecucion[];
    error: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [procesando, setProcesando] = useState(false);

  // Finalizar recorrido
  const [mostrarFinalizar, setMostrarFinalizar] = useState(false);
  const [completado, setCompletado] = useState(true);
  const [observaciones, setObservaciones] = useState("");

  // GPS (el estado se guarda junto al folio al que pertenece)
  const [gps, setGps] = useState<{
    folio: number;
    estado: EstadoGps;
    mensaje: string;
  } | null>(null);
  const [ultimaPosicion, setUltimaPosicion] = useState<Posicion | null>(null);
  const [ultimoEnvio, setUltimoEnvio] = useState<Date | null>(null);
  const [ahora, setAhora] = useState(() => Date.now());
  const posicionActual = useRef<Posicion | null>(null);
  const [pantallaEncendida, setPantallaEncendida] = useState(false);

  // Recorrido real (ubicaciones guardadas) que se dibuja en el mapa
  const [folioSeleccionado, setFolioSeleccionado] = useState<number | null>(null);
  const [cargaRecorrido, setCargaRecorrido] = useState<{
    folio: number;
    puntos: Coordenada[];
  } | null>(null);

  // Incidencias
  // Salir a ruta: el operador elige ruta y unidad
  const [opciones, setOpciones] = useState<OpcionesInicio | null>(null);
  const [errorOpciones, setErrorOpciones] = useState("");
  const [rutaElegida, setRutaElegida] = useState("");
  const [vehiculoElegido, setVehiculoElegido] = useState("");

  const [recargaIncidencias, setRecargaIncidencias] = useState(0);
  const [cargaIncidencias, setCargaIncidencias] = useState<{
    folio: number;
    datos: Incidencia[];
  } | null>(null);
  const [tipoIncidencia, setTipoIncidencia] = useState("");
  const [descripcionIncidencia, setDescripcionIncidencia] = useState("");
  const [imagenIncidencia, setImagenIncidencia] = useState<File | null>(null);
  const [enviandoIncidencia, setEnviandoIncidencia] = useState(false);
  const [mensajeIncidencia, setMensajeIncidencia] = useState("");
  const [errorIncidencia, setErrorIncidencia] = useState("");

  const claveCarga = `${fecha}#${recarga}`;
  const cargando = carga?.clave !== claveCarga;
  const ejecuciones = carga?.datos ?? [];
  const errorCarga = carga?.error ?? "";

  const enCurso = ejecuciones.find((e) => e.estado === "EN_CURSO") ?? null;
  const esHoy = fecha === hoyEnOaxaca();
  const folioEnCurso = enCurso?.folioEjecucion ?? null;

  const incidencias =
    cargaIncidencias && cargaIncidencias.folio === folioEnCurso
      ? cargaIncidencias.datos
      : [];

  // El mapa muestra el recorrido en curso o, si no hay, el que el operador eligió revisar
  const ejecucionMapa =
    enCurso ??
    ejecuciones.find((e) => e.folioEjecucion === folioSeleccionado) ??
    null;
  const folioMapa = ejecucionMapa?.folioEjecucion ?? null;
  const puntosRecorrido =
    cargaRecorrido && cargaRecorrido.folio === folioMapa
      ? cargaRecorrido.puntos
      : [];

  const sinGeolocalizacion = !("geolocation" in navigator);
  const gpsActual = gps && gps.folio === folioEnCurso ? gps : null;
  const estadoGps: EstadoGps = sinGeolocalizacion
    ? "error"
    : (gpsActual?.estado ?? "buscando");
  const mensajeGps = sinGeolocalizacion
    ? "Este dispositivo no permite obtener la ubicación."
    : (gpsActual?.mensaje ?? "Obteniendo ubicación...");

  const recargar = useCallback(() => setRecarga((r) => r + 1), []);

  // ------------------------------------------------------------
  // Carga de datos
  // ------------------------------------------------------------

  useEffect(() => {
    let activo = true;

    obtenerDatosPrivados()
      .then((datos) => {
        if (activo) setNombre(datos.nombre);
      })
      .catch(() => {});

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    let activo = true;
    const clave = `${fecha}#${recarga}`;

    obtenerEjecucionesOperador(fecha)
      .then((datos: Ejecucion[]) => {
        if (activo) setCarga({ clave, datos, error: "" });
      })
      .catch((err: unknown) => {
        if (activo) {
          setCarga({
            clave,
            datos: [],
            error: mensajeDeError(err, "No se pudieron cargar tus recorridos."),
          });
        }
      });

    return () => {
      activo = false;
    };
  }, [fecha, recarga]);

  useEffect(() => {
    if (folioEnCurso === null) return;

    let activo = true;

    obtenerIncidenciasEjecucion(folioEnCurso)
      .then((datos: Incidencia[]) => {
        if (activo) setCargaIncidencias({ folio: folioEnCurso, datos });
      })
      .catch(() => {
        if (activo) setCargaIncidencias({ folio: folioEnCurso, datos: [] });
      });

    return () => {
      activo = false;
    };
  }, [folioEnCurso, recargaIncidencias]);

  // Recorrido real guardado en la BD para el mapa
  useEffect(() => {
    if (folioMapa === null) return;

    let activo = true;

    obtenerUbicacionesEjecucion(folioMapa)
      .then((datos: UbicacionRegistrada[]) => {
        if (activo) {
          setCargaRecorrido({
            folio: folioMapa,
            puntos: datos.map((u) => [Number(u.longitud), Number(u.latitud)]),
          });
        }
      })
      .catch(() => {
        if (activo) setCargaRecorrido({ folio: folioMapa, puntos: [] });
      });

    return () => {
      activo = false;
    };
  }, [folioMapa]);

  // Rutas activas y unidades disponibles para "Salir a ruta"
  useEffect(() => {
    if (!esHoy || folioEnCurso !== null) return;

    let activo = true;

    obtenerOpcionesInicio()
      .then((datos: OpcionesInicio) => {
        if (!activo) return;
        setOpciones(datos);
        setErrorOpciones("");
      })
      .catch(() => {
        if (activo) {
          setErrorOpciones("No se pudieron cargar las rutas y unidades disponibles.");
        }
      });

    return () => {
      activo = false;
    };
  }, [esHoy, folioEnCurso, recarga]);

  // ------------------------------------------------------------
  // GPS: seguimiento mientras hay un recorrido en curso (CU-07)
  // ------------------------------------------------------------

  useEffect(() => {
    if (folioEnCurso === null || sinGeolocalizacion) return;

    const idSeguimiento = navigator.geolocation.watchPosition(
      (pos) => {
        const posicion = {
          latitud: Number(pos.coords.latitude.toFixed(6)),
          longitud: Number(pos.coords.longitude.toFixed(6)),
          hora: new Date(),
        };

        posicionActual.current = posicion;
        setUltimaPosicion(posicion);
        setGps({ folio: folioEnCurso, estado: "activo", mensaje: "" });
      },
      (err) => {
        setGps({
          folio: folioEnCurso,
          estado: "error",
          mensaje:
            err.code === err.PERMISSION_DENIED
              ? "No diste permiso de ubicación. Actívalo en tu navegador para registrar el recorrido."
              : "No hay señal GPS. Se seguirá intentando.",
        });
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 },
    );

    const enviar = async () => {
      const posicion = posicionActual.current;
      if (!posicion) return;

      try {
        const respuesta: UbicacionRegistrada = await enviarUbicacion(
          folioEnCurso,
          posicion.latitud,
          posicion.longitud,
        );
        setUltimoEnvio(new Date());

        // Si el servidor la guardó, se agrega a la línea del recorrido real
        if (respuesta?.guardada) {
          setCargaRecorrido((anterior) =>
            anterior && anterior.folio === folioEnCurso
              ? {
                  folio: folioEnCurso,
                  puntos: [
                    ...anterior.puntos,
                    [posicion.longitud, posicion.latitud],
                  ],
                }
              : { folio: folioEnCurso, puntos: [[posicion.longitud, posicion.latitud]] },
          );
        }
      } catch (err) {
        const fallo = err as Error & { status?: number };

        if (fallo.status === 409) {
          // El recorrido ya no está en curso: recargar estado
          recargar();
        } else {
          setGps((anterior) => ({
            folio: folioEnCurso,
            estado: anterior?.estado ?? "buscando",
            mensaje: "No se pudo enviar la ubicación. Se reintentará.",
          }));
        }
      }
    };

    // Primer envío poco después de obtener posición, luego cada intervalo
    const primerEnvio = window.setTimeout(enviar, 3_000);
    const intervalo = window.setInterval(enviar, INTERVALO_ENVIO_MS);

    return () => {
      navigator.geolocation.clearWatch(idSeguimiento);
      window.clearTimeout(primerEnvio);
      window.clearInterval(intervalo);
      posicionActual.current = null;
    };
  }, [folioEnCurso, sinGeolocalizacion, recargar]);

  // Mantener la pantalla encendida durante el recorrido: si el celular se bloquea,
  // el navegador deja de enviar la ubicación y el ciudadano deja de ver la unidad
  useEffect(() => {
    if (folioEnCurso === null || !("wakeLock" in navigator)) return;

    let bloqueo: WakeLockSentinel | null = null;
    let activo = true;

    const solicitar = () => {
      navigator.wakeLock
        .request("screen")
        .then((sentinela) => {
          if (!activo) {
            sentinela.release();
            return;
          }
          bloqueo = sentinela;
          setPantallaEncendida(true);
          sentinela.addEventListener("release", () => {
            if (activo) setPantallaEncendida(false);
          });
        })
        .catch(() => {
          if (activo) setPantallaEncendida(false);
        });
    };

    // El navegador suelta el bloqueo al cambiar de pestaña; se vuelve a pedir al regresar
    const alCambiarVisibilidad = () => {
      if (document.visibilityState === "visible") solicitar();
    };

    solicitar();
    document.addEventListener("visibilitychange", alCambiarVisibilidad);

    return () => {
      activo = false;
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      bloqueo?.release();
    };
  }, [folioEnCurso]);

  // Avisar si el operador intenta cerrar o recargar la página con el recorrido en curso
  useEffect(() => {
    if (folioEnCurso === null) return;

    const alSalir = (evento: BeforeUnloadEvent) => {
      evento.preventDefault();
      // Requerido por algunos navegadores para mostrar la confirmación
      evento.returnValue = "";
    };

    window.addEventListener("beforeunload", alSalir);
    return () => window.removeEventListener("beforeunload", alSalir);
  }, [folioEnCurso]);

  // Reloj para detectar posición desactualizada
  useEffect(() => {
    if (folioEnCurso === null) return;

    const reloj = window.setInterval(() => setAhora(Date.now()), 30_000);
    return () => window.clearInterval(reloj);
  }, [folioEnCurso]);

  const posicionDesactualizada =
    ultimaPosicion !== null &&
    ahora - ultimaPosicion.hora.getTime() > MINUTOS_DESACTUALIZADA * 60_000;

  // ------------------------------------------------------------
  // Acciones del recorrido (CU-06)
  // ------------------------------------------------------------

  const manejarSalirARuta = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!rutaElegida || !vehiculoElegido) return;

    setError("");
    setMensaje("");
    setProcesando(true);

    try {
      await iniciarRutaElegida(rutaElegida, vehiculoElegido);
      setMensaje(
        "Recorrido iniciado. Los vecinos ya pueden ver tu unidad en el mapa; mantén esta página abierta.",
      );
      setRutaElegida("");
      setVehiculoElegido("");
      recargar();
    } catch (err) {
      setError(
        mensajeDeError(
          err,
          "No se pudo iniciar el recorrido. Verifica que la unidad siga disponible.",
        ),
      );
      recargar();
    } finally {
      setProcesando(false);
    }
  };

  const manejarIniciar = async (folio: number) => {
    setError("");
    setMensaje("");
    setProcesando(true);

    try {
      await iniciarRecorrido(folio);
      setMensaje("Recorrido iniciado. Mantén esta página abierta para registrar tu ubicación.");
      recargar();
    } catch (err) {
      setError(mensajeDeError(err, "No se pudo iniciar el recorrido."));
    } finally {
      setProcesando(false);
    }
  };

  const manejarFinalizar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!enCurso) return;

    if (!completado && !observaciones.trim()) {
      setError("Indica el motivo por el que el recorrido quedó incompleto.");
      return;
    }

    setError("");
    setMensaje("");
    setProcesando(true);

    try {
      await finalizarRecorrido(
        enCurso.folioEjecucion,
        completado,
        observaciones.trim() || null,
      );
      setMostrarFinalizar(false);
      setObservaciones("");
      setCompletado(true);
      setUltimaPosicion(null);
      setUltimoEnvio(null);
      setMensaje("Recorrido finalizado correctamente.");
      recargar();
    } catch (err) {
      setError(mensajeDeError(err, "No se pudo finalizar el recorrido."));
    } finally {
      setProcesando(false);
    }
  };

  // ------------------------------------------------------------
  // Incidencias (HU-16)
  // ------------------------------------------------------------

  const seleccionarImagen = (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.currentTarget.files?.[0];
    e.currentTarget.value = "";
    setErrorIncidencia("");

    if (!archivo) return;

    if (!TIPOS_IMAGEN.includes(archivo.type)) {
      setErrorIncidencia("Solo se permiten imágenes JPG o PNG.");
      return;
    }

    if (archivo.size > TAMANO_MAXIMO) {
      setErrorIncidencia("La imagen no puede superar los 5 MB.");
      return;
    }

    setImagenIncidencia(archivo);
  };

  const manejarIncidencia = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!enCurso) return;

    setErrorIncidencia("");
    setMensajeIncidencia("");

    if (!tipoIncidencia || !descripcionIncidencia.trim()) {
      setErrorIncidencia("El tipo y la descripción son obligatorios.");
      return;
    }

    setEnviandoIncidencia(true);

    const posicion = posicionActual.current;

    try {
      await registrarIncidencia(
        enCurso.folioEjecucion,
        {
          titulo: tipoIncidencia,
          descripcion: descripcionIncidencia.trim(),
          latitud: posicion?.latitud ?? null,
          longitud: posicion?.longitud ?? null,
        },
        imagenIncidencia,
      );

      setTipoIncidencia("");
      setDescripcionIncidencia("");
      setImagenIncidencia(null);
      setMensajeIncidencia("Incidencia registrada. La Dirección de Aseo Público fue notificada.");
      setRecargaIncidencias((r) => r + 1);
    } catch (err) {
      setErrorIncidencia(mensajeDeError(err, "No se pudo registrar la incidencia."));
    } finally {
      setEnviandoIncidencia(false);
    }
  };

  const manejarCerrarSesion = () => {
    cerrarSesion();
    navigate("/login", { replace: true });
  };

  // ------------------------------------------------------------
  // Vista
  // ------------------------------------------------------------

  return (
    <div className={styles.pagina}>
      <nav className={styles.barra}>
        <div className={styles.marca}>
          <img src={logoEcorruta} alt="Ecorruta" className={styles.logo} />
          <div>
            <h1>Ecorruta</h1>
            <p>PANEL DEL OPERADOR</p>
          </div>
        </div>

        <div className={styles.usuario}>
          <span>{nombre ? `Hola, ${nombre}` : "Operador"}</span>
          <button type="button" onClick={manejarCerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </nav>

      <main className={styles.contenido}>
        <header className={styles.encabezado}>
          <h2>Mis recorridos</h2>

          <label className={styles.selectorFecha}>
            Fecha:
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value || hoyEnOaxaca())}
            />
          </label>
        </header>

        {mensaje && (
          <div className={styles.exito} role="status">
            {mensaje}
          </div>
        )}

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        {errorCarga && (
          <div className={styles.error} role="alert">
            {errorCarga}
          </div>
        )}

        {cargando && <p>Cargando recorridos...</p>}

        {!cargando && !errorCarga && esHoy && !enCurso && (
          <section className={styles.panel} aria-labelledby="titulo-salir">
            <h2 id="titulo-salir">Salir a ruta</h2>
            <p className={styles.resumenRecorrido}>
              Elige la ruta y la unidad con la que vas a salir. Al iniciar, los
              vecinos de las colonias de esa ruta verán el camión en su mapa.
            </p>

            {errorOpciones && (
              <div className={styles.error} role="alert">
                {errorOpciones}
              </div>
            )}

            {opciones && (
              <form className={styles.formulario} onSubmit={manejarSalirARuta}>
                <label>
                  Ruta *
                  <select
                    value={rutaElegida}
                    onChange={(e) => setRutaElegida(e.target.value)}
                    disabled={procesando || opciones.rutas.length === 0}
                    required
                  >
                    <option value="">
                      {opciones.rutas.length === 0
                        ? "No hay rutas activas"
                        : "Selecciona una ruta"}
                    </option>
                    {opciones.rutas.map((ruta) => (
                      <option key={ruta.nombre} value={ruta.nombre}>
                        {ruta.nombre}
                        {ruta.colonias.length > 0 &&
                          ` — ${ruta.colonias.join(", ")}`}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Unidad *
                  <select
                    value={vehiculoElegido}
                    onChange={(e) => setVehiculoElegido(e.target.value)}
                    disabled={procesando || opciones.vehiculos.length === 0}
                    required
                  >
                    <option value="">
                      {opciones.vehiculos.length === 0
                        ? "No hay unidades disponibles"
                        : "Selecciona una unidad"}
                    </option>
                    {opciones.vehiculos.map((vehiculo) => (
                      <option key={vehiculo.placa} value={vehiculo.placa}>
                        {vehiculo.numeroEconomico} · {vehiculo.placa}
                        {vehiculo.marca && ` (${vehiculo.marca})`}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="submit"
                  className={styles.botonPrimario}
                  disabled={procesando || !rutaElegida || !vehiculoElegido}
                >
                  {procesando ? "Iniciando..." : "Iniciar recorrido"}
                </button>
              </form>
            )}
          </section>
        )}

        {!cargando && !errorCarga && ejecuciones.length > 0 && (
          <h2 className={styles.subtituloLista}>
            {esHoy ? "Recorridos de hoy" : "Recorridos de esta fecha"}
          </h2>
        )}

        {!cargando && !errorCarga && !esHoy && ejecuciones.length === 0 && (
          <div className={styles.vacio}>
            No tienes recorridos en esta fecha.
          </div>
        )}

        <section className={styles.lista}>
          {ejecuciones.map((ejecucion) => (
            <article
              key={ejecucion.folioEjecucion}
              className={`${styles.tarjeta} ${
                ejecucion.estado === "EN_CURSO" ? styles.tarjetaActiva : ""
              }`}
            >
              <div className={styles.tarjetaEncabezado}>
                <h3>{ejecucion.rutaNombre}</h3>
                <span
                  className={`${styles.estado} ${styles[`estado_${ejecucion.estado}`] ?? ""}`}
                >
                  {ETIQUETA_ESTADO[ejecucion.estado]}
                </span>
              </div>

              {ejecucion.rutaDescripcion && <p>{ejecucion.rutaDescripcion}</p>}

              <dl className={styles.datos}>
                <div>
                  <dt>Folio</dt>
                  <dd>{ejecucion.folioEjecucion}</dd>
                </div>
                <div>
                  <dt>Unidad</dt>
                  <dd>
                    {ejecucion.numeroEconomico} · {ejecucion.placaVehiculo}
                  </dd>
                </div>
                <div>
                  <dt>Inicio</dt>
                  <dd>{formatearHora(ejecucion.fechaInicio)}</dd>
                </div>
                <div>
                  <dt>Fin</dt>
                  <dd>{formatearHora(ejecucion.fechaFin)}</dd>
                </div>
              </dl>

              {ejecucion.observaciones && (
                <p className={styles.observaciones}>{ejecucion.observaciones}</p>
              )}

              {ejecucion.estado === "PENDIENTE" && esHoy && (
                <button
                  type="button"
                  className={styles.botonPrimario}
                  onClick={() => manejarIniciar(ejecucion.folioEjecucion)}
                  disabled={procesando || enCurso !== null}
                  title={enCurso ? "Ya tienes un recorrido en curso" : undefined}
                >
                  Iniciar recorrido
                </button>
              )}

              {ejecucion.estado === "EN_CURSO" && (
                <button
                  type="button"
                  className={styles.botonPeligro}
                  onClick={() => setMostrarFinalizar(true)}
                  disabled={procesando}
                >
                  Finalizar recorrido
                </button>
              )}

              {ejecucion.estado === "FINALIZADA" && !enCurso && (
                <button
                  type="button"
                  className={styles.botonSecundario}
                  onClick={() =>
                    setFolioSeleccionado((actual) =>
                      actual === ejecucion.folioEjecucion
                        ? null
                        : ejecucion.folioEjecucion,
                    )
                  }
                  aria-pressed={folioSeleccionado === ejecucion.folioEjecucion}
                >
                  {folioSeleccionado === ejecucion.folioEjecucion
                    ? "Ocultar recorrido"
                    : "Ver recorrido en el mapa"}
                </button>
              )}
            </article>
          ))}
        </section>

        {!enCurso && ejecucionMapa && (
          <section className={styles.panel}>
            <h2>Recorrido realizado · {ejecucionMapa.rutaNombre}</h2>

            <p className={styles.resumenRecorrido}>
              {puntosRecorrido.length === 0
                ? "Este recorrido no tiene posiciones guardadas."
                : `${puntosRecorrido.length} posiciones reales registradas entre las ${formatearHora(
                    ejecucionMapa.fechaInicio,
                  )} y las ${formatearHora(ejecucionMapa.fechaFin)}.`}
            </p>

            <MapaRecorrido
              key={ejecucionMapa.folioEjecucion}
              geometria={ejecucionMapa.geometria}
              recorrido={puntosRecorrido}
              posicionActual={puntosRecorrido.at(-1) ?? null}
              seguir={false}
            />
          </section>
        )}

        {enCurso && (
          <>
            <section className={styles.panel}>
              <h2>Ubicación de la unidad</h2>

              <div
                className={`${styles.gps} ${
                  estadoGps === "error" || posicionDesactualizada
                    ? styles.gpsError
                    : estadoGps === "activo"
                      ? styles.gpsActivo
                      : ""
                }`}
                role="status"
              >
                <strong>
                  {estadoGps === "activo" && !posicionDesactualizada && "GPS activo"}
                  {estadoGps === "activo" && posicionDesactualizada && "Ubicación desactualizada"}
                  {estadoGps === "buscando" && "Buscando señal GPS..."}
                  {estadoGps === "error" && "GPS no disponible"}
                </strong>

                {mensajeGps && <p>{mensajeGps}</p>}

                {ultimaPosicion && (
                  <p>
                    Última posición: {ultimaPosicion.latitud}, {ultimaPosicion.longitud} (
                    {formatearHora(ultimaPosicion.hora)})
                  </p>
                )}

                <p>Último envío al servidor: {formatearHora(ultimoEnvio)}</p>

                <small>
                  {pantallaEncendida
                    ? "La pantalla se mantendrá encendida mientras el recorrido esté en curso. No cierres esta página."
                    : "Mantén esta página abierta y la pantalla encendida durante el recorrido."}
                </small>
              </div>

              <MapaRecorrido
                key={enCurso.folioEjecucion}
                geometria={enCurso.geometria}
                recorrido={puntosRecorrido}
                posicionActual={
                  ultimaPosicion
                    ? [ultimaPosicion.longitud, ultimaPosicion.latitud]
                    : (puntosRecorrido.at(-1) ?? null)
                }
                seguir
              />

              <p className={styles.resumenRecorrido}>
                {puntosRecorrido.length === 0
                  ? "Aún no hay posiciones guardadas de este recorrido."
                  : `${puntosRecorrido.length} posiciones reales guardadas en este recorrido.`}
              </p>
            </section>

            <section className={styles.panel}>
              <h2>Registrar incidencia</h2>

              {mensajeIncidencia && (
                <div className={styles.exito} role="status">
                  {mensajeIncidencia}
                </div>
              )}

              {errorIncidencia && (
                <div className={styles.error} role="alert">
                  {errorIncidencia}
                </div>
              )}

              <form className={styles.formulario} onSubmit={manejarIncidencia}>
                <label>
                  Tipo de incidencia *
                  <select
                    value={tipoIncidencia}
                    onChange={(e) => setTipoIncidencia(e.target.value)}
                    disabled={enviandoIncidencia}
                    required
                  >
                    <option value="">Selecciona un tipo</option>
                    {TIPOS_INCIDENCIA.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Descripción *
                  <textarea
                    rows={4}
                    value={descripcionIncidencia}
                    onChange={(e) => setDescripcionIncidencia(e.target.value)}
                    placeholder="Describe lo que ocurrió..."
                    disabled={enviandoIncidencia}
                    required
                  />
                </label>

                <label>
                  Fotografía (opcional, JPG o PNG, máx. 5 MB)
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    capture="environment"
                    onChange={seleccionarImagen}
                    disabled={enviandoIncidencia}
                  />
                </label>

                {imagenIncidencia && (
                  <p className={styles.archivo}>
                    {imagenIncidencia.name}{" "}
                    <button type="button" onClick={() => setImagenIncidencia(null)}>
                      Quitar
                    </button>
                  </p>
                )}

                <small>
                  {ultimaPosicion
                    ? "Se adjuntará tu ubicación actual."
                    : "No hay ubicación disponible; la incidencia se registrará sin coordenadas."}
                </small>

                <button
                  type="submit"
                  className={styles.botonPrimario}
                  disabled={enviandoIncidencia}
                >
                  {enviandoIncidencia ? "Enviando..." : "Registrar incidencia"}
                </button>
              </form>

              {incidencias.length > 0 && (
                <>
                  <h3>Incidencias de este recorrido</h3>
                  <ul className={styles.incidencias}>
                    {incidencias.map((incidencia) => (
                      <li key={incidencia.idIncidencia}>
                        <strong>{incidencia.titulo}</strong> ·{" "}
                        {formatearHora(incidencia.fechaHora)} · {incidencia.estado}
                        <p>{incidencia.descripcion}</p>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          </>
        )}
      </main>

      {mostrarFinalizar && enCurso && (
        <div className={styles.fondoModal} onClick={() => setMostrarFinalizar(false)}>
          <form
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tituloFinalizar"
            onClick={(e) => e.stopPropagation()}
            onSubmit={manejarFinalizar}
          >
            <h2 id="tituloFinalizar">Finalizar recorrido</h2>
            <p>{enCurso.rutaNombre}</p>

            <label className={styles.opcion}>
              <input
                type="radio"
                name="completado"
                checked={completado}
                onChange={() => setCompletado(true)}
              />
              Completé la ruta
            </label>

            <label className={styles.opcion}>
              <input
                type="radio"
                name="completado"
                checked={!completado}
                onChange={() => setCompletado(false)}
              />
              No pude completar la ruta
            </label>

            <label>
              Observaciones {completado ? "(opcional)" : "* (motivo)"}
              <textarea
                rows={3}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                maxLength={1000}
                required={!completado}
              />
            </label>

            <div className={styles.accionesModal}>
              <button
                type="button"
                className={styles.botonSecundario}
                onClick={() => setMostrarFinalizar(false)}
                disabled={procesando}
              >
                Cancelar
              </button>
              <button type="submit" className={styles.botonPeligro} disabled={procesando}>
                {procesando ? "Finalizando..." : "Confirmar"}
              </button>
            </div>
          </form>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default PanelOperador;
