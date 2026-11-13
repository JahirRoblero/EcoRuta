import { useState } from "react";
import ModalConfirmacion from "../../components/Admin/ModalConfirmacion";

export default function Usuarios() {
  const [modalAbierto, setModalAbierto] = useState(false);

  return (
    <div>
      <h1 style={{ color: "#9d2449" }}>Usuarios</h1>
      <button onClick={() => setModalAbierto(true)}>Probar modal</button>

      <ModalConfirmacion
        abierto={modalAbierto}
        titulo="Desactivar usuario"
        mensaje="El usuario ya no podrá iniciar sesión. ¿Deseas continuar?"
        textoConfirmar="Desactivar"
        onConfirmar={() => setModalAbierto(false)}
        onCancelar={() => setModalAbierto(false)}
      />
    </div>
  );
}