import { useEffect, useState } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";

import Barra from "../../components/Inicio/Barra/Barra";
import BarraLateral from "../../components/Inicio/BarraLateral/BarraLateral";
import Footer from "../../components/Inicio/Footer/Footer";

import { crearReporte } from "../../services/api";
import styles from "./Quejas.module.css";

interface DatosReporte {
  coloniaNombre: string;
  coloniaCodigoPostal: string;
  titulo: string;
  descripcion: string;
}

interface RespuestaPostal {
  cp: string;
  estado: string;
  municipio: string;
  asentamientos: {
    nombre: string;
    tipo: string;
  }[];
}

const datosIniciales: DatosReporte = {
  coloniaNombre: "",
  coloniaCodigoPostal: "",
  titulo: "",
  descripcion: "",
};

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANO_MAXIMO = 5 * 1024 * 1024;

export default function Quejas() {
  const [estaAbierto, setEstaAbierto] = useState(false);
  const [datos, setDatos] = useState<DatosReporte>(datosIniciales);

  const [colonias, setColonias] = useState<string[]>([]);
  const [buscandoColonias, setBuscandoColonias] = useState(false);
  const [errorCP, setErrorCP] = useState("");

  const [imagen, setImagen] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const codigoPostal = datos.coloniaCodigoPostal;

    if (!/^\d{5}$/.test(codigoPostal)) {
      return;
    }

    const controlador = new AbortController();

    const buscarColonias = async () => {
      setBuscandoColonias(true);
      setErrorCP("");

      try {
        const respuesta = await fetch(
          `https://postali.app/api/v1/mx/cp/${codigoPostal}`,
          { signal: controlador.signal },
        );

        if (!respuesta.ok) {
          throw new Error(
            respuesta.status === 404
              ? "Código postal no encontrado."
              : "No se pudieron consultar las colonias.",
          );
        }

        const resultado: RespuestaPostal = await respuesta.json();

        if (controlador.signal.aborted) return;

        const nombres = [
          ...new Set(
            (resultado.asentamientos ?? [])
              .map((colonia) => colonia.nombre.trim())
              .filter(Boolean),
          ),
        ].sort((a, b) => a.localeCompare(b, "es"));

        setColonias(nombres);

        if (nombres.length === 1) {
          setDatos((anterior) => ({
            ...anterior,
            coloniaNombre: nombres[0],
          }));
        }

        if (nombres.length === 0) {
          setErrorCP("No se encontraron colonias para este código postal.");
        }
      } catch (err) {
        if (controlador.signal.aborted) return;

        setColonias([]);

        setErrorCP(
          err instanceof Error
            ? err.message
            : "Error al consultar el código postal.",
        );
      } finally {
        if (!controlador.signal.aborted) {
          setBuscandoColonias(false);
        }
      }
    };

    buscarColonias();

    return () => controlador.abort();
  }, [datos.coloniaCodigoPostal]);

  useEffect(() => {
    if (!imagen) {
      setVistaPrevia(null);
      return;
    }

    const url = URL.createObjectURL(imagen);
    setVistaPrevia(url);

    return () => URL.revokeObjectURL(url);
  }, [imagen]);

  const alCambiar = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.currentTarget;

    if (name === "coloniaCodigoPostal") {
      const codigoLimpio = value.replace(/\D/g, "").slice(0, 5);

      setDatos((anterior) => ({
        ...anterior,
        coloniaCodigoPostal: codigoLimpio,
        coloniaNombre: "",
      }));

      setColonias([]);
      setErrorCP("");
      setBuscandoColonias(false);
      return;
    }

    setDatos((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  };

  const seleccionarImagen = (archivo?: File) => {
    if (!archivo) return;

    setError("");

    if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
      setError("Solo se permiten imágenes JPG, PNG o WebP.");
      return;
    }

    if (archivo.size > TAMANO_MAXIMO) {
      setError("La imagen no puede superar los 5 MB.");
      return;
    }

    setImagen(archivo);
  };

  const alSeleccionarArchivo = (e: ChangeEvent<HTMLInputElement>) => {
    seleccionarImagen(e.currentTarget.files?.[0]);
    e.currentTarget.value = "";
  };

  const alArrastrar = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setArrastrando(true);
  };

  const alSoltar = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setArrastrando(false);

    seleccionarImagen(e.dataTransfer.files[0]);
  };

  const alEnviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setEnviado(false);

    if (
      !/^\d{5}$/.test(datos.coloniaCodigoPostal) ||
      buscandoColonias ||
      !colonias.includes(datos.coloniaNombre)
    ) {
      setError("Selecciona una colonia válida para tu código postal.");
      return;
    }

    setEnviando(true);

    try {
      await crearReporte(
        {
          coloniaNombre: datos.coloniaNombre.trim(),
          coloniaCodigoPostal: datos.coloniaCodigoPostal.trim(),
          titulo: datos.titulo.trim(),
          descripcion: datos.descripcion.trim(),
          latitud: null,
          longitud: null,
        },
        imagen,
      );

      setEnviado(true);
      setDatos({ ...datosIniciales });
      setColonias([]);
      setErrorCP("");
      setImagen(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo registrar el reporte.",
      );
    } finally {
      setEnviando(false);
    }
  };

  const alLimpiar = () => {
    setDatos({ ...datosIniciales });
    setColonias([]);
    setErrorCP("");
    setBuscandoColonias(false);
    setImagen(null);
    setError("");
    setEnviado(false);
  };

  return (
    <>
      <Barra estaAbierto={estaAbierto} alCerrar={() => setEstaAbierto(true)} />

      {estaAbierto && (
        <div
          className={styles["fondo-oscuro"]}
          onClick={() => setEstaAbierto(false)}
        />
      )}

      <main className={styles.contenedor}>
        <h1 className={styles.titulo}>Reportes ciudadanos</h1>

        <p className={styles.subtitulo}>
          Ayúdanos a mejorar la recolección de residuos. Describe el problema y
          adjunta una fotografía si lo consideras necesario.
        </p>

        {enviado && (
          <div className={styles["mensaje-exito"]} role="status">
            ¡Tu reporte fue registrado correctamente!
          </div>
        )}

        {error && <p role="alert">{error}</p>}

        <form className={styles.formulario} onSubmit={alEnviar}>
          <div className={styles.campo}>
            <label className={styles.etiqueta} htmlFor="coloniaCodigoPostal">
              Código postal *
            </label>

            <input
              id="coloniaCodigoPostal"
              name="coloniaCodigoPostal"
              type="text"
              className={styles.control}
              value={datos.coloniaCodigoPostal}
              onChange={alCambiar}
              placeholder="Ej. 68130"
              inputMode="numeric"
              autoComplete="postal-code"
              pattern="[0-9]{5}"
              maxLength={5}
              disabled={enviando}
              required
            />

            {buscandoColonias && (
              <small className={styles.mensajeCP} role="status">
                Buscando colonias...
              </small>
            )}

            {errorCP && (
              <small className={styles.errorCP} role="alert">
                {errorCP}
              </small>
            )}
          </div>

          <div className={styles.campo}>
            <label className={styles.etiqueta} htmlFor="coloniaNombre">
              Colonia *
            </label>

            <select
              id="coloniaNombre"
              name="coloniaNombre"
              className={styles.control}
              value={datos.coloniaNombre}
              onChange={alCambiar}
              disabled={buscandoColonias || enviando || colonias.length === 0}
              required
            >
              <option value="">
                {buscandoColonias
                  ? "Buscando colonias..."
                  : colonias.length > 0
                    ? "Selecciona tu colonia"
                    : "Primero ingresa tu código postal"}
              </option>

              {colonias.map((colonia) => (
                <option key={colonia} value={colonia}>
                  {colonia}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.campo}>
            <label className={styles.etiqueta} htmlFor="titulo">
              Título del reporte *
            </label>

            <input
              id="titulo"
              name="titulo"
              className={styles.control}
              value={datos.titulo}
              onChange={alCambiar}
              placeholder="Ej. Basura acumulada"
              maxLength={60}
              disabled={enviando}
              required
            />
          </div>

          <div className={styles.campo}>
            <label className={styles.etiqueta} htmlFor="descripcion">
              Descripción *
            </label>

            <textarea
              id="descripcion"
              name="descripcion"
              className={styles.control}
              value={datos.descripcion}
              onChange={alCambiar}
              placeholder="Describe detalladamente la situación..."
              rows={5}
              disabled={enviando}
              required
            />
          </div>

          <div className={styles.campo}>
            <span className={styles.etiqueta}>
              Fotografía del reporte (opcional)
            </span>

            <label
              className={`${styles.zonaImagen} ${
                arrastrando ? styles.arrastrando : ""
              }`}
              onDragOver={alArrastrar}
              onDragLeave={() => setArrastrando(false)}
              onDrop={alSoltar}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className={styles.entradaImagen}
                onChange={alSeleccionarArchivo}
                disabled={enviando}
              />

              {vistaPrevia ? (
                <>
                  <img
                    src={vistaPrevia}
                    alt="Vista previa de la fotografía"
                    className={styles.vistaPrevia}
                  />

                  <p>{imagen?.name}</p>

                  <span>Haz clic para cambiar la imagen</span>
                </>
              ) : (
                <>
                  <span className={styles.iconoImagen}>+</span>

                  <strong>Arrastra tu imagen aquí</strong>

                  <span>O haz clic para seleccionar un archivo</span>

                  <small>JPG, PNG o WebP · Máximo 5 MB</small>
                </>
              )}
            </label>

            {imagen && (
              <button
                type="button"
                className={styles.botonQuitarImagen}
                onClick={() => setImagen(null)}
                disabled={enviando}
              >
                Quitar fotografía
              </button>
            )}
          </div>

          <div className={styles.acciones}>
            <button
              type="button"
              onClick={alLimpiar}
              className={styles["boton-secundario"]}
              disabled={enviando}
            >
              Limpiar
            </button>

            <button
              type="submit"
              className={styles["boton-primario"]}
              disabled={enviando || buscandoColonias}
            >
              {enviando ? "Enviando..." : "Enviar reporte"}
            </button>
          </div>
        </form>
      </main>

      <Footer />

      <BarraLateral
        estaAbierto={estaAbierto}
        alCerrar={() => setEstaAbierto(false)}
      />
    </>
  );
}
