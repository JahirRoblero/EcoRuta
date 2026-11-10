import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import BarraLateral from "../../components/Inicio/BarraLateral/BarraLateral";
import Barra from "../../components/Inicio/Barra/Barra";
import { obtenerPuntosAcopio } from "../../services/api";
import styles from "./PuntosBasura.module.css";
import Footer from "../../components/Inicio/Footer/Footer";

type PuntoAcopio = {
  coloniaNombre: string;
  coloniaCodigoPostal: string;
  nombre: string;
  direccion: string | null;
  latitud: number;
  longitud: number;
  tiposResiduos: string[];
};

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function PuntosBasura() {
  const [estaAbierto, setEstaAbierto] = useState(false);
  const [puntos, setPuntos] = useState<PuntoAcopio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const mapaContenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function cargarPuntos() {
      try {
        const datos: PuntoAcopio[] = await obtenerPuntosAcopio({
          signal: controller.signal,
        });

        if (!Array.isArray(datos)) {
          throw new Error("La API no devolvió una lista");
        }

        const puntosValidos = datos
          .filter((punto) => punto.latitud != null && punto.longitud != null)
          .map((punto) => ({
            ...punto,
            latitud: Number(punto.latitud),
            longitud: Number(punto.longitud),
          }))
          .filter(
            (punto) =>
              Number.isFinite(punto.latitud) &&
              Number.isFinite(punto.longitud) &&
              Math.abs(punto.latitud) <= 90 &&
              Math.abs(punto.longitud) <= 180,
          );

        setPuntos(puntosValidos);
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error ? err.message : "Error al cargar los puntos",
        );
      } finally {
        if (!controller.signal.aborted) {
          setCargando(false);
        }
      }
    }

    cargarPuntos();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!mapaContenedor.current || !mapboxgl.accessToken) {
      return;
    }

    const instancia = new mapboxgl.Map({
      container: mapaContenedor.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-96.7266, 17.0732],
      zoom: 12,
    });

    mapa.current = instancia;

    instancia.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      instancia.remove();
      mapa.current = null;
    };
  }, []);

  useEffect(() => {
    const mapaActual = mapa.current;
    if (!mapaActual) return;

    const marcadores: mapboxgl.Marker[] = [];
    const limites = new mapboxgl.LngLatBounds();

    puntos.forEach((punto) => {
      const contenido = document.createElement("div");

      const titulo = document.createElement("h3");
      titulo.textContent = punto.nombre;
      contenido.appendChild(titulo);

      const colonia = document.createElement("p");
      colonia.textContent = `Colonia: ${punto.coloniaNombre}`;
      contenido.appendChild(colonia);

      if (punto.direccion) {
        const direccion = document.createElement("p");
        direccion.textContent = `Dirección: ${punto.direccion}`;
        contenido.appendChild(direccion);
      }

      const residuos = document.createElement("p");
      residuos.textContent =
        "Residuos: " +
        (punto.tiposResiduos?.length
          ? punto.tiposResiduos.join(", ")
          : "Sin información");
      contenido.appendChild(residuos);

      const enlace = document.createElement("a");
      enlace.href =
        "https://www.google.com/maps/search/?api=1&query=" +
        `${punto.latitud},${punto.longitud}`;
      enlace.target = "_blank";
      enlace.rel = "noopener noreferrer";
      enlace.textContent = "Cómo llegar";

      contenido.appendChild(enlace);

      const marcador = new mapboxgl.Marker({
        color: "#9d2449",
      })
        .setLngLat([punto.longitud, punto.latitud])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setDOMContent(contenido))
        .addTo(mapaActual);

      marcadores.push(marcador);
      limites.extend([punto.longitud, punto.latitud]);
    });

    if (puntos.length > 0) {
      mapaActual.fitBounds(limites, {
        padding: 60,
        maxZoom: 15,
        duration: 800,
      });
    }

    return () => {
      marcadores.forEach((marcador) => marcador.remove());
    };
  }, [puntos]);

  return (
    <main>
      <Barra estaAbierto={estaAbierto} alCerrar={() => setEstaAbierto(true)} />

      <BarraLateral
        estaAbierto={estaAbierto}
        alCerrar={() => setEstaAbierto(false)}
      />

      <section className={styles.contenedor}>
        <h1>Puntos de acopio</h1>

        <p>
          Consulta los lugares disponibles para depositar residuos en Oaxaca de
          Juárez.
        </p>

        <div className={styles.resumen}>
          <strong>{puntos.length}</strong>
          <span>puntos de acopio disponibles</span>
        </div>

        {cargando && <p>Cargando puntos de acopio...</p>}

        {error && <p className={styles.error}>{error}</p>}

        {!mapboxgl.accessToken && (
          <p className={styles.error}>Falta configurar el token de Mapbox.</p>
        )}

        {!cargando && !error && puntos.length === 0 && (
          <p>No hay puntos de acopio registrados.</p>
        )}

        <div ref={mapaContenedor} className={styles.mapa} />
      </section>

      <Footer></Footer>
    </main>
  );
}

export default PuntosBasura;
