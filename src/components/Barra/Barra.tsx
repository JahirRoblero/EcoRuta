import "./Barra.css";
import logoOaxaca from "../../assets/img/logoOaxacaOficial.png";
import imagenBarra from "../../assets/img/menu.svg";
function Barra() {
  return (
    <nav className="barraContenedor">
      <div className="contenedor-izquierdo">
        <img className="logoOaxaca" src={logoOaxaca}></img>

        <div className="titulo">
          <h1>Ecorruta</h1>
          <p>GOBIERNO DEL ESTADO</p>
        </div>
      </div>

      <button className="boton-imagen">
        <img className="imagenBarra" src={imagenBarra}></img>
      </button>
    </nav>
  );
}

export default Barra;
