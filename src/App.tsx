import { Routes, Route } from "react-router";

import Rutas from "./pages/Rutas/Rutas";
import Quejas from "./pages/Quejas/Quejas";
import Login from "./pages/Login/Login";
import Inicio from "./pages/Inicio";
import NoEncontrado from "./pages/NoEncontrado";

import AdminLayout from "./pages/Admin/AdminLayout";
import Dashboard from "./pages/Admin/Dashboard";
import Usuarios from "./pages/Admin/Usuarios";
import Operadores from "./pages/Admin/Operadores";
import RutasAdmin from "./pages/Admin/RutasAdmin";
import ReportesAdmin from "./pages/Admin/Reportes";

import RutaProtegida from "./components/RutaProtegida";
import Reportes from "./pages/Reportes/Reportes";
import "./App.css";
import PuntosBasura from "./pages/PuntosBasura/PuntosBasura";
import Registro from "./pages/Registro/Registro";
import MiPerfil from "./pages/MiPerfil/MiPerfil";
import PanelOperador from "./pages/Operador/PanelOperador";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      <Route element={<RutaProtegida />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/rutas" element={<Rutas />} />
        <Route path="/crear-reportes" element={<Quejas />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/puntos-basura" element={<PuntosBasura />} />
        <Route path="/mi-perfil" element={<MiPerfil />} />
      </Route>

      <Route element={<RutaProtegida rolRequerido="operador" />}>
        <Route path="/operador" element={<PanelOperador />} />
      </Route>

      <Route element={<RutaProtegida rolRequerido="admin" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="operadores" element={<Operadores />} />
          <Route path="rutas" element={<RutasAdmin />} />
          <Route path="reportes" element={<ReportesAdmin />} />
        </Route>
      </Route>

      <Route path="*" element={<NoEncontrado />} />
    </Routes>
  );
}

export default App;
