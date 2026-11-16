import { useEffect, useState, useMemo } from "react";
import styles from "./RutasAdmin.module.css";
import ModalConfirmacion from "../../components/Admin/ModalConfirmacion";
import {
  obtenerRutas,
  desactivarRuta,
  activarRuta,
  eliminarRuta,
} from "../../services/adminRutasApi";

interface Ruta {
  nombre: string;
  descripcion: string | null;
  distanciaKm: number | null;
  activo: boolean;
  fechaCreacion: string;
  totalColonias: number;
}

type FiltroEstado = "todas" | "activas" | "inactivas";

function mensajeDeError(error: unknown): string {
  const estado = (error as { status?: number } | null)?.status;
  if (estado === 403) return "No tienes permisos para administrar rutas.";
  if (estado === 404) return "La ruta ya no existe.";
  if (estado === 409) {
    return "No se puede eliminar: la ruta tiene horarios o recorridos registrados. Desactívala en su lugar.";
  }
  return "No se pudo conectar con el servidor. Intenta de nuevo.";
}

export default function RutasAdmin() {
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todas");
  const [procesando, setProcesando] = useState<string | null>(null);
  const [rutaAEliminar, setRutaAEliminar] = useState<Ruta | null>(null);

  const cargarRutas = () => {
    setCargando(true);
    setError("");
    obtenerRutas()
      .then((datos: Ruta[]) => setRutas(datos))
      .catch((err: unknown) => setError(mensajeDeError(err)))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargarRutas();
  }, []);

  const rutasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return rutas.filter((ruta) => {
      if (filtroEstado === "activas" && !ruta.activo) return false;
      if (filtroEstado === "inactivas" && ruta.activo) return false;
      if (!termino) return true;
      return (
        ruta.nombre.toLowerCase().includes(termino) ||
        (ruta.descripcion ?? "").toLowerCase().includes(termino)
      );
    });
  }, [rutas, busqueda, filtroEstado]);

  const cambiarEstado = async (ruta: Ruta) => {
    setProcesando(ruta.nombre);
    setError("");
    try {
      if (ruta.activo) {
        await desactivarRuta(ruta.nombre);
      } else {
        await activarRuta(ruta.nombre);
      }
      cargarRutas();
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setProcesando(null);
    }
  };

  const confirmarEliminar = async () => {
    if (!rutaAEliminar) return;
    const { nombre } = rutaAEliminar;
    setRutaAEliminar(null);
    setProcesando(nombre);
    setError("");
    try {
      await eliminarRuta(nombre);
      cargarRutas();
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setProcesando(null);
    }
  };

  const formatearFecha = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div>
      <header className={styles.encabezado}>
        <div>
          <h1>Rutas</h1>
          <p>Gestiona las rutas de recolección</p>
        </div>
        <button type="button" className={styles.botonPrimario} disabled>
          + Nueva ruta
        </button>
      </header>

      <div className={styles.controles}>
        <input
          type="search"
          placeholder="Buscar por nombre o descripción..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className={styles.buscador}
        />
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
          className={styles.filtro}
        >
          <option value="todas">Todas</option>
          <option value="activas">Solo activas</option>
          <option value="inactivas">Solo inactivas</option>
        </select>
      </div>

      {cargando && <p className={styles.estado}>Cargando rutas...</p>}
      {error && (
        <p className={styles.errorMsg} role="alert">
          {error}
        </p>
      )}

      {!cargando && !error && rutasFiltradas.length === 0 && (
        <p className={styles.estado}>No se encontraron rutas.</p>
      )}

      {!cargando && rutasFiltradas.length > 0 && (
        <div className={styles.contenedorTabla}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Distancia</th>
                <th>Colonias</th>
                <th>Estado</th>
                <th>Creada</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rutasFiltradas.map((ruta) => (
                <tr key={ruta.nombre}>
                  <td className={styles.nombreCelda}>{ruta.nombre}</td>
                  <td className={styles.descripcionCelda}>
                    {ruta.descripcion || "—"}
                  </td>
                  <td>
                    {ruta.distanciaKm != null ? `${ruta.distanciaKm} km` : "—"}
                  </td>
                  <td>{ruta.totalColonias}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        ruta.activo
                          ? styles.badgeActivo
                          : styles.badgeInactivo
                      }`}
                    >
                      {ruta.activo ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td>{formatearFecha(ruta.fechaCreacion)}</td>
                  <td className={styles.acciones}>
                    <button
                      type="button"
                      className={styles.botonSecundario}
                      disabled
                      title="Disponible próximamente"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className={styles.botonSecundario}
                      onClick={() => cambiarEstado(ruta)}
                      disabled={procesando === ruta.nombre}
                    >
                      {ruta.activo ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      type="button"
                      className={styles.botonPeligro}
                      onClick={() => setRutaAEliminar(ruta)}
                      disabled={procesando === ruta.nombre}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ModalConfirmacion
        abierto={rutaAEliminar !== null}
        titulo="Eliminar ruta"
        mensaje={`¿Eliminar la ruta "${rutaAEliminar?.nombre ?? ""}"? Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar"
        onConfirmar={confirmarEliminar}
        onCancelar={() => setRutaAEliminar(null)}
      />
    </div>
  );
}