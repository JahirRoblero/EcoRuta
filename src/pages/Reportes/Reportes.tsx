import { use, useState } from "react";
import Barra from "../../components/Inicio/Barra/Barra";
import BarraLateral from "../../components/Inicio/BarraLateral/BarraLateral";
import Footer from "../../components/Inicio/Footer/Footer";

function Reportes() {
  const [estaAbierto, setEstaAbierto] = useState(false);
  const [reportes, setReportes] = useState([]);
  const [cargandoReportes, setCargandoReportes] = useState(true);
  const [errorReportes, setErrorReportes] = useState("");

  return (
    <>
      <Barra estaAbierto={estaAbierto} alCerrar={() => setEstaAbierto(true)} />

      <Footer></Footer>
      <main></main>
      <BarraLateral
        alCerrar={() => setEstaAbierto(false)}
        estaAbierto={estaAbierto}
      ></BarraLateral>
    </>
  );
}

export default Reportes;
