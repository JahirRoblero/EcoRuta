import { useEffect, useState, useMemo } from "react";
import styles from "./RutasAdmin.module.css";
import {
  obtenerRutas,
  desactivarRuta,
  activarRuta,
  eliminarRuta,
} from "../../services/adminApi";

interface Ruta {
  nombre: string;
  descripcion: string | null;
  distancia_km: number | null;
  activo: boolean;
  fecha_creacion: string;
  colonias: number;
}

type FiltroEstado = "todas" | "activas" | "inactivas";

export default function RutasAdmin() {
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todas");
  const [procesando, setProcesando] = useState<string | null>(null);

  const cargarRutas = () => {
    setCargando(true);
    setError("");
    obtenerRutas()
      .then((datos: Ruta[]) => setRutas(datos))
      .catch((err: Error) => setError(err.message))
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
    try {
      if (ruta.activo) {
        await desactivarRuta(ruta.nombre);
      } else {
        await activarRuta(ruta.nombre);
      }
      cargarRutas();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProcesando(null);
    }
  };

  const confirmarEliminar = async (ruta: Ruta) => {
    const ok = window.confirm(
      `¿Eliminar la ruta "${ruta.nombre}"? Esta acción no se puede deshacer.`,
    );
    if (!ok) return;
    setProcesando(ruta.nombre);
    try {
      await eliminarRuta(ruta.nombre);
      cargarRutas();
    } catch (err) {
      setError((err as Error).message);
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

      {!cargando && !error && rutasFiltradas.length > 0 && (
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
                    {ruta.distancia_km ? `${ruta.distancia_km} km` : "—"}
                  </td>
                  <td>{ruta.colonias}</td>
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
                  <td>{formatearFecha(ruta.fecha_creacion)}</td>
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
                      onClick={() => confirmarEliminar(ruta)}
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
    </div>
  );
}