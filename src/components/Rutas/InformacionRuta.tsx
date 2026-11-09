import stylesInformacionRuta from "./InformacionRuta.module.css";

function InformacionRuta({
  nombreRuta,
  descripcionRuta,
  imgRuta,
  onVerRuta,
  puedeVerRuta = true,
}) {
  return (
    <div className={stylesInformacionRuta.informacionRuta}>
      <h2 className={stylesInformacionRuta.tituloRuta}>{nombreRuta}</h2>

      <p>{descripcionRuta}</p>

      {imgRuta ? (
        <img
          src={imgRuta}
          className={stylesInformacionRuta.imagenMapa}
          alt={`Vista previa de ${nombreRuta}`}
          loading="lazy"
        />
      ) : (
        <p>Imagen no disponible</p>
      )}

      <button
        type="button"
        className={stylesInformacionRuta.botonVerRuta}
        onClick={onVerRuta}
        disabled={!puedeVerRuta}
      >
        Ver ruta
      </button>
    </div>
  );
}

export default InformacionRuta;
