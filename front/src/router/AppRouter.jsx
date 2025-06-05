import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "../pages/Login";
import Ventas from "../pages/admin/Ventas";
import Productos from "../pages/admin/Productos";
import Negocios from "../pages/admin/Negocios";
import Resumenes from "../pages/admin/Resumenes";
import Repartidor from "../pages/repartidor/Repartidor";
import Unauthorized from "../pages/Unauthorized";
import Entregas from "../pages/repartidor/Entregas";
import MainLayout from "../components/layout/Sidebar"; // Ajusta el path si es necesario
import Caja from "../pages/admin/Caja";

const AppRouter = () => {
  const token = sessionStorage.getItem("token");
  const expiry = sessionStorage.getItem("tokenExpiry");
  const userRole = Number(sessionStorage.getItem("rol"));
  const now = Date.now();
  const [isMobile, setIsMobile] = useState(false);

  const isAuthenticated = token && expiry && now < Number(expiry);

  // Definir permisos por rol
  const isAdmin = userRole === 0;
  const isManager = userRole === 1;
  const isDelivery = userRole >= 2;

  console.log("User Role:", userRole);
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return (
    <Router>
      <Routes>
        {isAuthenticated ? (
          <>
            {isDelivery && isMobile ? (
              // Mobile view para repartidor
              <>
                <Route path="/repartidor" element={<Repartidor />} />
                <Route path="/entregas" element={<Entregas />} />
                <Route path="*" element={<Navigate to="/repartidor" />} />
              </>
            ) : (
              // Vista escritorio (admin o manager)
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Navigate to={"/ventas"} />} />

                {isAdmin || isManager ? (
                  <>
                    <Route path="productos" element={<Productos />} />
                    <Route path="negocios" element={<Negocios />} />
                    <Route path="resumenes" element={<Resumenes />} />
                    <Route path="ventas" element={<Ventas />} />
                    <Route path="caja" element={<Caja />} />
                  </>
                ) : (
                  // Si no tiene permisos de admin ni manager
                  <>
                    <Route path="productos" element={<Unauthorized />} />
                    <Route path="negocios" element={<Unauthorized />} />
                    <Route path="resumenes" element={<Unauthorized />} />
                    <Route path="ventas" element={<Unauthorized />} />
                  </>
                )}
                <Route path="*" element={<Navigate to="/ventas" />} />
              </Route>
            )}
          </>
        ) : (
          // No autenticado
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
