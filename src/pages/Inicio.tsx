import Barra from "../components/Inicio/Barra/Barra";
import ComponenteImagen from "../components/Inicio/ComponenteImagen/ComponenteImagen";
import BarraLateral from "../components/Inicio/BarraLateral/BarraLateral";
import Mapa from "../components/Inicio/Mapa/Mapa";
import InformacionRuta from "../components/Inicio/InformacionRuta/InformacionRuta";
import Footer from "../components/Inicio/Footer/Footer";
import QuejasRapidas from "../components/Inicio/QuejasRapidas/QuejasRapidas";
import menorque from "../assets/img/menorque.svg";
import mayorque from "../assets/img/mayorque.svg";
import { obtenerReportesRecientes } from "../services/api";
import stylesInicio from "./Inicio.module.css";
import { obtenerMiRuta } from "../services/api";
import { obtenerUrlImagen } from "../services/api";
import { useEffect, useState, useRef } from "react";

interface Reporte {
  idReporte: number;
  titulo: string;
  descripcion: string;
  imagenUrl: string | null;
  estado: string;
  nombre: string;
  coloniaNombre: string;
  coloniaCodigoPostal: string;
}

interface RutaInicio {
  nombre: string;
  descripcion: string | null;
  geometria: string;
  deMiColonia: boolean;
}

function Inicio() {
  const [estaAbierto, setEstaAbierto] = useState(false);

  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [cargandoReportes, setCargandoReportes] = useState(true);
  const [errorReportes, setErrorReportes] = useState("");

  interface RutaInicio {
    nombre: string;
    descripcion: string | null;
    geometria: string;
    deMiColonia: boolean;
  }

  const [rutaActual, setRutaActual] = useState<RutaInicio | null>(null);
  const [cargandoRuta, setCargandoRuta] = useState(true);
  const [errorRuta, setErrorRuta] = useState("");

  const carruselRef = useRef<HTMLDivElement | null>(null);

  const desplazarReportes = (direccion: number) => {
    if (!carruselRef.current) return;

    carruselRef.current.scrollBy({
      left: direccion * carruselRef.current.clientWidth * 0.8,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    let activo = true;
    setCargandoReportes(true);

    obtenerReportesRecientes()
      .then((datos: Reporte[]) => {
        if (activo) setReportes(datos);
        setCargandoReportes(false);
      })
      .catch((error: Error) => {
        if (activo) setErrorReportes(error.message);
      });

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    let activo = true;

    obtenerMiRuta()
      .then((datos: RutaInicio) => {
        if (activo) {
          setRutaActual(datos);
        }
      })
      .catch((error: Error) => {
        if (activo) {
          setErrorRuta(error.message);
        }
      })
      .finally(() => {
        if (activo) {
          setCargandoRuta(false);
        }
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

        <InformacionRuta ruta={rutaActual?.nombre ?? "SIN RUTA"} />
        {rutaActual && (
          <div className={stylesInicio.rutaAsignada}>
            <p>
              {rutaActual.deMiColonia
                ? "Ruta asignada a tu colonia"
                : "Mostrando una ruta alternativa disponible"}
            </p>
          </div>
        )}
        <div className={stylesInicio["contenedor-mapa"]}>
          {cargandoRuta && <p>Cargando ruta...</p>}

          {errorRuta && <p role="alert">{errorRuta}</p>}

          {!cargandoRuta && !errorRuta && rutaActual && (
            <Mapa geometria={rutaActual.geometria} />
          )}
        </div>

        <section className={stylesInicio.seccionReportes}>
          <div className={stylesInicio.encabezadoReportes}>
            <h2>Reportes recientes de los vecinos</h2>

            {reportes.length > 0 && (
              <div className={stylesInicio.controlesReportes}>
                <button
                  type="button"
                  onClick={() => desplazarReportes(-1)}
                  aria-label="Ver reportes anteriores"
                  disabled={reportes.length === 0}
                >
                  <img src={menorque} alt="Anterior" />
                </button>

                <button
                  type="button"
                  onClick={() => desplazarReportes(1)}
                  aria-label="Ver reportes siguientes"
                  disabled={reportes.length === 0}
                >
                  <img src={mayorque} alt="Siguiente" />
                </button>
              </div>
            )}
            <button
              type="button"
              className={stylesInicio.realizarReporte}
              onClick={() => (window.location.href = "/crear-reportes")}
            >
              Realizar un reporte
            </button>
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
                  nombre={reporte.nombre}
                  colonia={reporte.coloniaNombre}
                  codigoPostal={reporte.coloniaCodigoPostal}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            className={stylesInicio.realizarReporte}
            onClick={() => (window.location.href = "/reportes")}
          >
            Ver todos los reportes
          </button>
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
