import "./InformacionRuta.css";

function InformacionRuta({ ruta }) {
  return (
    <div className="contenedor-rutas">
      <div className="rutas">
        <h1>RUTA</h1>
        <p>{ruta}</p>
      </div>

      <button>Cambiar ruta</button>
    </div>
  );
}

export default InformacionRuta;
