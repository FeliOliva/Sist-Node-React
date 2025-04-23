import React, { useEffect, useState } from "react";
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
import Resumenes from "../pages/Resumenes";
import Repartidor from "../pages/Repartidor";
import Unauthorized from "../pages/Unauthorized";


const AppRouter = () => {
  const token = sessionStorage.getItem("token");
  const expiry = sessionStorage.getItem("tokenExpiry");
  const userRole = Number(sessionStorage.getItem("rol")) 
  const now = Date.now();
  const [isMobile, setIsMobile] = useState(false);

  const isAuthenticated = token && expiry && now < Number(expiry);

  // Definir permisos por rol
  const isAdmin = userRole === 0;
  const isManager = userRole === 1;
  const isDelivery = userRole >= 2;

  // Detectar si el dispositivo es móvil
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Renderizar la interfaz móvil para roles 2 o mayores en dispositivos móviles
  if (isAuthenticated && isDelivery && isMobile) {
    return (
      <Router>
        <Routes>
          <Route path="/repartidor" element={<Repartidor />} />
          <Route path="*" element={<Navigate to="/repartidor" />} />
        </Routes>
      </Router>
    );
  }

  // Determinar la página de inicio según el rol
  const getHomePage = () => {
    if (isAdmin || isManager) return "/clientes";
    return "/ventas";
  };

  return (
    <Router>
      <Routes>
        {isAuthenticated ? (
          <Route path="/" element={<Sidebar />}>
            <Route path="ventas" element={<Unauthorized />} />

            {isAdmin || isManager ? (
              <>
                <Route path="clientes" element={<Clientes />} />
                <Route path="productos" element={<Productos />} />
                <Route path="negocios/:id" element={<Negocios />} />
                <Route path="resumenes" element={<Resumenes />} />
              </>
            ) : (
              <>
                <Route path="clientes" element={<Unauthorized />} />
                <Route path="productos" element={<Unauthorized />} />
                <Route path="negocios/:id" element={<Unauthorized />} />
                <Route path="resumenes" element={<Unauthorized />} />
              </>
            )}

            {/* Si no coincide con ninguna ruta válida */}
            <Route path="*" element={<h1>404 - Página no encontrada</h1>} />
          </Route>
        ) : isDelivery ? (
          <>
            <Route path="/repartidor" element={<Repartidor />} />
            <Route path="*" element={<Navigate to="/repartidor" />} />
          </>

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