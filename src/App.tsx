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
import Reportes from "./pages/Admin/Reportes";

import RutaProtegida from "./components/RutaProtegida";

import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RutaProtegida />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/rutas" element={<Rutas />} />
        <Route path="/reportes" element={<Quejas />} />
      </Route>

      <Route element={<RutaProtegida rolRequerido="admin" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="operadores" element={<Operadores />} />
          <Route path="rutas" element={<RutasAdmin />} />
          <Route path="reportes" element={<Reportes />} />
        </Route>
      </Route>

      <Route path="*" element={<NoEncontrado />} />
    </Routes>
  );
}

export default App;