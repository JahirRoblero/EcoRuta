import stylesInformacionRuta from './InformacionRuta.module.css';

function InformacionRuta({nombreRuta, descripcionRuta, duracionRuta, imgRuta}) {
    return (
        <div className={stylesInformacionRuta.informacionRuta}>
            <h2 className={stylesInformacionRuta.tituloRuta}>{nombreRuta}</h2>
            <p>{descripcionRuta}</p>
            <p>Duración: {duracionRuta}</p>
            <img src={imgRuta} className={stylesInformacionRuta.imagenMapa}></img>
            <button className={stylesInformacionRuta.botonVerRuta}>Ver ruta</button>
        </div>
    );
}

export default InformacionRuta;