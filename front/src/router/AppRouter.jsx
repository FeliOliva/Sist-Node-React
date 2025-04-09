// src/router/AppRouter.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "../pages/Login";
import Clientes from "../pages/Clientes";
import Ventas from "../pages/Ventas";
import Productos from "../pages/Productos";
import Negocios from "../pages/Negocios";
import Sidebar from "../components/layout/Sidebar";

const AppRouter = () => {
  const token = sessionStorage.getItem("token");
  const expiry = sessionStorage.getItem("tokenExpiry");
  const now = Date.now();

  const isAuthenticated = token && expiry && now < Number(expiry);

  return (
    <Router>
      <Routes>
        {isAuthenticated ? (
          <Route path="/" element={<Sidebar />}>
            <Route path="clientes" element={<Clientes />} />
            <Route path="ventas" element={<Ventas />} />
            <Route path="productos" element={<Productos />} />
            <Route path="negocios/:id" element={<Negocios />} />
            <Route path="*" element={<Navigate to="/clientes" />} />
          </Route>
        ) : (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        )}
      </Routes>
    </Router>
  );
};

export default AppRouter;
