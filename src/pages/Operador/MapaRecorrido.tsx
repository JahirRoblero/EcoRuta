import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import styles from "./PanelOperador.module.css";

/** [longitud, latitud], el orden que usa Mapbox. */
export type Coordenada = [number, number];

interface MapaRecorridoProps {
  /** Trazo planeado de la ruta (GeoJSON LineString guardado en la tabla ruta). */
  geometria: string | null;
  /** Posiciones reales registradas en ubicacion_unidad, en orden. */
  recorrido: Coordenada[];
  /** Posición actual del dispositivo del operador (o la última registrada). */
  posicionActual: Coordenada | null;
  /** Centrar el mapa en la unidad cada vez que se mueve. */
  seguir: boolean;
  /** Mostrar "Recorrido real (GPS)" en la leyenda (no aplica en la vista ciudadana). */
  mostrarRecorrido?: boolean;
}

interface Datos {
  planeada: Coordenada[];
  recorrido: Coordenada[];
  posicionActual: Coordenada | null;
  seguir: boolean;
}

const CENTRO_OAXACA: Coordenada = [-96.7266, 17.0732];

function trazoPlaneado(geometria: string | null): Coordenada[] {
  if (!geometria) return [];

  try {
    const datos = JSON.parse(geometria);

    if (datos?.type !== "LineString" || !Array.isArray(datos.coordinates)) {
      return [];
    }

    return datos.coordinates
      .filter(
        (p: unknown): p is number[] =>
          Array.isArray(p) &&
          Number.isFinite(p[0]) &&
          Number.isFinite(p[1]) &&
          Math.abs(p[0]) <= 180 &&
          Math.abs(p[1]) <= 90,
      )
      .map((p: number[]) => [p[0], p[1]] as Coordenada);
  } catch {
    return [];
  }
}

function linea(coordenadas: Coordenada[]) {
  return {
    type: "Feature" as const,
    properties: {},
    geometry: { type: "LineString" as const, coordinates: coordenadas },
  };
}

function crearMarcadorUnidad(): HTMLElement {
  const elemento = document.createElement("div");
  elemento.className = styles.marcadorUnidad;
  elemento.title = "Ubicación de la unidad";
  elemento.textContent = "🚛";
  return elemento;
}

/**
 * Mapa del panel del operador: muestra la ruta planeada (línea gris punteada),
 * el recorrido real registrado por GPS (línea guinda) y la unidad (camión).
 */
function MapaRecorrido({
  geometria,
  recorrido,
  posicionActual,
  seguir,
  mostrarRecorrido = true,
}: MapaRecorridoProps) {
  const contenedor = useRef<HTMLDivElement | null>(null);
  const mapa = useRef<mapboxgl.Map | null>(null);
  const marcador = useRef<mapboxgl.Marker | null>(null);
  const listo = useRef(false);
  const encuadrado = useRef(false);
  const datos = useRef<Datos>({
    planeada: [],
    recorrido: [],
    posicionActual: null,
    seguir: false,
  });

  const dibujar = () => {
    const instancia = mapa.current;
    if (!instancia || !listo.current) return;

    const { planeada, recorrido: puntos, posicionActual: actual, seguir: centrar } =
      datos.current;

    (instancia.getSource("ruta-planeada") as mapboxgl.GeoJSONSource).setData(
      linea(planeada),
    );
    (instancia.getSource("recorrido-real") as mapboxgl.GeoJSONSource).setData(
      linea(puntos),
    );

    if (actual) {
      if (!marcador.current) {
        marcador.current = new mapboxgl.Marker({ element: crearMarcadorUnidad() })
          .setLngLat(actual)
          .addTo(instancia);
      } else {
        marcador.current.setLngLat(actual);
      }
    } else if (marcador.current) {
      marcador.current.remove();
      marcador.current = null;
    }

    // La primera vez se encuadra todo lo que hay; después solo se sigue a la unidad
    if (!encuadrado.current) {
      const todos = [...planeada, ...puntos, ...(actual ? [actual] : [])];

      if (todos.length > 0) {
        const limites = new mapboxgl.LngLatBounds(todos[0], todos[0]);
        todos.forEach((punto) => limites.extend(punto));
        instancia.fitBounds(limites, { padding: 60, maxZoom: 16, duration: 0 });
        encuadrado.current = true;
      }
    } else if (centrar && actual) {
      instancia.easeTo({ center: actual, duration: 800 });
    }
  };

  // Crear el mapa una sola vez
  useEffect(() => {
    if (!contenedor.current) return;

    const instancia = new mapboxgl.Map({
      container: contenedor.current,
      accessToken: import.meta.env.VITE_MAPBOX_TOKEN,
      style: "mapbox://styles/mapbox/streets-v12",
      center: CENTRO_OAXACA,
      zoom: 13,
    });

    mapa.current = instancia;
    instancia.addControl(new mapboxgl.NavigationControl(), "top-right");

    instancia.on("load", () => {
      instancia.addSource("ruta-planeada", { type: "geojson", data: linea([]) });
      instancia.addLayer({
        id: "ruta-planeada",
        type: "line",
        source: "ruta-planeada",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#6b6b6b",
          "line-width": 4,
          "line-dasharray": [1.5, 1.5],
        },
      });

      instancia.addSource("recorrido-real", { type: "geojson", data: linea([]) });
      instancia.addLayer({
        id: "recorrido-real",
        type: "line",
        source: "recorrido-real",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#9d2449", "line-width": 5 },
      });

      listo.current = true;
      dibujar();
    });

    return () => {
      marcador.current?.remove();
      marcador.current = null;
      listo.current = false;
      encuadrado.current = false;
      instancia.remove();
      mapa.current = null;
    };
  }, []);

  // Redibujar cuando llegan posiciones nuevas
  useEffect(() => {
    datos.current = {
      planeada: trazoPlaneado(geometria),
      recorrido,
      posicionActual,
      seguir,
    };
    dibujar();
  }, [geometria, recorrido, posicionActual, seguir]);

  return (
    <div className={styles.contenedorMapa}>
      <div ref={contenedor} className={styles.mapa} />

      <ul className={styles.leyenda}>
        <li>
          <span className={styles.leyendaPlaneada} /> Ruta planeada
        </li>
        {mostrarRecorrido && (
          <li>
            <span className={styles.leyendaReal} /> Recorrido real (GPS)
          </li>
        )}
        <li>
          <span aria-hidden="true">🚛</span> Unidad
        </li>
      </ul>
    </div>
  );
}

export default MapaRecorrido;
