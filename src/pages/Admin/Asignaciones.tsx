import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";

import { useAuth } from "../../context/AuthContext";
import {
  crearAsignacionFija,
  desactivarAsignacion,
  listarAsignacionesFijas,
  obtenerAsignaciones,
  obtenerOpcionesAsignacion,
} from "../../services/api";
import styles from "./Asignaciones.module.css";

interface Opciones {
  operadores: { correo: string; nombre: string }[];
  rutas: { nombre: string }[];
  vehiculos: { placa: string; numeroEconomico: string; estado: string }[];
}
interface Asignacion {
  idAsignacion: number;
  correoOperador: string;
  nombreOperador: string;
  rutaNombre: string;
  placaVehiculo: string;
  numeroEconomico: string;
  diasSemana: number[];
  activa: boolean;
}
interface Ejecucion {
  folioEjecucion: number;
  rutaNombre: string;
  placaVehiculo: string;
  numeroEconomico: string;
  estado: string;
  fechaProgramada: string;
}

const DIAS = ["", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
function fechaOaxaca() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Mexico_City",
  });
}

export default function Asignaciones() {
  const navigate = useNavigate();
  const { cerrarSesion } = useAuth();

  const [fecha, setFecha] = useState(fechaOaxaca);
  const [operador, setOperador] = useState("");
  const [ruta, setRuta] = useState("");
  const [vehiculo, setVehiculo] = useState("");
  const [diasSemana, setDiasSemana] = useState<number[]>([1, 2, 3, 4, 5]);
  const [opciones, setOpciones] = useState<Opciones | null>(null);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [ejecuciones, setEjecuciones] = useState<Ejecucion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const consultar = useCallback(async () => {
    setCargando(true);
    try {
      const [datosOpciones, datosFijos, datosEjecuciones] = await Promise.all([
        obtenerOpcionesAsignacion(),
        listarAsignacionesFijas(),
        obtenerAsignaciones(fecha),
      ]);
      setOpciones(datosOpciones);
      setAsignaciones(datosFijos);
      setEjecuciones(datosEjecuciones);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las asignaciones.");
    } finally {
      setCargando(false);
    }
  }, [fecha]);

  useEffect(() => {
    void consultar();
  }, [consultar]);

  const alternarDia = (dia: number) => {
    setDiasSemana((actual) =>
      actual.includes(dia)
        ? actual.filter((d) => d !== dia)
        : [...actual, dia].sort((a, b) => a - b),
    );
  };

  const guardar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (!diasSemana.length) {
      setError("Selecciona al menos un día de la semana.");
      return;
    }

    setProcesando(true);
    try {
      await crearAsignacionFija({
        correoOperador: operador,
        rutaNombre: ruta,
        placaVehiculo: vehiculo,
        diasSemana,
      });
      setMensaje(
        "Asignación permanente guardada. El operador podrá iniciar su recorrido cada día asignado.",
      );
      setOperador("");
      setRuta("");
      setVehiculo("");
      await consultar();
    } catch (err) {
      const fallo = err as Error & { status?: number };
      setError(
        fallo.status === 409
          ? "Ese conductor ya tiene asignación activa o el vehículo tiene días ocupados. Desactiva la asignación anterior o elige otros días."
          : err instanceof Error ? err.message : "No se pudo guardar la asignación.",
      );
    } finally {
      setProcesando(false);
    }
  };

  const quitar = async (id: number) => {
    if (!window.confirm("¿Desactivar esta asignación? Los recorridos anteriores se conservan.")) return;
    setProcesando(true);
    setError("");
    setMensaje("");
    try {
      await desactivarAsignacion(id);
      setMensaje("Asignación desactivada. El historial no se borró.");
      await consultar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo desactivar la asignación.");
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
        <h2>Asignaciones de rutas y unidades</h2>
        <p>
          Configura una sola vez la ruta y unidad del operador, además de los
          días en que trabajará. La asignación se mantiene activa hasta desactivarla.
        </p>

        {error && <p className={styles.error} role="alert">{error}</p>}
        {mensaje && <p className={styles.exito} role="status">{mensaje}</p>}

        <form className={styles.panel} onSubmit={guardar}>
          <h3>Nueva asignación permanente</h3>
          <label>Conductor
            <select required value={operador} onChange={(e) => setOperador(e.target.value)}
              disabled={cargando || procesando}>
              <option value="">Selecciona un conductor</option>
              {opciones?.operadores.map((o) => (
                <option key={o.correo} value={o.correo}>
                  {o.nombre} ({o.correo})
                </option>
              ))}
            </select>
          </label>
          <label>Ruta
            <select required value={ruta} onChange={(e) => setRuta(e.target.value)}
              disabled={cargando || procesando}>
              <option value="">Selecciona una ruta activa</option>
              {opciones?.rutas.map((r) => (
                <option key={r.nombre} value={r.nombre}>{r.nombre}</option>
              ))}
            </select>
          </label>
          <label>Unidad
            <select required value={vehiculo} onChange={(e) => setVehiculo(e.target.value)}
              disabled={cargando || procesando}>
              <option value="">Selecciona una unidad</option>
              {opciones?.vehiculos
                .filter((v) => v.estado !== "MANTENIMIENTO" && v.estado !== "FUERA_SERVICIO")
                .map((v) => (
                  <option key={v.placa} value={v.placa}>
                    {v.numeroEconomico} · {v.placa}
                  </option>
                ))}
            </select>
          </label>

          <fieldset className={styles.dias}>
            <legend>Días de trabajo *</legend>
            <div className={styles.diasOpciones}>
              {DIAS.slice(1).map((nombre, indice) => {
                const dia = indice + 1;
                return (
                  <label key={dia} className={styles.diaCheck}>
                    <input type="checkbox" checked={diasSemana.includes(dia)}
                      disabled={procesando}
                      onChange={() => alternarDia(dia)} />
                    {nombre}
                  </label>
                );
              })}
            </div>
            <div className={styles.diasAcciones}>
              <button type="button" onClick={() => setDiasSemana([1, 2, 3, 4, 5])}>
                Lunes a viernes
              </button>
              <button type="button" onClick={() => setDiasSemana([1, 2, 3, 4, 5, 6, 7])}>
                Todos los días
              </button>
            </div>
          </fieldset>

          <button className={styles.primario} type="submit"
            disabled={procesando || cargando || diasSemana.length === 0}>
            {procesando ? "Guardando..." : "Guardar asignación permanente"}
          </button>
        </form>

        <section className={styles.panel}>
          <div className={styles.encabezado}>
            <h2>Asignaciones activas</h2>
            <button type="button" onClick={() => void consultar()} disabled={procesando}>
              Actualizar
            </button>
          </div>
          {cargando ? <p>Cargando asignaciones...</p>
            : asignaciones.length === 0 ? <p>No hay asignaciones permanentes registradas.</p>
            : <div className={styles.tabla}>
                <table>
                  <thead>
                    <tr><th>Conductor</th><th>Ruta</th><th>Unidad</th><th>Días</th><th>Acción</th></tr>
                  </thead>
                  <tbody>
                    {asignaciones.map((a) => (
                      <tr key={a.idAsignacion}>
                        <td>{a.nombreOperador}<small> ({a.correoOperador})</small></td>
                        <td>{a.rutaNombre}</td>
                        <td>{a.numeroEconomico} · {a.placaVehiculo}</td>
                        <td>{a.diasSemana.map((d) => DIAS[d]).join(", ")}</td>
                        <td>
                          <button type="button" disabled={procesando}
                            onClick={() => void quitar(a.idAsignacion)}>Desactivar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>}
        </section>

        <section className={styles.panel}>
          <div className={styles.encabezado}>
            <h2>Historial diario</h2>
            <input aria-label="Fecha del historial" type="date" value={fecha}
              onChange={(e) => setFecha(e.target.value || fechaOaxaca())} />
          </div>
          {cargando ? <p>Cargando recorridos...</p> : ejecuciones.length === 0
            ? <p>No hay recorridos iniciados o programados para esta fecha.</p>
            : <div className={styles.tabla}>
                <table>
                  <thead><tr><th>Folio</th><th>Ruta</th><th>Unidad</th><th>Estado</th></tr></thead>
                  <tbody>{ejecuciones.map((e) => (
                    <tr key={e.folioEjecucion}>
                      <td>{e.folioEjecucion}</td><td>{e.rutaNombre}</td>
                      <td>{e.numeroEconomico} · {e.placaVehiculo}</td>
                      <td>{e.estado}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>}
        </section>
      </main>
    </div>
  );
}
