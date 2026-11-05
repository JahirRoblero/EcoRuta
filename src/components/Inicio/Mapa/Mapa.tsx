import { useCallback, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import styles from "./Mapa.module.css";

interface MapaProps {
  geometria: string;
}

type Coordenada = [number, number];

function obtenerCoordenadas(geometria: string): Coordenada[] {
  const datos = JSON.parse(geometria);

  if (
    datos.type !== "LineString" ||
    !Array.isArray(datos.coordinates) ||
    datos.coordinates.length < 2
  ) {
    throw new Error("La geometría no es un LineString válido");
  }

  return datos.coordinates.map((punto: unknown) => {
    if (
      !Array.isArray(punto) ||
      punto.length < 2 ||
      typeof punto[0] !== "number" ||
      typeof punto[1] !== "number" ||
      !Number.isFinite(punto[0]) ||
      !Number.isFinite(punto[1]) ||
      Math.abs(punto[0]) > 180 ||
      Math.abs(punto[1]) > 90
    ) {
      throw new Error("La ruta contiene coordenadas inválidas");
    }

    return [punto[0], punto[1]] as Coordenada;
  });
}

function Mapa({ geometria }: MapaProps) {
  const mapaContenedor = useRef<HTMLDivElement | null>(null);
  const mapa = useRef<mapboxgl.Map | null>(null);
  const marcador = useRef<mapboxgl.Marker | null>(null);

  const geometriaActual = useRef(geometria);

  const dibujarRuta = useCallback(
    (instancia: mapboxgl.Map, geojson: string) => {
      try {
        const coordenadas = obtenerCoordenadas(geojson);

        const datosRuta = {
          type: "Feature" as const,
          properties: {},
          geometry: {
            type: "LineString" as const,
            coordinates: coordenadas,
          },
        };

        const fuente = instancia.getSource("ruta-ecorruta") as
          | mapboxgl.GeoJSONSource
          | undefined;

        if (fuente) {
          fuente.setData(datosRuta);
        } else {
          instancia.addSource("ruta-ecorruta", {
            type: "geojson",
            data: datosRuta,
          });

          instancia.addLayer({
            id: "linea-ruta-ecorruta",
            type: "line",
            source: "ruta-ecorruta",

            layout: {
              "line-join": "round",
              "line-cap": "round",
            },

            paint: {
              "line-color": "#9d2249",
              "line-width": 5,
              "line-opacity": 0.9,
            },
          });
        }

        const posicionInicial = coordenadas[0];

        if (!marcador.current) {
          marcador.current = new mapboxgl.Marker({
            color: "#9d2249",
          })
            .setLngLat(posicionInicial)
            .addTo(instancia);
        } else {
          marcador.current.setLngLat(posicionInicial);
        }

        const longitudes = coordenadas.map((punto) => punto[0]);
        const latitudes = coordenadas.map((punto) => punto[1]);

        const oeste = Math.min(...longitudes);
        const este = Math.max(...longitudes);
        const sur = Math.min(...latitudes);
        const norte = Math.max(...latitudes);

        console.log("Coordenadas de la ruta:", coordenadas);
        console.log("Límites del mapa:", {
          oeste,
          este,
          sur,
          norte,
        });

        instancia.fitBounds(
          [
            [oeste, sur],
            [este, norte],
          ],
          {
            padding: 60,
            maxZoom: 16,
            duration: 800,
          },
        );
      } catch (error) {
        console.error("Error al dibujar la ruta:", error);
      }
    },
    [],
  );

  useEffect(() => {
    if (!mapaContenedor.current) return;

    const instancia = new mapboxgl.Map({
      container: mapaContenedor.current,
      accessToken: import.meta.env.VITE_MAPBOX_TOKEN,
      style: "mapbox://styles/mapbox/standard",
      center: [-96.72, 17.05],
      zoom: 12,
    });

    mapa.current = instancia;

    instancia.on("load", () => {
      dibujarRuta(instancia, geometriaActual.current);
    });

    return () => {
      marcador.current?.remove();
      marcador.current = null;

      instancia.remove();
      mapa.current = null;
    };
  }, [dibujarRuta]);

  useEffect(() => {
    geometriaActual.current = geometria;

    const instancia = mapa.current;

    if (instancia?.isStyleLoaded()) {
      dibujarRuta(instancia, geometria);
    }
  }, [geometria, dibujarRuta]);

  return <div ref={mapaContenedor} className={styles.mapa} />;
}

export default Mapa;
