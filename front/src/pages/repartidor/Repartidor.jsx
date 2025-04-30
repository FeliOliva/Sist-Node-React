import React, { useEffect, useState } from "react";
import { Spin } from "antd";
import Entregas from "./Entregas"; // Ajusta la ruta según tu estructura

const Repartidor = () => {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Obtener el nombre del usuario desde sessionStorage
    const getUserInfo = () => {
      try {
        const storedUserName = sessionStorage.getItem("userName");
        setUserName(storedUserName || "Repartidor");
      } catch (error) {
        console.error("Error obteniendo nombre del usuario:", error);
        setUserName("Repartidor");
      } finally {
        setLoading(false);
      }
    };

    getUserInfo();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="Cargando información..." />
      </div>
    );
  }

  return (
    <div className="repartidor-container bg-gray-50 min-h-screen">
      <header className="bg-white shadow-md p-4">
        <div className="max-w-lg mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Mi Familia" className="h-10 w-auto" />
            <h1 className="text-xl font-bold text-blue-700">Mi Familia</h1>
          </div>
          <div className="text-gray-700 font-medium">¡Hola, {userName}!</div>
        </div>
      </header>

      <main className="max-w-lg mx-auto py-4">
        <Entregas />
      </main>
    </div>
  );
};

export default Repartidor;
