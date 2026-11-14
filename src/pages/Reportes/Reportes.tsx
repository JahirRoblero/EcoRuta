import { useEffect, useState } from "react";
import Barra from "../../components/Inicio/Barra/Barra";
import BarraLateral from "../../components/Inicio/BarraLateral/BarraLateral";
import Footer from "../../components/Inicio/Footer/Footer";
import { obtenerReportesCompletos } from "../../services/api";
import styles from "../Reportes/Reportes.module.css";
import QuejasRapidas from "../../components/Inicio/QuejasRapidas/QuejasRapidas";
import { obtenerUrlImagen } from "../../services/api";

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

function Reportes() {
  const [estaAbierto, setEstaAbierto] = useState(false);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [cargandoReportes, setCargandoReportes] = useState(true);
  const [errorReportes, setErrorReportes] = useState("");

  useEffect(() => {
    let activo = true;
    obtenerReportesCompletos()
      .then((datos: Reporte[]) => {
        if (activo) setReportes(datos);
      })
      .catch((error: unknown) => {
        // Se guarda el texto: un objeto Error no se puede mostrar en pantalla
        if (activo) {
          setErrorReportes(
            error instanceof Error
              ? error.message
              : "No se pudieron cargar los reportes.",
          );
        }
      })
      .finally(() => {
        if (activo) setCargandoReportes(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  return (
    <div className={styles.principal}>
      <Barra estaAbierto={estaAbierto} alCerrar={() => setEstaAbierto(true)} />

      <div className={styles.tituloReportes}>
        <h1>Reportes de vecinos</h1>
      </div>

      <main className={styles.contenido}>
        {cargandoReportes && <p>Cargando reportes...</p>}
        {errorReportes && <p role="alert">{errorReportes}</p>}
        {!cargandoReportes && !errorReportes && reportes.length === 0 && (
          <p>No hay reportes disponibles.</p>
        )}

        <div className={styles.contenedorReportes}>
          {reportes.map((reporte) => (
            <div key={reporte.idReporte} className={styles.tarjetaReporte}>
              <QuejasRapidas
                tituloQueja={reporte.titulo}
                descripcionQueja={reporte.descripcion}
                imagenQueja={obtenerUrlImagen(reporte.imagenUrl)}
                nombre={reporte.nombre}
                colonia={reporte.coloniaNombre}
                codigoPostal={reporte.coloniaCodigoPostal}
              ></QuejasRapidas>
            </div>
          ))}
        </div>
      </main>
      {estaAbierto && (
        <div
          className={styles.fondoOscuro}
          onClick={() => setEstaAbierto(false)}
        ></div>
      )}
      <Footer></Footer>

      <BarraLateral
        alCerrar={() => setEstaAbierto(false)}
        estaAbierto={estaAbierto}
      ></BarraLateral>
    </div>
  );
}

export default Reportes;
