import { use, useEffect, useState } from "react";
import Barra from "../../components/Inicio/Barra/Barra";
import BarraLateral from "../../components/Inicio/BarraLateral/BarraLateral";
import Footer from "../../components/Inicio/Footer/Footer";
import { obtenerReportesCompletos } from "../../services/api";
import styles from "../Reportes/Reportes.module.css";
import QuejasRapidas from "../../components/Inicio/QuejasRapidas/QuejasRapidas";
import { obtenerUrlImagen } from "../../services/api";

function Reportes() {
  const [estaAbierto, setEstaAbierto] = useState(false);
  const [reportes, setReportes] = useState([]);
  const [cargandoReportes, setCargandoReportes] = useState(true);
  const [errorReportes, setErrorReportes] = useState("");

  useEffect(() => {
    let activo = true;
    obtenerReportesCompletos()
      .then((datos) => {
        if (activo) setReportes(datos);
      })
      .catch((error) => {
        if (activo) setErrorReportes(error);
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
                codigoPostal={reporte.coloniaCodigoPostals}
              ></QuejasRapidas>
            </div>
          ))}
        </div>
      </main>
      <Footer></Footer>
      <BarraLateral
        alCerrar={() => setEstaAbierto(false)}
        estaAbierto={estaAbierto}
      ></BarraLateral>
    </div>
  );
}

export default Reportes;
