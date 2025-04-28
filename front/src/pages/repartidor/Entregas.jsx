import React, { useEffect, useState } from "react";
import { Card, Button, Spin, Tag, Empty } from "antd";
import {
  ShoppingCartOutlined,
  CreditCardOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { api } from "../../services/api"; // Tu helper

const Entregas = () => {
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntregas = async () => {
      try {
        const cajaId = sessionStorage.getItem("cajaId");
        if (!cajaId) throw new Error("No hay cajaId en sessionStorage");

        const data = await api(`resumenDia?cajaId=${cajaId}`, "GET");
        setEntregas(data);
      } catch (error) {
        console.error("Error cargando entregas:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEntregas();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-80">
        <Spin size="large" />
      </div>
    );
  }

  if (!entregas.length) {
    return (
      <div className="flex justify-center items-center h-80">
        <Empty description="No hay entregas para mostrar" />
      </div>
    );
  }

  const getEstadoTag = (estado) => {
    if (estado === "COBRADA") {
      return <Tag color="green">COBRADA</Tag>;
    }
    return <Tag color="gold">PENDIENTE</Tag>;
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-2xl font-semibold mb-2 text-center">Mis entregas</h2>
      {entregas.map((entrega) => (
        <Card key={entrega.id} className="shadow-md rounded-lg">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ShoppingCartOutlined />
              <span className="font-semibold">{entrega.clienteNombre}</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCardOutlined />
              <span>Total: ${Number(entrega.total).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <EnvironmentOutlined />
              <span>{entrega.direccion}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              {getEstadoTag(entrega.estado)}
              <Button type="default">Pagar / Cobrar</Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default Entregas;
