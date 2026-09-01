import { Routes, Route } from "react-router";

import Inicio from "./pages/Inicio";
import Rutas from "./pages/Rutas/Rutas";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/rutas" element={<Rutas/>} />
    </Routes>
  );
}

export default App;
