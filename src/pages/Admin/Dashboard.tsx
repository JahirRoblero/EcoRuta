import { useEffect, useState } from "react";
import styles from "./Dashboard.module.css";
import { obtenerEstadisticas } from "../../services/adminEstadisticasApi";

interface Estadisticas {
  usuariosActivos: number;
  usuariosPorRol: Record<string, number>;
  rutasActivas: number;
  rutasTotales: number;
  reportesPorEstado: Record<string, number>;
  recorridosHoy: number;
  recorridosEnCurso: number;
  incidenciasAbiertas: number;
}

interface Tarjeta {
  etiqueta: string;
  valor: number;
  detalle?: string;
}

const ESTADOS_REPORTE = [
  { clave: "PENDIENTE", nombre: "Pendientes", clase: styles.barraPendiente },
  { clave: "EN_PROCESO", nombre: "En proceso", clase: styles.barraProceso },
  { clave: "ATENDIDO", nombre: "Atendidos", clase: styles.barraAtendido },
  { clave: "RECHAZADO", nombre: "Rechazados", clase: styles.barraRechazado },
];

function mensajeDeError(error: unknown): string {
  const estado = (error as { status?: number } | null)?.status;
  if (estado === 403) return "No tienes permisos para ver las estadísticas.";
  return "No se pudieron cargar las estadísticas. Intenta de nuevo.";
}

export default function Dashboard() {
  const [datos, setDatos] = useState<Estadisticas | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let vigente = true;

    obtenerEstadisticas()
      .then((respuesta: Estadisticas) => {
        if (!vigente) return;
        setDatos(respuesta);
        setError("");
      })
      .catch((err: unknown) => {
        if (vigente) setError(mensajeDeError(err));
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [recarga]);

  const reintentar = () => {
    setCargando(true);
    setError("");
    setRecarga((n) => n + 1);
  };

  const tarjetas: Tarjeta[] = datos
    ? [
        { etiqueta: "Usuarios activos", valor: datos.usuariosActivos },
        {
          etiqueta: "Conductores activos",
          valor: datos.usuariosPorRol.CONDUCTOR ?? 0,
        },
        {
          etiqueta: "Rutas activas",
          valor: datos.rutasActivas,
          detalle: `de ${datos.rutasTotales} registradas`,
        },
        {
          etiqueta: "Reportes pendientes",
          valor: datos.reportesPorEstado.PENDIENTE ?? 0,
        },
        { etiqueta: "Recorridos de hoy", valor: datos.recorridosHoy },
        { etiqueta: "Recorridos en curso", valor: datos.recorridosEnCurso },
        { etiqueta: "Incidencias abiertas", valor: datos.incidenciasAbiertas },
      ]
    : [];

  const totalReportes = datos
    ? ESTADOS_REPORTE.reduce(
        (suma, e) => suma + (datos.reportesPorEstado[e.clave] ?? 0),
        0,
      )
    : 0;

  return (
    <div>
      <header className={styles.encabezado}>
        <h1>Dashboard</h1>
        <p>Resumen general del sistema</p>
      </header>

      {cargando && <p className={styles.estado}>Cargando estadísticas...</p>}

      {error && (
        <div className={styles.errorCaja} role="alert">
          <span>{error}</span>
          <button
            type="button"
            className={styles.botonReintentar}
            onClick={reintentar}
          >
            Reintentar
          </button>
        </div>
      )}

      {!cargando && datos && (
        <>
          <section className={styles.tarjetas}>
            {tarjetas.map((tarjeta) => (
              <article key={tarjeta.etiqueta} className={styles.tarjeta}>
                <span className={styles.etiqueta}>{tarjeta.etiqueta}</span>
                <span className={styles.valor}>{tarjeta.valor}</span>
                {tarjeta.detalle && (
                  <span className={styles.detalle}>{tarjeta.detalle}</span>
                )}
              </article>
            ))}
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelTitulo}>
              Reportes por estado ({totalReportes} en total)
            </h2>
            {ESTADOS_REPORTE.map((estado) => {
              const cantidad = datos.reportesPorEstado[estado.clave] ?? 0;
              const porcentaje =
                totalReportes > 0 ? (cantidad / totalReportes) * 100 : 0;
              return (
                <div key={estado.clave} className={styles.fila}>
                  <span>{estado.nombre}</span>
                  <div className={styles.barraFondo}>
                    <div
                      className={`${styles.barra} ${estado.clase}`}
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                  <span className={styles.cantidad}>{cantidad}</span>
                </div>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}