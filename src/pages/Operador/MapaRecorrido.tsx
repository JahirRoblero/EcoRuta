
import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import styles from "./PanelOperador.module.css";

export type Coordenada = [number, number];

interface MapaRecorridoProps {
  geometria: string | null;
  recorrido: Coordenada[];
  posicionActual: Coordenada | null;
  seguir: boolean;
  mostrarRecorrido?: boolean;
}

interface Datos {
  planeada: Coordenada[];
  recorrido: Coordenada[];
  posicionActual: Coordenada | null;
  seguir: boolean;
  mostrarRecorrido: boolean;
}

const CENTRO_OAXACA: Coordenada = [-96.7266, 17.0732];

function trazoPlaneado(geometria: string | null): Coordenada[] {
  if (!geometria) return [];

  try {
    const datos = JSON.parse(geometria);

    if (
      !["LineString", "MultiPoint"].includes(datos?.type) ||
      !Array.isArray(datos.coordinates)
    ) {
      return [];
    }

    return datos.coordinates
      .filter(
        (p: unknown): p is number[] =>
          Array.isArray(p) &&
          p.length >= 2 &&
          Number.isFinite(p[0]) &&
          Number.isFinite(p[1]) &&
          Math.abs(p[0]) <= 180 &&
          Math.abs(p[1]) <= 90,
      )
      .map((p: number[]) => [p[0], p[1]] as Coordenada);
  } catch (error) {
    console.error("Error al interpretar la ruta planeada:", error);
    return [];
  }
}

// Convertir el recorrido real a GeoJSON LineString
function linea(coordenadas: Coordenada[]) {
  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates: coordenadas,
    },
  };
}

// Crear marcador personalizado del camión
function crearMarcadorUnidad(): HTMLElement {
  const elemento = document.createElement("div");
  elemento.className = styles.marcadorUnidad;
  elemento.title = "Ubicación de la unidad";
  elemento.textContent = "🚛";
  return elemento;
}

function MapaRecorrido({
  geometria,
  recorrido,
  posicionActual,
  seguir,
  mostrarRecorrido = true,
}: MapaRecorridoProps) {
  const contenedor = useRef<HTMLDivElement | null>(null);
  const mapa = useRef<mapboxgl.Map | null>(null);

  // Marcador de la ubicación actual del camión
  const marcador = useRef<mapboxgl.Marker | null>(null);

  // Marcadores de los puntos de la ruta planeada
  const marcadoresPlaneados = useRef<mapboxgl.Marker[]>([]);

  // Última geometría planeada que se dibujó
  const geometriaPlaneadaDibujada = useRef<Coordenada[] | null>(
    null
  );

  const listo = useRef(false);
  const encuadrado = useRef(false);

  // Evitar recalcular la ruta planeada en cada actualización GPS
  const puntosPlaneados = useMemo(
    () => trazoPlaneado(geometria),
    [geometria]
  );

  const datos = useRef<Datos>({
    planeada: [],
    recorrido: [],
    posicionActual: null,
    seguir: false,
    mostrarRecorrido: true,
  });

  // Dibujar los pines de la ruta planeada
  const dibujarPuntosPlaneados = (
    instancia: mapboxgl.Map,
    coordenadas: Coordenada[]
  ) => {
    // Eliminar los marcadores anteriores
    marcadoresPlaneados.current.forEach((marcador) => {
      marcador.remove();
    });

    marcadoresPlaneados.current = [];

    // Crear un marcador por cada coordenada
    coordenadas.forEach((coordenada, indice) => {
      const nuevoMarcador = new mapboxgl.Marker({
        color: "#9d2449",
      })
        .setLngLat(coordenada)
        .setPopup(
          new mapboxgl.Popup({
            offset: 25,
          }).setText(`Punto de referencia ${indice + 1}`)
        )
        .addTo(instancia);

      marcadoresPlaneados.current.push(nuevoMarcador);
    });
  };

  // Actualizar los elementos del mapa
  const dibujar = () => {
    const instancia = mapa.current;

    if (!instancia || !listo.current) return;

    const {
      planeada,
      recorrido: puntosReales,
      posicionActual: actual,
      seguir: centrar,
      mostrarRecorrido: visible,
    } = datos.current;

    // Dibujar pines únicamente cuando cambia la ruta planeada
    if (geometriaPlaneadaDibujada.current !== planeada) {
      dibujarPuntosPlaneados(instancia, planeada);
      geometriaPlaneadaDibujada.current = planeada;

      // Permitir reencuadrar cuando se recibe otra ruta
      encuadrado.current = false;
    }

    // Actualizar el recorrido real como LineString
    const fuenteReal = instancia.getSource(
      "recorrido-real"
    ) as mapboxgl.GeoJSONSource | undefined;

    fuenteReal?.setData(linea(puntosReales));

    // Mostrar u ocultar el recorrido GPS
    if (instancia.getLayer("recorrido-real")) {
      instancia.setLayoutProperty(
        "recorrido-real",
        "visibility",
        visible ? "visible" : "none"
      );
    }

    // Actualizar la ubicación actual del camión
    if (actual) {
      if (!marcador.current) {
        marcador.current = new mapboxgl.Marker({
          element: crearMarcadorUnidad(),
        })
          .setLngLat(actual)
          .addTo(instancia);
      } else {
        marcador.current.setLngLat(actual);
      }
    } else if (marcador.current) {
      marcador.current.remove();
      marcador.current = null;
    }

    // Encuadrar la ruta completa inicialmente
    if (!encuadrado.current) {
      const todos = [
        ...planeada,
        ...(visible ? puntosReales : []),
        ...(actual ? [actual] : []),
      ];

      if (todos.length > 0) {
        const limites = new mapboxgl.LngLatBounds(
          todos[0],
          todos[0]
        );

        todos.forEach((punto) => {
          limites.extend(punto);
        });

        instancia.fitBounds(limites, {
          padding: 60,
          maxZoom: 16,
          duration: 0,
        });

        encuadrado.current = true;
      }
    } else if (centrar && actual) {
      // Seguir automáticamente al camión
      instancia.easeTo({
        center: actual,
        duration: 800,
      });
    }
  };

  // Inicializar Mapbox
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

    instancia.addControl(
      new mapboxgl.NavigationControl(),
      "top-right"
    );

    instancia.on("load", () => {
      // Fuente del recorrido GPS
      instancia.addSource("recorrido-real", {
        type: "geojson",
        data: linea([]),
      });

      // Capa de línea continua del recorrido real
      instancia.addLayer({
        id: "recorrido-real",
        type: "line",
        source: "recorrido-real",
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#9d2449",
          "line-width": 5,
        },
      });

      listo.current = true;

      // Dibujar los datos disponibles
      dibujar();
    });

    return () => {
      // Eliminar marcadores de la ruta planeada
      marcadoresPlaneados.current.forEach((marcador) => {
        marcador.remove();
      });

      marcadoresPlaneados.current = [];
      geometriaPlaneadaDibujada.current = null;

      // Eliminar marcador del camión
      marcador.current?.remove();
      marcador.current = null;

      listo.current = false;
      encuadrado.current = false;

      instancia.remove();
      mapa.current = null;
    };
  }, []);

  // Actualizar cuando llegan nuevas coordenadas GPS
  useEffect(() => {
    datos.current = {
      planeada: puntosPlaneados,
      recorrido,
      posicionActual,
      seguir,
      mostrarRecorrido,
    };

    dibujar();
  }, [
    puntosPlaneados,
    recorrido,
    posicionActual,
    seguir,
    mostrarRecorrido,
  ]);

  return (
    <div className={styles.contenedorMapa}>
      <div ref={contenedor} className={styles.mapa} />

      <ul className={styles.leyenda}>
        <li>
          <span className={styles.leyendaPlaneada} />
          Ruta planeada (puntos)
        </li>

        {mostrarRecorrido && (
          <li>
            <span className={styles.leyendaReal} />
            Recorrido real (GPS)
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
