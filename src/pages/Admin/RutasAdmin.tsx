import { useEffect, useState, useMemo } from "react";
import styles from "./RutasAdmin.module.css";
import ModalConfirmacion from "../../components/Admin/ModalConfirmacion";
import FormularioRuta from "../../components/Admin/FormularioRuta";
import type {
  ColoniaOpcion,
  DatosRuta,
  ValoresRuta,
} from "../../components/Admin/FormularioRuta";
import {
  obtenerRutas,
  obtenerRuta,
  obtenerColonias,
  crearRuta,
  editarRuta,
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

interface DetalleRuta {
  nombre: string;
  descripcion: string | null;
  distanciaKm: number | null;
  colonias: ColoniaOpcion[];
}

type FiltroEstado = "todas" | "activas" | "inactivas";

type FormularioAbierto = {
  modo: "crear" | "editar";
  inicial: ValoresRuta;
} | null;

function mensajeDeError(error: unknown): string {
  const estado = (error as { status?: number } | null)?.status;
  if (estado === 403) return "No tienes permisos para administrar rutas.";
  if (estado === 404) return "La ruta ya no existe.";
  if (estado === 409) {
    return "No se puede eliminar: la ruta tiene horarios o recorridos registrados. Desactívala en su lugar.";
  }
  return "No se pudo conectar con el servidor. Intenta de nuevo.";
}

function mensajeDeErrorFormulario(
  error: unknown,
  modo: "crear" | "editar",
): string {
  const estado = (error as { status?: number } | null)?.status;
  if (estado === 400) {
    return "Algún dato no es válido. Revisa el nombre y las colonias.";
  }
  if (estado === 403) return "No tienes permisos para administrar rutas.";
  if (estado === 404) return "La ruta ya no existe.";
  if (estado === 409) {
    return modo === "crear"
      ? "Ya existe una ruta con ese nombre."
      : "No se pudo guardar por un conflicto con otra ruta.";
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

  const [colonias, setColonias] = useState<ColoniaOpcion[]>([]);
  const [formulario, setFormulario] = useState<FormularioAbierto>(null);
  const [abriendo, setAbriendo] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

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

  const cargarColonias = async (): Promise<ColoniaOpcion[]> => {
    if (colonias.length > 0) return colonias;
    const lista = (await obtenerColonias()) as ColoniaOpcion[];
    setColonias(lista);
    return lista;
  };

  const abrirCrear = async () => {
    setError("");
    setAbriendo("nueva");
    try {
      await cargarColonias();
      setErrorForm("");
      setFormulario({
        modo: "crear",
        inicial: { nombre: "", descripcion: "", distanciaKm: "", colonias: [] },
      });
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setAbriendo(null);
    }
  };

  const abrirEditar = async (ruta: Ruta) => {
    setError("");
    setAbriendo(ruta.nombre);
    try {
      const [detalle] = await Promise.all([
        obtenerRuta(ruta.nombre) as Promise<DetalleRuta>,
        cargarColonias(),
      ]);
      setErrorForm("");
      setFormulario({
        modo: "editar",
        inicial: {
          nombre: detalle.nombre,
          descripcion: detalle.descripcion ?? "",
          distanciaKm:
            detalle.distanciaKm != null ? String(detalle.distanciaKm) : "",
          colonias: detalle.colonias,
        },
      });
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setAbriendo(null);
    }
  };

  const guardar = async (datos: DatosRuta) => {
    if (!formulario) return;
    setGuardando(true);
    setErrorForm("");
    try {
      const cuerpo = {
        descripcion: datos.descripcion || null,
        distanciaKm: datos.distanciaKm,
        colonias: datos.colonias,
      };
      if (formulario.modo === "crear") {
        await crearRuta({ nombre: datos.nombre, ...cuerpo });
      } else {
        await editarRuta(formulario.inicial.nombre, cuerpo);
      }
      setFormulario(null);
      cargarRutas();
    } catch (err) {
      setErrorForm(mensajeDeErrorFormulario(err, formulario.modo));
    } finally {
      setGuardando(false);
    }
  };

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
        <button
          type="button"
          className={styles.botonPrimario}
          onClick={abrirCrear}
          disabled={abriendo !== null}
        >
          {abriendo === "nueva" ? "Abriendo..." : "+ Nueva ruta"}
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
                      onClick={() => abrirEditar(ruta)}
                      disabled={
                        procesando === ruta.nombre || abriendo !== null
                      }
                    >
                      {abriendo === ruta.nombre ? "Abriendo..." : "Editar"}
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

      {formulario && (
        <FormularioRuta
          modo={formulario.modo}
          inicial={formulario.inicial}
          colonias={colonias}
          guardando={guardando}
          errorServidor={errorForm}
          onGuardar={guardar}
          onCancelar={() => setFormulario(null)}
        />
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