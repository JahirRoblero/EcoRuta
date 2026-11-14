import { useEffect, useState } from "react";

import MapaRecorrido from "../../../pages/Operador/MapaRecorrido";
import { obtenerSeguimientoMiColonia } from "../../../services/api";
import styles from "./SeguimientoCamion.module.css";

interface Unidad {
  rutaNombre: string;
  geometria: string | null;
  numeroEconomico: string;
  latitud: number | null;
  longitud: number | null;
  fechaHora: string | null;
  minutosSinActualizar: number | null;
  desactualizada: boolean;
}

interface Horario {
  rutaNombre: string;
  tipoResiduo: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
}

interface Seguimiento {
  colonia: string;
  codigoPostal: string;
  minutosParaDesactualizada: number;
  unidades: Unidad[];
  horarios: Horario[];
}

/** Cada cuánto se vuelve a consultar la posición del camión. */
const INTERVALO_ACTUALIZACION_MS = 30_000;

const DIAS = [
  "",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

const RESIDUOS: Record<string, string> = {
  ORGANICO: "Orgánico",
  INORGANICO: "Inorgánico",
};

/** Día de la semana en Oaxaca: 1 = lunes ... 7 = domingo. */
function diaDeHoy(): number {
  const nombre = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "America/Mexico_City",
  });
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(nombre) + 1;
}

function formatearHora(fecha: string | null): string {
  if (!fecha) return "—";

  return new Date(fecha).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Mexico_City",
  });
}

function textoAntiguedad(minutos: number | null): string {
  if (minutos === null) return "";
  if (minutos < 1) return "hace menos de un minuto";
  if (minutos === 1) return "hace 1 minuto";
  if (minutos < 60) return `hace ${minutos} minutos`;

  const horas = Math.floor(minutos / 60);
  return horas === 1 ? "hace más de 1 hora" : `hace más de ${horas} horas`;
}

/**
 * Sección del Inicio del ciudadano que muestra dónde va el camión de su
 * colonia (HU-22). Si no hay recorrido activo, muestra los horarios.
 */
function SeguimientoCamion() {
  const [seguimiento, setSeguimiento] = useState<Seguimiento | null>(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    const consultar = () => {
      obtenerSeguimientoMiColonia()
        .then((datos: Seguimiento) => {
          if (!activo) return;
          setSeguimiento(datos);
          setError("");
        })
        .catch((err: Error & { status?: number }) => {
          if (!activo) return;
          setError(
            err.status === 422
              ? "Registra tu colonia en tu perfil para ver el camión que te corresponde."
              : "No se pudo consultar la ubicación del camión. Se reintentará en unos segundos.",
          );
        })
        .finally(() => {
          if (activo) setCargando(false);
        });
    };

    consultar();
    const intervalo = window.setInterval(consultar, INTERVALO_ACTUALIZACION_MS);

    return () => {
      activo = false;
      window.clearInterval(intervalo);
    };
  }, []);

  const hoy = diaDeHoy();

  return (
    <section className={styles.seccion} aria-labelledby="titulo-seguimiento">
      <header className={styles.encabezado}>
        <h2 id="titulo-seguimiento">¿Dónde va el camión?</h2>
        {seguimiento && (
          <p>
            Colonia {seguimiento.colonia} ({seguimiento.codigoPostal}) · se
            actualiza cada 30 segundos
          </p>
        )}
      </header>

      {cargando && <p>Buscando el camión de tu colonia...</p>}

      {error && (
        <p className={styles.aviso} role="alert">
          {error}
        </p>
      )}

      {seguimiento && seguimiento.unidades.length > 0 && (
        <div className={styles.unidades}>
          {seguimiento.unidades.map((unidad) => {
            const tienePosicion =
              unidad.latitud !== null && unidad.longitud !== null;

            return (
              <article key={unidad.rutaNombre} className={styles.unidad}>
                <div className={styles.datosUnidad}>
                  <span className={styles.enRecorrido}>En recorrido</span>
                  <h3>{unidad.rutaNombre}</h3>
                  <p>Unidad {unidad.numeroEconomico}</p>

                  {tienePosicion ? (
                    <p>
                      Última ubicación: {formatearHora(unidad.fechaHora)} (
                      {textoAntiguedad(unidad.minutosSinActualizar)})
                    </p>
                  ) : (
                    <p>La unidad todavía no reporta su ubicación.</p>
                  )}

                  {tienePosicion && unidad.desactualizada && (
                    <p className={styles.noActualizada} role="status">
                      Ubicación no actualizada: el camión lleva más de{" "}
                      {seguimiento.minutosParaDesactualizada} minutos sin
                      reportar.
                    </p>
                  )}
                </div>

                <MapaRecorrido
                  geometria={unidad.geometria}
                  recorrido={[]}
                  posicionActual={
                    tienePosicion
                      ? [Number(unidad.longitud), Number(unidad.latitud)]
                      : null
                  }
                  seguir={false}
                  mostrarRecorrido={false}
                />
              </article>
            );
          })}
        </div>
      )}

      {seguimiento && seguimiento.unidades.length === 0 && (
        <div className={styles.sinRecorrido}>
          <p className={styles.mensajeSinRecorrido}>
            Sin recorrido activo en este momento.
          </p>

          {seguimiento.horarios.length === 0 ? (
            <p>No hay horarios registrados para tu colonia.</p>
          ) : (
            <>
              <p>Horario programado de recolección:</p>
              <table className={styles.horarios}>
                <thead>
                  <tr>
                    <th scope="col">Día</th>
                    <th scope="col">Horario</th>
                    <th scope="col">Residuo</th>
                    <th scope="col">Ruta</th>
                  </tr>
                </thead>
                <tbody>
                  {seguimiento.horarios.map((horario) => (
                    <tr
                      key={`${horario.rutaNombre}-${horario.diaSemana}-${horario.horaInicio}`}
                      className={
                        horario.diaSemana === hoy ? styles.hoy : undefined
                      }
                    >
                      <td>
                        {DIAS[horario.diaSemana]}
                        {horario.diaSemana === hoy && " (hoy)"}
                      </td>
                      <td>
                        {horario.horaInicio} – {horario.horaFin}
                      </td>
                      <td>
                        {RESIDUOS[horario.tipoResiduo] ?? horario.tipoResiduo}
                      </td>
                      <td>{horario.rutaNombre}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </section>
  );
}

export default SeguimientoCamion;
