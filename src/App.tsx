import { Routes, Route } from "react-router";

import Rutas from "./pages/Rutas/Rutas";
import Quejas from "./pages/Quejas/Quejas";
import Login from "./pages/Login/Login";

import RutaProtegida from "./components/RutaProtegida";

import "./App.css";
import Inicio from "./pages/Inicio";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RutaProtegida />}>
        <Route path="/" element={<Inicio />} />
        <Route path="/rutas" element={<Rutas />} />
        <Route path="/quejas" element={<Quejas />} />
      </Route>
    </Routes>
  );
}

export default App;
