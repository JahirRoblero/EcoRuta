import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import styles from "./TablaDatos.module.css";

type ValorCelda = string | number | boolean | null | undefined;

export interface Columna<T> {
  clave: string;
  titulo: string;
  ordenable?: boolean;
  valor?: (fila: T) => ValorCelda;
  render?: (fila: T) => ReactNode;
}

interface TablaDatosProps<T> {
  datos: T[];
  columnas: Columna<T>[];
  obtenerClave: (fila: T) => string;
  acciones?: (fila: T) => ReactNode;
  filtros?: ReactNode;
  cargando?: boolean;
  placeholderBusqueda?: string;
  mensajeVacio?: string;
}

type Direccion = "asc" | "desc";

function leerValor<T>(fila: T, columna: Columna<T>): ValorCelda {
  if (columna.valor) return columna.valor(fila);
  return (fila as unknown as Record<string, ValorCelda>)[columna.clave];
}

function comparar(a: ValorCelda, b: ValorCelda): number {
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "es", { sensitivity: "base" });
}

export default function TablaDatos<T>({
  datos,
  columnas,
  obtenerClave,
  acciones,
  filtros,
  cargando = false,
  placeholderBusqueda = "Buscar...",
  mensajeVacio = "No hay registros para mostrar",
}: TablaDatosProps<T>) {
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<{ clave: string; direccion: Direccion } | null>(null);

  const filasVisibles = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    const filtradas = termino
      ? datos.filter((fila) =>
          columnas.some((columna) =>
            String(leerValor(fila, columna) ?? "").toLowerCase().includes(termino),
          ),
        )
      : datos;

    if (!orden) return filtradas;

    const columna = columnas.find((c) => c.clave === orden.clave);
    if (!columna) return filtradas;

    const factor = orden.direccion === "asc" ? 1 : -1;
    return [...filtradas].sort(
      (a, b) => comparar(leerValor(a, columna), leerValor(b, columna)) * factor,
    );
  }, [datos, columnas, busqueda, orden]);

  const cambiarOrden = (clave: string) => {
    setOrden((actual) =>
      actual?.clave === clave && actual.direccion === "asc"
        ? { clave, direccion: "desc" }
        : { clave, direccion: "asc" },
    );
  };

  const indicadorOrden = (clave: string) => {
    if (orden?.clave !== clave) return " ↕";
    return orden.direccion === "asc" ? " ↑" : " ↓";
  };

  const totalColumnas = columnas.length + (acciones ? 1 : 0);

  return (
    <div className={styles.contenedor}>
      <div className={styles.barra}>
        <input
          type="search"
          className={styles.buscador}
          placeholder={placeholderBusqueda}
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
        />
        {filtros && <div className={styles.filtros}>{filtros}</div>}
      </div>

      <div className={styles.envoltura}>
        <table className={styles.tabla}>
          <thead>
            <tr>
              {columnas.map((columna) => (
                <th key={columna.clave}>
                  {columna.ordenable ? (
                    <button
                      type="button"
                      className={styles.botonOrden}
                      onClick={() => cambiarOrden(columna.clave)}
                    >
                      {columna.titulo}
                      {indicadorOrden(columna.clave)}
                    </button>
                  ) : (
                    columna.titulo
                  )}
                </th>
              ))}
              {acciones && <th>Acciones</th>}
            </tr>
          </thead>

          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={totalColumnas} className={styles.mensaje}>
                  Cargando...
                </td>
              </tr>
            ) : filasVisibles.length === 0 ? (
              <tr>
                <td colSpan={totalColumnas} className={styles.mensaje}>
                  {mensajeVacio}
                </td>
              </tr>
            ) : (
              filasVisibles.map((fila) => (
                <tr key={obtenerClave(fila)}>
                  {columnas.map((columna) => (
                    <td key={columna.clave}>
                      {columna.render
                        ? columna.render(fila)
                        : String(leerValor(fila, columna) ?? "—")}
                    </td>
                  ))}
                  {acciones && <td className={styles.celdaAcciones}>{acciones(fila)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!cargando && (
        <p className={styles.conteo}>
          Mostrando {filasVisibles.length} de {datos.length}
        </p>
      )}
    </div>
  );
}