import { useCallback, useEffect, useState } from "react";
import TablaDatos from "../../components/Admin/TablaDatos";
import type { Columna } from "../../components/Admin/TablaDatos";
import ModalConfirmacion from "../../components/Admin/ModalConfirmacion";
import { obtenerUrlImagen } from "../../services/api";
import { obtenerReportes, cambiarEstadoReporte } from "../../services/adminReportesApi";
import styles from "./Reportes.module.css";

type EstadoReporte = "PENDIENTE" | "EN_PROCESO" | "ATENDIDO" | "RECHAZADO";

interface Reporte {
  idReporte: number;
  titulo: string;
  descripcion: string;
  imagenUrl: string | null;
  estado: EstadoReporte;
  latitud: number | null;
  longitud: number | null;
  fechaReporte: string;
  fechaAtencion: string | null;
  autorNombre: string;
  autorCorreo: string;
  coloniaNombre: string;
  coloniaCodigoPostal: string;
}

interface CambioEstado {
  reporte: Reporte;
  estadoNuevo: EstadoReporte;
}

const NOMBRE_ESTADO: Record<EstadoReporte, string> = {
  PENDIENTE: "Pendiente",
  EN_PROCESO: "En proceso",
  ATENDIDO: "Atendido",
  RECHAZADO: "Rechazado",
};

// PENDIENTE no aparece: el backend no permite regresar un reporte a pendiente.
const ESTADOS_DESTINO: EstadoReporte[] = ["EN_PROCESO", "ATENDIDO", "RECHAZADO"];

const CLASE_ESTADO: Record<EstadoReporte, string> = {
  PENDIENTE: styles.estadoPendiente,
  EN_PROCESO: styles.estadoProceso,
  ATENDIDO: styles.estadoAtendido,
  RECHAZADO: styles.estadoRechazado,
};

function formatearFecha(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function mensajeDeError(error: unknown): string {
  const estado = (error as { status?: number } | null)?.status;
  if (estado === 400) return "El estado elegido no es válido.";
  if (estado === 403) return "No tienes permisos para administrar reportes.";
  if (estado === 404) return "El reporte ya no existe.";
  return "No se pudo conectar con el servidor. Intenta de nuevo.";
}

export default function Reportes() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cambio, setCambio] = useState<CambioEstado | null>(null);

  const cargarReportes = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const estado = filtroEstado === "TODOS" ? undefined : filtroEstado;
      const datos = (await obtenerReportes(estado)) as Reporte[];
      setReportes(datos);
    } catch (e) {
      setReportes([]);
      setError(mensajeDeError(e));
    } finally {
      setCargando(false);
    }
  }, [filtroEstado]);

  useEffect(() => {
    cargarReportes();
  }, [cargarReportes]);

  const confirmarCambio = async () => {
    if (!cambio) return;
    const { reporte, estadoNuevo } = cambio;
    setProcesando(true);
    setError(null);
    try {
      await cambiarEstadoReporte(reporte.idReporte, estadoNuevo);
      const fechaAtencion = estadoNuevo === "ATENDIDO" ? new Date().toISOString() : null;
      setReportes((lista) =>
        filtroEstado !== "TODOS" && filtroEstado !== estadoNuevo
          ? lista.filter((r) => r.idReporte !== reporte.idReporte)
          : lista.map((r) =>
              r.idReporte === reporte.idReporte ? { ...r, estado: estadoNuevo, fechaAtencion } : r,
            ),
      );
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setProcesando(false);
      setCambio(null);
    }
  };

  const columnas: Columna<Reporte>[] = [
    {
      clave: "imagenUrl",
      titulo: "Imagen",
      valor: () => "",
      render: (r) => {
        const url = obtenerUrlImagen(r.imagenUrl);
        return url ? (
          <a href={url} target="_blank" rel="noreferrer" title="Abrir imagen completa">
            <img className={styles.miniatura} src={url} alt={`Foto del reporte ${r.titulo}`} loading="lazy" />
          </a>
        ) : (
          <span className={styles.sinImagen}>Sin foto</span>
        );
      },
    },
    {
      clave: "titulo",
      titulo: "Reporte",
      ordenable: true,
      valor: (r) => `${r.titulo} ${r.descripcion}`,
      render: (r) => (
        <div className={styles.celdaReporte}>
          <strong>{r.titulo}</strong>
          <span>{r.descripcion}</span>
        </div>
      ),
    },
    { clave: "autorNombre", titulo: "Ciudadano", ordenable: true },
    {
      clave: "coloniaNombre",
      titulo: "Colonia",
      ordenable: true,
      valor: (r) => `${r.coloniaNombre} (${r.coloniaCodigoPostal})`,
    },
    {
      clave: "fechaReporte",
      titulo: "Fecha",
      ordenable: true,
      valor: (r) => r.fechaReporte,
      render: (r) => formatearFecha(r.fechaReporte),
    },
    {
      clave: "estado",
      titulo: "Estado",
      ordenable: true,
      valor: (r) => NOMBRE_ESTADO[r.estado] ?? r.estado,
      render: (r) => (
        <div className={styles.celdaEstado}>
          <span className={`${styles.etiqueta} ${CLASE_ESTADO[r.estado] ?? ""}`}>
            {NOMBRE_ESTADO[r.estado] ?? r.estado}
          </span>
          {r.estado === "ATENDIDO" && (
            <small>Atendido el {formatearFecha(r.fechaAtencion)}</small>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <header className={styles.encabezado}>
        <h1>Reportes</h1>
        <p>Revisa los reportes de los ciudadanos y actualiza su estado</p>
      </header>

      {error && (
        <div className={styles.error} role="alert">
          <span>{error}</span>
          <button className={styles.botonReintentar} onClick={cargarReportes}>
            Reintentar
          </button>
        </div>
      )}

      <TablaDatos
        datos={reportes}
        columnas={columnas}
        obtenerClave={(r) => String(r.idReporte)}
        cargando={cargando}
        placeholderBusqueda="Buscar por título, ciudadano o colonia..."
        mensajeVacio="No hay reportes con este estado"
        filtros={
          <select
            className={styles.selector}
            value={filtroEstado}
            onChange={(evento) => setFiltroEstado(evento.target.value)}
            aria-label="Filtrar por estado"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_PROCESO">En proceso</option>
            <option value="ATENDIDO">Atendido</option>
            <option value="RECHAZADO">Rechazado</option>
          </select>
        }
        acciones={(r) => (
          <select
            className={styles.selectorAccion}
            value=""
            disabled={procesando}
            aria-label={`Cambiar estado del reporte ${r.titulo}`}
            onChange={(evento) =>
              setCambio({ reporte: r, estadoNuevo: evento.target.value as EstadoReporte })
            }
          >
            <option value="" disabled>
              Cambiar estado…
            </option>
            {ESTADOS_DESTINO.filter((estado) => estado !== r.estado).map((estado) => (
              <option key={estado} value={estado}>
                {NOMBRE_ESTADO[estado]}
              </option>
            ))}
          </select>
        )}
      />

      <ModalConfirmacion
        abierto={cambio !== null}
        titulo="Cambiar estado del reporte"
        mensaje={
          cambio
            ? `¿Cambiar "${cambio.reporte.titulo}" de ${NOMBRE_ESTADO[cambio.reporte.estado]} a ${NOMBRE_ESTADO[cambio.estadoNuevo]}?` +
              (cambio.estadoNuevo === "ATENDIDO" ? " Se guardará la fecha de atención." : "")
            : ""
        }
        textoConfirmar="Cambiar estado"
        onConfirmar={confirmarCambio}
        onCancelar={() => setCambio(null)}
      />
    </div>
  );
}
