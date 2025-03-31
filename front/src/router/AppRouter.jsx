import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "../pages/Login";
import Clientes from "../pages/Clientes";
import { Layout } from "antd";
import Sidebar from "../components/layout/Sidebar";

const AppRouter = () => {
  const token = localStorage.getItem("token");

  return (
    <Router>
      {token ? (
        // Si hay token, mostramos el layout con el Sidebar y Clientes
        <Layout style={{ minHeight: "100vh" }}>
          <Sidebar />
          <Layout.Content style={{ padding: "20px" }}>
            <Routes>
              <Route path="/clientes" element={<Clientes />} />
              <Route path="*" element={<Navigate to="/clientes" />} />
            </Routes>
          </Layout.Content>
        </Layout>
      ) : (
        // Si NO hay token, solo mostramos el Login
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </Router>
  );
};

export default AppRouter;
