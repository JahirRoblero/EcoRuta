import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { asignarRecorrido, obtenerAsignaciones, obtenerOpcionesAsignacion } from "../../services/api";
import styles from "./Asignaciones.module.css";

interface Opciones {
  operadores: { correo: string; nombre: string }[];
  rutas: { nombre: string }[];
  vehiculos: { placa: string; numeroEconomico: string; estado: string }[];
}
interface Ejecucion {
  folioEjecucion: number;
  rutaNombre: string;
  placaVehiculo: string;
  numeroEconomico: string;
  estado: string;
  fechaProgramada: string;
}

function fechaOaxaca() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
}

export default function Asignaciones() {
  const navigate = useNavigate();
  const { cerrarSesion } = useAuth();
  const [fecha, setFecha] = useState(fechaOaxaca);
  const [operador, setOperador] = useState("");
  const [ruta, setRuta] = useState("");
  const [vehiculo, setVehiculo] = useState("");
  const [opciones, setOpciones] = useState<Opciones | null>(null);
  const [ejecuciones, setEjecuciones] = useState<Ejecucion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const consultar = async () => {
    setCargando(true);
    try {
      const [datosOpciones, datosEjecuciones] = await Promise.all([
        obtenerOpcionesAsignacion(), obtenerAsignaciones(fecha),
      ]);
      setOpciones(datosOpciones);
      setEjecuciones(datosEjecuciones);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar asignaciones.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { void consultar(); }, [fecha]);

  const guardar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProcesando(true);
    setMensaje("");
    setError("");
    try {
      await asignarRecorrido({
        correoOperador: operador,
        rutaNombre: ruta,
        placaVehiculo: vehiculo,
        fechaProgramada: fecha,
      });
      setMensaje("Recorrido asignado correctamente. El conductor puede verlo en su panel.");
      setOperador("");
      setRuta("");
      setVehiculo("");
      await consultar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la asignación.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className={styles.pagina}>
      <header className={styles.barra}>
        <h1>Ecorruta · Administración</h1>
        <button type="button" onClick={() => {
          cerrarSesion();
          navigate("/login", { replace: true });
        }}>Cerrar sesión</button>
      </header>
      <main className={styles.contenido}>
        <h2>Asignar rutas y unidades a operadores</h2>
        <p>Solo el administrador decide qué conductor realiza cada ruta y con qué vehículo.</p>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {mensaje && <p className={styles.exito} role="status">{mensaje}</p>}
        <form className={styles.panel} onSubmit={guardar}>
          <label>Fecha programada
            <input type="date" min={fechaOaxaca()} value={fecha}
              onChange={(e) => setFecha(e.target.value)} required />
          </label>
          <label>Conductor
            <select required value={operador} onChange={(e) => setOperador(e.target.value)}
              disabled={cargando || procesando}>
              <option value="">Selecciona un conductor</option>
              {opciones?.operadores.map((o) =>
                <option key={o.correo} value={o.correo}>{o.nombre} ({o.correo})</option>)}
            </select>
          </label>
          <label>Ruta
            <select required value={ruta} onChange={(e) => setRuta(e.target.value)}
              disabled={cargando || procesando}>
              <option value="">Selecciona una ruta activa</option>
              {opciones?.rutas.map((r) =>
                <option key={r.nombre} value={r.nombre}>{r.nombre}</option>)}
            </select>
          </label>
          <label>Unidad
            <select required value={vehiculo} onChange={(e) => setVehiculo(e.target.value)}
              disabled={cargando || procesando}>
              <option value="">Selecciona una unidad</option>
              {opciones?.vehiculos.filter((v) => v.estado === "DISPONIBLE")
                .map((v) => <option key={v.placa} value={v.placa}>
                  {v.numeroEconomico} · {v.placa}</option>)}
            </select>
          </label>
          <button className={styles.primario} type="submit"
            disabled={procesando || cargando}>
            {procesando ? "Asignando..." : "Asignar recorrido"}
          </button>
        </form>

        <section className={styles.panel}>
          <div className={styles.encabezado}>
            <h2>Recorridos programados · {fecha}</h2>
            <button type="button" onClick={() => void consultar()}>Actualizar</button>
          </div>
          {cargando ? <p>Cargando recorridos...</p> : ejecuciones.length === 0
            ? <p>No hay recorridos programados en esta fecha.</p>
            : <div className={styles.tabla}>
                <table>
                  <thead><tr><th>Folio</th><th>Ruta</th><th>Unidad</th><th>Estado</th></tr></thead>
                  <tbody>{ejecuciones.map((e) => <tr key={e.folioEjecucion}>
                    <td>{e.folioEjecucion}</td><td>{e.rutaNombre}</td>
                    <td>{e.numeroEconomico} · {e.placaVehiculo}</td>
                    <td>{e.estado}</td>
                  </tr>)}</tbody>
                </table>
              </div>}
        </section>
      </main>
    </div>
  );
}
