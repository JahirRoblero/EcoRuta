import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useNavigate } from "react-router";

import styles from "./Registro.module.css";
import logoEcorruta from "../../assets/img/LogoEcorrutaBlanco.png";
import { enviarCodigoVerificacion, registrarUsuario } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Footer from "../../components/Inicio/Footer/Footer";
import {
  limpiarCorreo,
  limpiarNombre,
  requisitosContrasena,
  soloDigitos,
  validarContrasena,
  validarCorreo,
  validarNombre,
} from "../../utils/validaciones";

interface RespuestaPostal {
  cp: string;
  estado: string;
  municipio: string;
  asentamientos: { nombre: string; tipo: string }[];
}

type Campo =
  | "nombre"
  | "apellidoPaterno"
  | "apellidoMaterno"
  | "correo"
  | "codigoPostal"
  | "colonia"
  | "contrasena"
  | "confirmarContrasena"
  | "codigoVerificacion";

type Errores = Partial<Record<Campo, string>>;

// Orden en que aparecen en pantalla (para enfocar el primer campo con error)
const ORDEN_CAMPOS: Campo[] = [
  "nombre",
  "apellidoPaterno",
  "apellidoMaterno",
  "correo",
  "codigoPostal",
  "colonia",
  "contrasena",
  "confirmarContrasena",
  "codigoVerificacion",
];

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
  const [errores, setErrores] = useState<Errores>({});

  // ------------------------------------------------------------
  // Validación por campo
  // ------------------------------------------------------------

  const validarCampo = (campo: Campo): string => {
    switch (campo) {
      case "nombre":
        return validarNombre(nombre, "El nombre");
      case "apellidoPaterno":
        return validarNombre(apellidoPaterno, "El apellido paterno");
      case "apellidoMaterno":
        return validarNombre(apellidoMaterno, "El apellido materno", false);
      case "correo":
        return validarCorreo(correo);
      case "codigoPostal":
        if (!codigoPostal) return "El código postal es obligatorio.";
        if (codigoPostal.length !== 5)
          return "El código postal debe tener 5 dígitos.";
        return "";
      case "colonia":
        if (!coloniaNombre) return "Selecciona tu colonia.";
        if (!colonias.includes(coloniaNombre))
          return "Selecciona una colonia válida.";
        return "";
      case "contrasena":
        return validarContrasena(contrasena);
      case "confirmarContrasena":
        if (!confirmarContrasena) return "Confirma tu contraseña.";
        if (confirmarContrasena !== contrasena)
          return "Las contraseñas no coinciden.";
        return "";
      case "codigoVerificacion":
        if (!codigoEnviado) return "";
        if (!codigoVerificacion)
          return "Escribe el código que te enviamos al correo.";
        if (codigoVerificacion.length !== 5)
          return "El código debe tener 5 dígitos.";
        return "";
    }
  };

  const alSalir = (campo: Campo) => {
    setErrores((anteriores) => ({ ...anteriores, [campo]: validarCampo(campo) }));
  };

  const limpiarError = (campo: Campo) => {
    if (!errores[campo]) return;
    setErrores((anteriores) => ({ ...anteriores, [campo]: "" }));
  };

  const validarFormulario = (): boolean => {
    const nuevos: Errores = {};

    for (const campo of ORDEN_CAMPOS) {
      const mensajeCampo = validarCampo(campo);
      if (mensajeCampo) nuevos[campo] = mensajeCampo;
    }

    setErrores(nuevos);

    const conError = ORDEN_CAMPOS.filter((campo) => nuevos[campo]);

    if (conError.length === 0) return true;

    setError(
      conError.length === 1
        ? "Hay 1 campo vacío o con errores. Revisa el campo marcado en rojo."
        : `Hay ${conError.length} campos vacíos o con errores. Revisa los campos marcados en rojo.`,
    );

    document.getElementById(conError[0])?.focus();

    return false;
  };

  // ------------------------------------------------------------
  // Cambios en los campos
  // ------------------------------------------------------------

  const cambiarCorreo = (valor: string) => {
    setCorreo(limpiarCorreo(valor));
    limpiarError("correo");
    setCodigoEnviado(false);
    setCodigoVerificacion("");
    setSegundosEspera(0);
    setMensaje("");
    setError("");
  };

  const cambiarCodigoPostal = (e: ChangeEvent<HTMLInputElement>) => {
    const valor = soloDigitos(e.target.value, 5);
    setCodigoPostal(valor);
    limpiarError("codigoPostal");
    limpiarError("colonia");
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

  // ------------------------------------------------------------
  // Envío
  // ------------------------------------------------------------

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

  // ------------------------------------------------------------
  // Vista
  // ------------------------------------------------------------

  const etiqueta = (texto: string, obligatorio = true): ReactNode => (
    <>
      {texto}
      {obligatorio && (
        <span className={styles.obligatorio} aria-hidden="true">
          {" "}
          *
        </span>
      )}
    </>
  );

  const propsError = (campo: Campo) => ({
    className: errores[campo] ? styles.campoConError : undefined,
    "aria-invalid": Boolean(errores[campo]),
    "aria-describedby": errores[campo] ? `${campo}-error` : undefined,
    onBlur: () => alSalir(campo),
  });

  const mensajeCampo = (campo: Campo) =>
    errores[campo] ? (
      <small id={`${campo}-error`} className={styles.errorCampo} role="alert">
        {errores[campo]}
      </small>
    ) : null;

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

      <form
        onSubmit={manejarRegistro}
        className={styles.formulario}
        noValidate
      >
        <h2 className={styles.tituloRegistro}>Registro de ciudadano</h2>

        <p className={styles.notaObligatorios}>
          Los campos marcados con <span className={styles.obligatorio}>*</span>{" "}
          son obligatorios.
        </p>

        <div className={styles.grupoFormulario}>
          <label htmlFor="nombre">{etiqueta("Nombre:")}</label>
          <input
            id="nombre"
            type="text"
            maxLength={60}
            autoComplete="given-name"
            value={nombre}
            onChange={(e) => {
              setNombre(limpiarNombre(e.target.value));
              limpiarError("nombre");
            }}
            required
            {...propsError("nombre")}
          />
          {mensajeCampo("nombre")}
        </div>
        <div className={styles.grupoFormulario}>
          <label htmlFor="apellidoPaterno">
            {etiqueta("Apellido paterno:")}
          </label>
          <input
            id="apellidoPaterno"
            type="text"
            maxLength={60}
            autoComplete="family-name"
            value={apellidoPaterno}
            onChange={(e) => {
              setApellidoPaterno(limpiarNombre(e.target.value));
              limpiarError("apellidoPaterno");
            }}
            required
            {...propsError("apellidoPaterno")}
          />
          {mensajeCampo("apellidoPaterno")}
        </div>
        <div className={styles.grupoFormulario}>
          <label htmlFor="apellidoMaterno">
            {etiqueta("Apellido materno (opcional):", false)}
          </label>
          <input
            id="apellidoMaterno"
            type="text"
            maxLength={60}
            value={apellidoMaterno}
            onChange={(e) => {
              setApellidoMaterno(limpiarNombre(e.target.value));
              limpiarError("apellidoMaterno");
            }}
            {...propsError("apellidoMaterno")}
          />
          {mensajeCampo("apellidoMaterno")}
        </div>
        <div className={styles.grupoFormulario}>
          <label htmlFor="correo">{etiqueta("Correo electrónico:")}</label>
          <input
            id="correo"
            type="email"
            maxLength={254}
            autoComplete="email"
            placeholder="nombre@dominio.com"
            value={correo}
            onChange={(e) => cambiarCorreo(e.target.value)}
            required
            {...propsError("correo")}
          />
          {mensajeCampo("correo")}
        </div>
        <div className={styles.grupoFormulario}>
          <label htmlFor="codigoPostal">{etiqueta("Código postal:")}</label>
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
            {...propsError("codigoPostal")}
          />
          {mensajeCampo("codigoPostal")}
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
          <label htmlFor="colonia">{etiqueta("Selecciona tu colonia:")}</label>
          <select
            id="colonia"
            value={coloniaNombre}
            onChange={(e) => {
              setColoniaNombre(e.target.value);
              limpiarError("colonia");
            }}
            disabled={buscando || colonias.length === 0}
            required
            {...propsError("colonia")}
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
          {mensajeCampo("colonia")}
        </div>

        <div className={styles.grupoFormulario}>
          <label htmlFor="contrasena">{etiqueta("Contraseña:")}</label>
          <input
            id="contrasena"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            value={contrasena}
            onChange={(e) => {
              setContrasena(e.target.value.replace(/\s/g, ""));
              limpiarError("contrasena");
            }}
            required
            {...propsError("contrasena")}
          />
          {mensajeCampo("contrasena")}
          <ul className={styles.requisitos} aria-label="Requisitos de la contraseña">
            {requisitosContrasena(contrasena).map((requisito) => (
              <li
                key={requisito.texto}
                className={
                  requisito.cumple ? styles.requisitoCumplido : styles.requisitoPendiente
                }
              >
                <span aria-hidden="true">{requisito.cumple ? "✓" : "✗"}</span>{" "}
                {requisito.texto}
                <span className={styles.soloLector}>
                  {requisito.cumple ? " (cumplido)" : " (pendiente)"}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.grupoFormulario}>
          <label htmlFor="confirmarContrasena">
            {etiqueta("Confirmar contraseña:")}
          </label>
          <input
            id="confirmarContrasena"
            type="password"
            autoComplete="new-password"
            maxLength={72}
            value={confirmarContrasena}
            onChange={(e) => {
              setConfirmarContrasena(e.target.value.replace(/\s/g, ""));
              limpiarError("confirmarContrasena");
            }}
            required
            {...propsError("confirmarContrasena")}
          />
          {mensajeCampo("confirmarContrasena")}
        </div>

        {codigoEnviado && (
          <div className={styles.grupoFormulario}>
            <label htmlFor="codigoVerificacion">
              {etiqueta("Código enviado al correo:")}
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
              onChange={(e) => {
                setCodigoVerificacion(soloDigitos(e.target.value, 5));
                limpiarError("codigoVerificacion");
              }}
              required
              {...propsError("codigoVerificacion")}
            />
            {mensajeCampo("codigoVerificacion")}
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
          <div className={styles.alerta} role="alert">
            {error}
          </div>
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
