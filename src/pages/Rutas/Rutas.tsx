import stylesRutas from "./Rutas.module.css";
import Barra from "../../components/Inicio/Barra/Barra";
import BarraLateral from "../../components/Inicio/BarraLateral/BarraLateral";
import Footer from "../../components/Inicio/Footer/Footer";
import InformacionRuta from "../../components/Rutas/InformacionRuta";
import recoleccionBasura from "../../assets/img/recoleccion-candiani.png";
import { useState } from "react";

function Rutas() {
  const [estaAbierto, setEstaAbierto] = useState(false);
  return (
    <div className={stylesRutas.pagina}>
      <Barra estaAbierto={estaAbierto} alCerrar={() => setEstaAbierto(true)} />

      <main className={stylesRutas["contenido"]}>
        <InformacionRuta
          nombreRuta="Ruta 1 Candiani"
          descripcionRuta="Descripción de la ruta 1"
          duracionRuta="2 horas"
          imgRuta={recoleccionBasura}
        />
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
