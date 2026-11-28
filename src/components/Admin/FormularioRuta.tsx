import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import styles from "./FormularioRuta.module.css";

export interface ColoniaOpcion {
  nombre: string;
  codigoPostal: string;
}

export interface ValoresRuta {
  nombre: string;
  descripcion: string;
  distanciaKm: string;
  colonias: ColoniaOpcion[];
}

export interface DatosRuta {
  nombre: string;
  descripcion: string;
  distanciaKm: number | null;
  colonias: ColoniaOpcion[];
}

interface FormularioRutaProps {
  modo: "crear" | "editar";
  inicial: ValoresRuta;
  colonias: ColoniaOpcion[];
  guardando: boolean;
  errorServidor: string;
  onGuardar: (datos: DatosRuta) => void;
  onCancelar: () => void;
}

interface Errores {
  nombre?: string;
  distancia?: string;
  colonias?: string;
}

const clave = (c: ColoniaOpcion) => `${c.nombre}|${c.codigoPostal}`;

export default function FormularioRuta({
  modo,
  inicial,
  colonias,
  guardando,
  errorServidor,
  onGuardar,
  onCancelar,
}: FormularioRutaProps) {
  const [nombre, setNombre] = useState(inicial.nombre);
  const [descripcion, setDescripcion] = useState(inicial.descripcion);
  const [distancia, setDistancia] = useState(inicial.distanciaKm);
  const [seleccion, setSeleccion] = useState<Set<string>>(
    () => new Set(inicial.colonias.map(clave)),
  );
  const [busqueda, setBusqueda] = useState("");
  const [errores, setErrores] = useState<Errores>({});

  const todas = useMemo(() => {
    const mapa = new Map<string, ColoniaOpcion>();
    [...inicial.colonias, ...colonias].forEach((c) => mapa.set(clave(c), c));
    return [...mapa.values()].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es"),
    );
  }, [inicial.colonias, colonias]);

  const visibles = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return todas;
    return todas.filter(
      (c) =>
        c.nombre.toLowerCase().includes(termino) ||
        c.codigoPostal.includes(termino),
    );
  }, [todas, busqueda]);

  const alternar = (k: string) => {
    setSeleccion((anterior) => {
      const siguiente = new Set(anterior);
      if (siguiente.has(k)) {
        siguiente.delete(k);
      } else {
        siguiente.add(k);
      }
      return siguiente;
    });
  };

  const validar = () => {
    const nuevos: Errores = {};
    const n = nombre.trim();

    if (modo === "crear") {
      if (!n) {
        nuevos.nombre = "El nombre es obligatorio.";
      } else if (n.length > 60) {
        nuevos.nombre = "El nombre no puede superar los 60 caracteres.";
      } else if (/[\\/]/.test(n)) {
        nuevos.nombre = "El nombre no puede contener / ni \\.";
      }
    }

    const d = distancia.trim();
    if (d !== "" && !/^\d{1,6}(\.\d{1,2})?$/.test(d)) {
      nuevos.distancia =
        "Escribe un número, máximo 6 enteros y 2 decimales (por ejemplo 4.5).";
    }

    if (seleccion.size === 0) {
      nuevos.colonias = "Selecciona al menos una colonia.";
    }

    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const enviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (!validar()) return;

    const d = distancia.trim();
    onGuardar({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      distanciaKm: d === "" ? null : Number(d),
      colonias: todas.filter((c) => seleccion.has(clave(c))),
    });
  };

  return (
    <div className={styles.fondo}>
      <form
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-form-ruta"
        onSubmit={enviar}
        noValidate
      >
        <h2 id="titulo-form-ruta" className={styles.titulo}>
          {modo === "crear" ? "Nueva ruta" : "Editar ruta"}
        </h2>

        <label className={styles.etiqueta} htmlFor="ruta-nombre">
          Nombre
        </label>
        <input
          id="ruta-nombre"
          className={styles.campo}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          disabled={modo === "editar"}
          maxLength={60}
        />
        {errores.nombre && <p className={styles.error}>{errores.nombre}</p>}

        <label className={styles.etiqueta} htmlFor="ruta-descripcion">
          Descripción
        </label>
        <textarea
          id="ruta-descripcion"
          className={styles.campo}
          rows={3}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />

        <label className={styles.etiqueta} htmlFor="ruta-distancia">
          Distancia (km)
        </label>
        <input
          id="ruta-distancia"
          className={styles.campo}
          inputMode="decimal"
          value={distancia}
          onChange={(e) => setDistancia(e.target.value)}
        />
        {errores.distancia && (
          <p className={styles.error}>{errores.distancia}</p>
        )}

        <span className={styles.etiqueta}>
          Colonias{" "}
          <span className={styles.contador}>
            ({seleccion.size} seleccionadas)
          </span>
        </span>
        <input
          type="search"
          className={styles.campo}
          placeholder="Buscar colonia o código postal..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <div
          className={styles.listaColonias}
          role="group"
          aria-label="Colonias de la ruta "
        >
          {visibles.map((c) => (
            <label key={clave(c)} className={styles.opcionColonia}>
              <input
                type="checkbox"
                checked={seleccion.has(clave(c))}
                onChange={() => alternar(clave(c))}
              />
              <span>{c.nombre}</span>
              <span className={styles.codigo}>{c.codigoPostal}</span>
            </label>
          ))}
          {visibles.length === 0 && (
            <p className={styles.vacio}>No hay colonias que coincidan.</p>
          )}
        </div>
        {errores.colonias && (
          <p className={styles.error}>{errores.colonias}</p>
        )}

        {errorServidor && (
          <p className={styles.errorServidor} role="alert">
            {errorServidor}
          </p>
        )}

        <div className={styles.acciones}>
          <button
            type="button"
            className={styles.botonCancelar}
            onClick={onCancelar}
            disabled={guardando}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={styles.botonGuardar}
            disabled={guardando}
          >
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}