import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router";

import styles from "./Registro.module.css";
import logoEcorruta from "../../assets/img/LogoEcorrutaBlanco.png";
import { enviarCodigoVerificacion, registrarUsuario } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Footer from "../../components/Inicio/Footer/Footer";

interface RespuestaPostal {
  cp: string;
  estado: string;
  municipio: string;
  asentamientos: { nombre: string; tipo: string }[];
}

function Registro() {
  const navigate = useNavigate();
  const { guardarSesion } = useAuth();

  const [nombre, setNombre] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [correo, setCorreo] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [colonias, setColonias] = useState<string[]>([]);
  const [coloniaNombre, setColoniaNombre] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [estado, setEstado] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [codigoVerificacion, setCodigoVerificacion] = useState("");

  const [buscando, setBuscando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [segundosEspera, setSegundosEspera] = useState(0);
  const [errorCP, setErrorCP] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cambiarCorreo = (valor: string) => {
    setCorreo(valor);
    setCodigoEnviado(false);
    setCodigoVerificacion("");
    setSegundosEspera(0);
    setMensaje("");
    setError("");
  };

  const cambiarCodigoPostal = (e: ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, "").slice(0, 5);
    setCodigoPostal(valor);
    setColoniaNombre("");
    setColonias([]);
    setMunicipio("");
    setEstado("");
    setErrorCP("");
    setBuscando(false);
  };

  useEffect(() => {
    if (!/^\d{5}$/.test(codigoPostal)) return;
    const controlador = new AbortController();
    async function buscarColonias() {
      setBuscando(true);
      setErrorCP("");
      try {
        const respuesta = await fetch(
          `https://postali.app/api/v1/mx/cp/${codigoPostal}`,
          { signal: controlador.signal },
        );
        if (!respuesta.ok) {
          throw new Error(
            respuesta.status === 404
              ? "Código postal no encontrado"
              : "No se pudieron consultar las colonias",
          );
        }
        const datos: RespuestaPostal = await respuesta.json();
        if (controlador.signal.aborted) return;
        const nombres = [
          ...new Set(
            (datos.asentamientos ?? []).map((a) => a.nombre).filter(Boolean),
          ),
        ].sort((a, b) => a.localeCompare(b, "es"));
        setColonias(nombres);
        setMunicipio(datos.municipio);
        setEstado(datos.estado);
        if (nombres.length === 0) setErrorCP("No se encontraron colonias");
      } catch (err: unknown) {
        if (controlador.signal.aborted) return;
        setColonias([]);
        setErrorCP(
          err instanceof Error
            ? err.message
            : "Error consultando el código postal",
        );
      } finally {
        if (!controlador.signal.aborted) setBuscando(false);
      }
    }
    buscarColonias();
    return () => controlador.abort();
  }, [codigoPostal]);

  useEffect(() => {
    if (segundosEspera <= 0) return;
    const timer = window.setTimeout(
      () => setSegundosEspera((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [segundosEspera]);

  const validarFormulario = () => {
    if (contrasena !== confirmarContrasena) {
      setError("Las contraseñas no coinciden");
      return false;
    }
    if (contrasena.length < 8) {
      setError("La contraseña debe tener mínimo 8 caracteres");
      return false;
    }
    if (!colonias.includes(coloniaNombre)) {
      setError("Selecciona una colonia válida");
      return false;
    }
    return true;
  };

  const solicitarCodigo = async () => {
    setError("");
    setMensaje("");
    setEnviando(true);
    try {
      await enviarCodigoVerificacion(correo.trim().toLowerCase());
      setCodigoEnviado(true);
      setCodigoVerificacion("");
      setSegundosEspera(60);
      setMensaje(
        "Si el correo puede registrarse, recibirás un código válido por 10 minutos. Revisa también spam.",
      );
    } catch (err: unknown) {
      const fallo = err as Error & { status?: number };
      setError(
        fallo.status === 429
          ? "Espera antes de solicitar otro código (máximo 5 envíos por hora)."
          : "No se pudo enviar el correo. Inténtalo de nuevo.",
      );
    } finally {
      setEnviando(false);
    }
  };

  const manejarRegistro = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!validarFormulario()) return;

    if (!codigoEnviado) {
      await solicitarCodigo();
      return;
    }

    if (!/^\d{5}$/.test(codigoVerificacion)) {
      setError("Introduce el código de verificación de 5 dígitos");
      return;
    }

    setRegistrando(true);
    try {
      const respuesta = await registrarUsuario({
        nombre: nombre.trim(),
        apellidoPaterno: apellidoPaterno.trim(),
        apellidoMaterno: apellidoMaterno.trim(),
        correo: correo.trim().toLowerCase(),
        codigoPostal,
        coloniaNombre,
        contrasena,
        confirmarContrasena,
        codigoVerificacion,
      });
      guardarSesion(respuesta.token);
      navigate("/rutas", { replace: true });
    } catch (err: unknown) {
      const fallo = err as Error & { status?: number };
      if (fallo.status === 409) setError("Este correo ya está registrado");
      else if (fallo.status === 422)
        setError("La colonia no está registrada o está inactiva en EcoRuta");
      else if (fallo.status === 429)
        setError(
          "Demasiados intentos. Solicita un código nuevo cuando sea posible.",
        );
      else if (fallo.status === 400)
        setError("Código incorrecto o vencido, o datos inválidos.");
      else setError("No se pudo crear la cuenta. Inténtalo nuevamente.");
    } finally {
      setRegistrando(false);
    }
  };

  return (
    <main className={styles.contenedor}>
      <nav className={styles.barraContenedor}>
        <div className={styles["contenedor-izquierdo"]}>
          <img className={styles.logoOaxaca} src={logoEcorruta} alt="EcoRuta" />
          <div className="titulo">
            <h1>Ecorruta</h1>
            <p>GOBIERNO DEL ESTADO</p>
          </div>
        </div>
      </nav>

      <form onSubmit={manejarRegistro} className={styles.formulario}>
        <h2 className={styles.tituloRegistro}>Registro de ciudadano</h2>

        <div className={styles.grupoFormulario}>
          <label htmlFor="nombre">Nombre:</label>
          <input
            id="nombre"
            type="text"
            maxLength={60}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>
        <div className={styles.grupoFormulario}>
          <label htmlFor="apellidoPaterno">Apellido paterno:</label>
          <input
            id="apellidoPaterno"
            type="text"
            maxLength={60}
            value={apellidoPaterno}
            onChange={(e) => setApellidoPaterno(e.target.value)}
            required
          />
        </div>
        <div className={styles.grupoFormulario}>
          <label htmlFor="apellidoMaterno">Apellido materno:</label>
          <input
            id="apellidoMaterno"
            type="text"
            maxLength={60}
            value={apellidoMaterno}
            onChange={(e) => setApellidoMaterno(e.target.value)}
          />
        </div>
        <div className={styles.grupoFormulario}>
          <label htmlFor="correo">Correo electrónico:</label>
          <input
            id="correo"
            type="email"
            maxLength={254}
            value={correo}
            onChange={(e) => cambiarCorreo(e.target.value)}
            required
          />
        </div>
        <div className={styles.grupoFormulario}>
          <label htmlFor="codigoPostal">Código postal:</label>
          <input
            id="codigoPostal"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            pattern="[0-9]{5}"
            placeholder="68000"
            value={codigoPostal}
            onChange={cambiarCodigoPostal}
            required
          />
        </div>

        {buscando && <p>Buscando colonias...</p>}
        {errorCP && (
          <p role="alert" className={styles.mensajeError}>
            {errorCP}
          </p>
        )}
        {municipio && estado && (
          <p className={styles.mensajeExito}>
            {municipio}, {estado}
          </p>
        )}

        <div className={styles.grupoFormulario}>
          <label htmlFor="colonia">Selecciona tu colonia:</label>
          <select
            id="colonia"
            value={coloniaNombre}
            onChange={(e) => setColoniaNombre(e.target.value)}
            disabled={buscando || colonias.length === 0}
            required
          >
            <option value="">
              {buscando
                ? "Buscando..."
                : colonias.length
                  ? "Selecciona una colonia"
                  : "Ingresa tu código postal"}
            </option>
            {colonias.map((colonia) => (
              <option key={colonia} value={colonia}>
                {colonia}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.grupoFormulario}>
          <label htmlFor="contrasena">Contraseña:</label>
          <input
            id="contrasena"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
          />
        </div>
        <div className={styles.grupoFormulario}>
          <label htmlFor="confirmarContrasena">Confirmar contraseña:</label>
          <input
            id="confirmarContrasena"
            type="password"
            autoComplete="new-password"
            value={confirmarContrasena}
            onChange={(e) => setConfirmarContrasena(e.target.value)}
            required
          />
        </div>

        {codigoEnviado && (
          <div className={styles.grupoFormulario}>
            <label htmlFor="codigoVerificacion">
              Código enviado al correo:
            </label>
            <input
              id="codigoVerificacion"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={5}
              pattern="[0-9]{5}"
              placeholder="5 dígitos"
              value={codigoVerificacion}
              onChange={(e) =>
                setCodigoVerificacion(
                  e.target.value.replace(/\D/g, "").slice(0, 5),
                )
              }
              required
            />
            <button
              className={styles.botonReenviar}
              type="button"
              onClick={solicitarCodigo}
              disabled={enviando || registrando || segundosEspera > 0}
            >
              {segundosEspera > 0
                ? `Reenviar código en ${segundosEspera}s`
                : "Reenviar código"}
            </button>
          </div>
        )}

        {mensaje && (
          <p className={styles.mensajeExito} role="status">
            {mensaje}
          </p>
        )}
        {error && (
          <p className={styles.mensajeError} role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={registrando || enviando || buscando}>
          {registrando
            ? "Creando cuenta..."
            : enviando
              ? "Enviando código..."
              : codigoEnviado
                ? "Verificar código y crear cuenta"
                : "Enviar código de verificación"}
        </button>

        <p>
          ¿Ya tienes cuenta? <a href="/login">Iniciar sesión</a>
        </p>
      </form>
      <Footer />
    </main>
  );
}

export default Registro;
