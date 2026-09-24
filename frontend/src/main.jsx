import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./estilos.css";
import { AuthProvider } from "./contexto/AuthContext.jsx";
import { ConfirmarProvider } from "./componentes/Confirmar.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ConfirmarProvider>
          <App />
        </ConfirmarProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
