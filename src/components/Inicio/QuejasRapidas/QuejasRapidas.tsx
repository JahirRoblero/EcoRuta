import stylesQuejas from "./QuejasRapidas.module.css";

function QuejasRapidas({
  tituloQueja,
  descripcionQueja,
  imagenQueja,
  nombre,
  colonia,
  codigoPostal,
}) {
  return (
    <div className={stylesQuejas["contenedor"]}>
      <div className={stylesQuejas["contenedor-reportes"]}>
        <h3>{tituloQueja}</h3>

        <p className={stylesQuejas.descripcion}>{descripcionQueja}</p>

        <p>Vecino: {nombre}</p>
        <p>Colonia: {colonia}</p>
        <p>Codigo Postal: {codigoPostal}</p>
        {imagenQueja && (
          <img
            className={stylesQuejas.imagen}
            src={imagenQueja}
            alt={`Imagen del reporte: ${tituloQueja}`}
            loading="lazy"
          />
        )}
      </div>
    </div>
  );
}

export default QuejasRapidas;
