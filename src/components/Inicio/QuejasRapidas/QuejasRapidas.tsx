import stylesQuejas from "./QuejasRapidas.module.css";

function QuejasRapidas({ tituloQueja, descripcionQueja, imagenQueja }) {
  return (
    <div className={stylesQuejas["contenedor"]}>
      <div className={stylesQuejas["contenedor-reportes"]}>
        <h3>{tituloQueja}</h3>

        <p className={stylesQuejas.descripcion}>{descripcionQueja}</p>

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
