import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  limpiarCorreo,
  validarCorreo,
  validarObligatorio,
} from "../../utils/validaciones";
import styles from "./Login.module.css";
import { iniciarSesion } from "../../services/api";
import logoEcorrutaBlanco from "../../assets/img/LogoEcorrutaCirculo.png";
import logoEcorruta from "../../assets/img/LogoEcorrutaBlanco.png";
import logoEcorruta2 from "../../assets/img/LogoEcorruta.png";
import { useAuth, obtenerRol } from "../../context/AuthContext";
import type { Rol } from "../../context/AuthContext";

function destinoPorRol(rol: Rol | null): string {
  if (rol === "admin") return "/admin";
  if (rol === "operador") return "/operador";
  return "/";
}

export default function Login() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const { guardarSesion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mostrarAcercaDe, setMostrarAcercaDe] = useState(false);
  const [errorCorreo, setErrorCorreo] = useState("");
  const [errorContrasena, setErrorContrasena] = useState("");

  const manejarLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const fallaCorreo = validarCorreo(correo);
    const fallaContrasena = validarObligatorio(contrasena, "La contraseña");

    setErrorCorreo(fallaCorreo);
    setErrorContrasena(fallaContrasena);

    if (fallaCorreo || fallaContrasena) {
      setError(
        !correo.trim() || !contrasena
          ? "Completa todos los campos obligatorios para iniciar sesión."
          : "Revisa el campo marcado en rojo.",
      );
      document.getElementById(fallaCorreo ? "correo" : "contrasena")?.focus();
      return;
    }

    setCargando(true);

    try {
      const datos = await iniciarSesion(correo.trim().toLowerCase(), contrasena);

      guardarSesion(datos.token);

      const rolToken = obtenerRol(datos.token);
      const destino =
        rolToken === "operador" || rolToken === "admin"
          ? destinoPorRol(rolToken)
          : location.state?.from?.pathname || "/";

      navigate(destino, { replace: true });
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "No se pudo iniciar sesión.",
      );
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

          <form
            className={styles.formulario}
            onSubmit={manejarLogin}
            noValidate
          >
            <div>
              <label htmlFor="correo">
                Correo electrónico
                <span className={styles.obligatorio} aria-hidden="true">
                  {" "}
                  *
                </span>
              </label>
              <input
                id="correo"
                type="email"
                autoComplete="email"
                placeholder="nombre@dominio.com"
                maxLength={254}
                value={correo}
                className={errorCorreo ? styles.campoConError : undefined}
                aria-invalid={Boolean(errorCorreo)}
                aria-describedby={errorCorreo ? "correo-error" : undefined}
                onChange={(e) => {
                  setCorreo(limpiarCorreo(e.target.value));
                  setErrorCorreo("");
                }}
                onBlur={() => correo && setErrorCorreo(validarCorreo(correo))}
                required
              />
              {errorCorreo && (
                <small id="correo-error" className={styles.errorCampo}>
                  {errorCorreo}
                </small>
              )}
            </div>
            <div>
              <label htmlFor="contrasena">
                Contraseña
                <span className={styles.obligatorio} aria-hidden="true">
                  {" "}
                  *
                </span>
              </label>
              <input
                id="contrasena"
                type="password"
                autoComplete="current-password"
                value={contrasena}
                className={errorContrasena ? styles.campoConError : undefined}
                aria-invalid={Boolean(errorContrasena)}
                aria-describedby={
                  errorContrasena ? "contrasena-error" : undefined
                }
                onChange={(e) => {
                  setContrasena(e.target.value);
                  setErrorContrasena("");
                }}
                required
              />
              {errorContrasena && (
                <small id="contrasena-error" className={styles.errorCampo}>
                  {errorContrasena}
                </small>
              )}
            </div>
            {error && (
              <div className={styles.alerta} role="alert">
                {error}
              </div>
            )}
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
