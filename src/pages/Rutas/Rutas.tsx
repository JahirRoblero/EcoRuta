import { useEffect, useState } from "react";

import stylesRutas from "./Rutas.module.css";

import Barra from "../../components/Inicio/Barra/Barra";
import BarraLateral from "../../components/Inicio/BarraLateral/BarraLateral";
import Footer from "../../components/Inicio/Footer/Footer";

import InformacionRuta from "../../components/Rutas/InformacionRuta";
import Mapa from "../../components/Inicio/Mapa/Mapa";

import { obtenerRutasDisponibles, obtenerUrlImagen } from "../../services/api";

interface RutaCatalogo {
  nombre: string;
  descripcion: string | null;
  imagenUrl: string | null;
  geometria: string | null;
}

function Rutas() {
  const [estaAbierto, setEstaAbierto] = useState(false);

  const [rutas, setRutas] = useState<RutaCatalogo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [rutaSeleccionada, setRutaSeleccionada] = useState<RutaCatalogo | null>(
    null,
  );

  useEffect(() => {
    let activo = true;

    obtenerRutasDisponibles()
      .then((datos: RutaCatalogo[]) => {
        if (activo) {
          setRutas(datos);
        }
      })
      .catch((err: Error) => {
        if (activo) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (activo) {
          setCargando(false);
        }
      });

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!rutaSeleccionada) return;

    const alPresionarTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setRutaSeleccionada(null);
      }
    };

    window.addEventListener("keydown", alPresionarTecla);

    return () => {
      window.removeEventListener("keydown", alPresionarTecla);
    };
  }, [rutaSeleccionada]);

  return (
    <div className={stylesRutas.pagina}>
      <Barra estaAbierto={estaAbierto} alCerrar={() => setEstaAbierto(true)} />

      <main className={stylesRutas.contenido}>
        <h1 className={stylesRutas.titulo}>Rutas de recolección</h1>

        {cargando && <p>Cargando rutas disponibles...</p>}

        {error && <p role="alert">{error}</p>}

        {!cargando && !error && rutas.length === 0 && (
          <p>No hay rutas disponibles actualmente.</p>
        )}

        <section className={stylesRutas.listaRutas}>
          {rutas.map((ruta) => (
            <div key={ruta.nombre} className={stylesRutas.tarjeta}>
              <InformacionRuta
                nombreRuta={ruta.nombre}
                descripcionRuta={ruta.descripcion ?? "Sin descripción"}
                imgRuta={obtenerUrlImagen(ruta.imagenUrl) ?? ""}
                onVerRuta={() => {
                  if (ruta.geometria) {
                    setRutaSeleccionada(ruta);
                  }
                }}
                puedeVerRuta={Boolean(ruta.geometria)}
              />
            </div>
          ))}
        </section>
      </main>

      <Footer />

      <BarraLateral
        alCerrar={() => setEstaAbierto(false)}
        estaAbierto={estaAbierto}
      />

      {rutaSeleccionada && rutaSeleccionada.geometria && (
        <div
          className={stylesRutas.fondoModal}
          onClick={() => setRutaSeleccionada(null)}
        >
          <section
            className={stylesRutas.modal}
            role="dialog"
            aria-modal="true"
            aria-label={`Mapa de ${rutaSeleccionada.nombre}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={stylesRutas.cerrarModal}
              onClick={() => setRutaSeleccionada(null)}
              aria-label="Cerrar mapa"
            >
              ×
            </button>

            <h2>{rutaSeleccionada.nombre}</h2>

            <p>{rutaSeleccionada.descripcion}</p>

            <div className={stylesRutas.mapaModal}>
              <Mapa geometria={rutaSeleccionada.geometria} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default Rutas;
