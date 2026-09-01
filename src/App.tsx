import { Routes, Route } from "react-router";

import Inicio from "./pages/Inicio";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
    </Routes>
  );
}

export default App;
