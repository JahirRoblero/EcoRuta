import { useEffect, useState } from "react";

import Barra from "../../components/Inicio/Barra/Barra";
import BarraLateral from "../../components/Inicio/BarraLateral/BarraLateral";
import Footer from "../../components/Inicio/Footer/Footer";

import { obtenerDatosPrivados } from "../../services/api";
import styles from "./MiPerfil.module.css";

interface DatosPerfil {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  usuario: string;
  colonia: string | null;
  codigoPostal: string | null;
  fechaRegistro: string | null;
}

function MiPerfil() {
  const [estaAbierto, setEstaAbierto] = useState(false);

  const [perfil, setPerfil] = useState<DatosPerfil | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    obtenerDatosPrivados()
      .then((datos: DatosPerfil) => {
        if (activo) {
          setPerfil(datos);
        }
      })
      .catch((err: Error) => {
        if (activo) {
          setError(
            err.message || "No se pudieron cargar los datos del perfil.",
          );
        }
      })
      .finally(() => {
        if (activo) {
          setCargando(false);
        }
      });

    return () => {
      activo = false;
    };
  }, []);

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return "No disponible";

    const fechaConvertida = new Date(fecha);

    if (Number.isNaN(fechaConvertida.getTime())) {
      return "No disponible";
    }

    return fechaConvertida.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "America/Mexico_City",
    });
  };

  const nombreCompleto = perfil
    ? [perfil.nombre, perfil.apellidoPaterno, perfil.apellidoMaterno]
        .filter(Boolean)
        .join(" ")
    : "";

  const iniciales = perfil
    ? `${perfil.nombre.charAt(0)}${perfil.apellidoPaterno.charAt(0)}`.toUpperCase()
    : "U";

  return (
    <div className={styles.pagina}>
      <Barra estaAbierto={estaAbierto} alCerrar={() => setEstaAbierto(true)} />

      {estaAbierto && (
        <div
          className={styles.fondoOscuro}
          onClick={() => setEstaAbierto(false)}
        />
      )}

      <main className={styles.contenedor}>
        <h1 className={styles.titulo}>Mi perfil</h1>

        <p className={styles.subtitulo}>
          Tus datos privados registrados en Ecorruta
        </p>

        {cargando && (
          <div className={styles.estado} role="status">
            Cargando información de tu perfil...
          </div>
        )}

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        {!cargando && !error && perfil && (
          <section className={styles.tarjeta}>
            <div className={styles.cabeceraTarjeta}>
              <div className={styles.informacionPrincipal}>
                <h2 className={styles.nombre}>{nombreCompleto}</h2>
                <p className={styles.correo}>{perfil.usuario}</p>
              </div>
            </div>

            <div className={styles.separador}></div>

            <h3 className={styles.tituloSeccion}>Información personal</h3>

            <div className={styles.cuadricula}>
              <div className={styles.campo}>
                <span className={styles.etiqueta}>Nombre</span>
                <span className={styles.valor}>{perfil.nombre}</span>
              </div>

              <div className={styles.campo}>
                <span className={styles.etiqueta}>Apellido paterno</span>
                <span className={styles.valor}>{perfil.apellidoPaterno}</span>
              </div>

              <div className={styles.campo}>
                <span className={styles.etiqueta}>Apellido materno</span>
                <span className={styles.valor}>
                  {perfil.apellidoMaterno || "No registrado"}
                </span>
              </div>

              <div className={styles.campo}>
                <span className={styles.etiqueta}>Correo electrónico</span>
                <span className={styles.valor}>{perfil.usuario}</span>
              </div>
            </div>

            <h3 className={styles.tituloSeccion}>Información de domicilio</h3>

            <div className={styles.cuadricula}>
              <div className={styles.campo}>
                <span className={styles.etiqueta}>Colonia</span>
                <span className={styles.valor}>
                  {perfil.colonia || "No registrada"}
                </span>
              </div>

              <div className={styles.campo}>
                <span className={styles.etiqueta}>Código postal</span>
                <span className={styles.valor}>
                  {perfil.codigoPostal || "No registrado"}
                </span>
              </div>
            </div>

            <h3 className={styles.tituloSeccion}>Información de la cuenta</h3>

            <div className={styles.cuadricula}>
              <div className={styles.campo}>
                <span className={styles.etiqueta}>Fecha de registro</span>
                <span className={styles.valor}>
                  {formatearFecha(perfil.fechaRegistro)}
                </span>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />

      <BarraLateral
        estaAbierto={estaAbierto}
        alCerrar={() => setEstaAbierto(false)}
      />
    </div>
  );
}

export default MiPerfil;
