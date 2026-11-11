import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import styles from "./Login.module.css";
import { iniciarSesion } from "../../services/api";
import logoEcorrutaBlanco from "../../assets/img/LogoEcorrutaCirculo.png";
import logoEcorruta from "../../assets/img/LogoEcorrutaBlanco.png";
import logoEcorruta2 from "../../assets/img/LogoEcorruta.png";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const { guardarSesion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mostrarAcercaDe, setMostrarAcercaDe] = useState(false);

  const manejarLogin = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const datos = await iniciarSesion(correo, contrasena);

      guardarSesion(datos.token);

      const destino = location.state?.from?.pathname || "/";

      navigate(destino, { replace: true });
    } catch (error) {
      setError(error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <nav className={styles.barraContenedor}>
        <div className={styles["contenedor-izquierdo"]}>
          <img className={styles.logoOaxaca} src={logoEcorruta}></img>

          <div className="titulo">
            <h1>Ecorruta</h1>
            <p>POR UNA COLONIA MAS LIMPIA</p>
          </div>
        </div>
      </nav>
      <main className={styles["pagina-login"]}>
        <div className={styles.divisioniIzquierda}>
          <img
            className={styles.logisimo}
            src={logoEcorrutaBlanco}
            alt="Oaxaca Limpia"
          ></img>
          <h1 className={styles.titulo}>Ingresa con tu e‑mail</h1>

          <form className={styles.formulario} onSubmit={manejarLogin}>
            <div>
              <label htmlFor="correo">Correo electrónico: </label>
              <input
                id="correo"
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="contrasena">Contraseña: </label>
              <input
                id="contrasena"
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                required
              />
            </div>
            {error && <p role="alert">{error}</p>}
            <button
              className={styles.botonIniciarSesion}
              type="submit"
              disabled={cargando}
            >
              {cargando ? "Ingresando..." : "Iniciar sesión"}
            </button>

            <button
              className={styles.botonRegistro}
              onClick={() => navigate("/registro")}
              type="button"
            >
              Registrate
            </button>
          </form>

          <div>
            <button
              type="button"
              className={styles.acercaDe}
              onClick={() => setMostrarAcercaDe(true)}
            >
              Acerca de Ecorruta
            </button>
          </div>
        </div>

        {mostrarAcercaDe && (
          <div
            className={styles.fondoModal}
            onClick={() => setMostrarAcercaDe(false)}
          >
            <div
              className={styles.modalAcerca}
              role="dialog"
              aria-modal="true"
              aria-labelledby="tituloAcercaEcorruta"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className={styles.cerrarModal}
                onClick={() => setMostrarAcercaDe(false)}
                aria-label="Cerrar"
              >
                ×
              </button>

              <h2 id="tituloAcercaEcorruta">¿Qué es Ecorruta?</h2>
              <div className={styles.contenedorLogo2}>
                <img src={logoEcorruta2} className={styles.logoEcorruta2}></img>
              </div>

              <p>
                <strong>Ecorruta</strong> es una plataforma digital diseñada
                para mejorar la gestión de residuos sólidos urbanos en Oaxaca de
                Juárez.
              </p>

              <p>
                Nuestro objetivo es facilitar el acceso a información sobre los
                servicios de recolección de basura, promover la participación
                ciudadana y contribuir al cuidado del medio ambiente.
              </p>

              <h3>¿Qué puedes hacer en Ecorruta?</h3>

              <ul>
                <li>Consultar las rutas de recolección de basura.</li>
                <li>Conocer los horarios y días de recolección.</li>
                <li>Localizar puntos de acopio de residuos.</li>
                <li>Reportar problemas relacionados con la basura.</li>
                <li>Consultar el estado de tus reportes.</li>
              </ul>

              <p>
                En Ecorruta creemos que una ciudad más limpia comienza con la
                participación de todos.
              </p>

              <button
                type="button"
                className={styles.botonEntendido}
                onClick={() => setMostrarAcercaDe(false)}
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        <div className={styles.divisionDerecha}>
          <img
            className={styles.oaxacaLimpia}
            src={logoEcorrutaBlanco}
            alt="Oaxaca Limpia"
          ></img>
        </div>
      </main>
    </>
  );
}
