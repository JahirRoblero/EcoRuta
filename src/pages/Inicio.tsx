import Barra from "../components/Inicio/Barra/Barra";
import ComponenteImagen from "../components/Inicio/ComponenteImagen/ComponenteImagen";
import BarraLateral from "../components/Inicio/BarraLateral/BarraLateral";
import Mapa from "../components/Inicio/Mapa/Mapa";
import InformacionRuta from "../components/Inicio/InformacionRuta/InformacionRuta";
import Footer from "../components/Inicio/Footer/Footer";
import QuejasRapidas from "../components/Inicio/QuejasRapidas/QuejasRapidas";

import { obtenerReportesAleatorios } from "../services/api";
import stylesInicio from "./Inicio.module.css";

import { useEffect, useState, useRef } from "react";

const posiciones = [
  { latitud: 17.0732, longitud: -96.7266 },
  { latitud: 17.0735, longitud: -96.7269 },
  { latitud: 17.0738, longitud: -96.7272 },
  { latitud: 17.0741, longitud: -96.7276 },
  { latitud: 17.0745, longitud: -96.728 },
  { latitud: 17.0749, longitud: -96.7285 },
  { latitud: 17.0753, longitud: -96.729 },
];

function obtenerUrlImagen(imagenUrl) {
  if (!imagenUrl) return null;

  if (/^https?:\/\//i.test(imagenUrl)) {
    return imagenUrl;
  }

  const base = import.meta.env.VITE_API_URL;
  const ruta = imagenUrl.startsWith("/") ? imagenUrl : `/${imagenUrl}`;

  return `${base}${ruta}`;
}

function Inicio() {
  const [estaAbierto, setEstaAbierto] = useState(false);
  const [indice, setIndice] = useState(0);

  const [reportes, setReportes] = useState([]);
  const [cargandoReportes, setCargandoReportes] = useState(true);
  const [errorReportes, setErrorReportes] = useState("");

  const carruselRef = useRef(null);

  const desplazarReportes = (direccion) => {
    if (!carruselRef.current) return;

    carruselRef.current.scrollBy({
      left: direccion * carruselRef.current.clientWidth * 0.8,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndice((indiceAnterior) => {
        if (indiceAnterior >= posiciones.length - 1) {
          return indiceAnterior;
        }

        return indiceAnterior + 1;
      });
    }, 2000);

    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    let activo = true;

    obtenerReportesAleatorios()
      .then((datos) => {
        if (activo) setReportes(datos);
      })
      .catch((error) => {
        if (activo) setErrorReportes(error.message);
      })
      .finally(() => {
        if (activo) setCargandoReportes(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  return (
    <div className={stylesInicio.pagina}>
      <Barra estaAbierto={estaAbierto} alCerrar={() => setEstaAbierto(true)} />

      <main className={stylesInicio["contenido"]}>
        <div className={stylesInicio["contenedor-componente-imagen"]}>
          <ComponenteImagen />
        </div>

        <InformacionRuta ruta={"CANDIANI"} />

        <div className={stylesInicio["contenedor-mapa"]}>
          <Mapa
            latitud={posiciones[indice].latitud}
            longitud={posiciones[indice].longitud}
          />
        </div>

        <section className={stylesInicio.seccionReportes}>
          <div className={stylesInicio.encabezadoReportes}>
            <h2>Reportes de la comunidad</h2>

            <div className={stylesInicio.controlesReportes}>
              <button
                type="button"
                onClick={() => desplazarReportes(-1)}
                aria-label="Ver reportes anteriores"
                disabled={reportes.length === 0}
              >
                ‹
              </button>

              <button
                type="button"
                onClick={() => desplazarReportes(1)}
                aria-label="Ver reportes siguientes"
                disabled={reportes.length === 0}
              >
                ›
              </button>
            </div>
          </div>

          {cargandoReportes && <p>Cargando reportes...</p>}

          {errorReportes && <p role="alert">{errorReportes}</p>}

          {!cargandoReportes && !errorReportes && reportes.length === 0 && (
            <p>No hay reportes disponibles.</p>
          )}

          <div
            ref={carruselRef}
            className={stylesInicio.listaReportes}
            aria-label="Reportes de la comunidad"
          >
            {reportes.map((reporte) => (
              <div
                key={reporte.idReporte}
                className={stylesInicio.tarjetaReporte}
              >
                <QuejasRapidas
                  tituloQueja={reporte.titulo}
                  descripcionQueja={reporte.descripcion}
                  imagenQueja={obtenerUrlImagen(reporte.imagenUrl)}
                />
              </div>
            ))}
          </div>
        </section>
      </main>

      {estaAbierto && (
        <div
          className={stylesInicio["fondo-oscuro"]}
          onClick={() => setEstaAbierto(false)}
        />
      )}

      <Footer />

      <BarraLateral
        estaAbierto={estaAbierto}
        alCerrar={() => setEstaAbierto(false)}
      />
    </div>
  );
}

export default Inicio;
