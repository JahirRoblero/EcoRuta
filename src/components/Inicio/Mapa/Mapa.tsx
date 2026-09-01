import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./Mapa.css";

function Mapa({ latitud, longitud }) {
  const mapaContenedor = useRef(null);
  const mapa = useRef(null);
  const marcador = useRef(null);

  const recorrido = useRef([]);

  useEffect(() => {
    if (mapa.current) return;

    mapa.current = new mapboxgl.Map({
      container: mapaContenedor.current,
      accessToken: import.meta.env.VITE_MAPBOX_TOKEN,
      style: "mapbox://styles/mapbox/standard",
      center: [longitud, latitud],
      zoom: 15,
    });

    marcador.current = new mapboxgl.Marker()
      .setLngLat([longitud, latitud])
      .addTo(mapa.current);

    mapa.current.on("load", () => {
      recorrido.current.push([longitud, latitud]);

      mapa.current.addSource("recorrido", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: recorrido.current,
          },
        },
      });

      mapa.current.addLayer({
        id: "recorrido",
        type: "line",
        source: "recorrido",

        layout: {
          "line-join": "round",
          "line-cap": "round",
        },

        paint: {
          "line-color": "#000000",
          "line-width": 4,
        },
      });
    });

    return () => {
      mapa.current?.remove();
      mapa.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapa.current || !marcador.current) return;

    const nuevaPosicion = [longitud, latitud];

    recorrido.current.push(nuevaPosicion);

    marcador.current.setLngLat(nuevaPosicion);

    mapa.current.easeTo({
      center: nuevaPosicion,
      duration: 1000,
    });

    const source = mapa.current.getSource("recorrido");

    if (source) {
      source.setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: recorrido.current,
        },
      });
    }
  }, [latitud, longitud]);

  return <div ref={mapaContenedor} className="mapa"></div>;
}

export default Mapa;
