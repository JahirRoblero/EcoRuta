import stylesRutas from "./Rutas.module.css";
import Barra from "../../components/Inicio/Barra/Barra";
import BarraLateral from "../../components/Inicio/BarraLateral/BarraLateral";
import Footer from "../../components/Inicio/Footer/Footer";
import { useState } from "react";

function Rutas() {
  const [estaAbierto, setEstaAbierto] = useState(false);
  return (
    <div className={stylesRutas.pagina}>
      <Barra estaAbierto={estaAbierto} alCerrar={() => setEstaAbierto(true)} />

      <main className={stylesRutas["contenido"]}>
        <h1>Rutas</h1>
      </main>
      <Footer></Footer>
      <BarraLateral
        alCerrar={() => setEstaAbierto(false)}
        estaAbierto={estaAbierto}
      ></BarraLateral>
    </div>
  );
}

export default Rutas;
