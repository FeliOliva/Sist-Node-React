import React, { useEffect, useState } from "react";
import { Table, message, Button } from "antd";
import { api } from "../services/api";

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const data = await api("api/clientes?page=1&limit=3");
        setClientes(data.clients);
      } catch (error) {
        message.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, []);

  // Función para activar/desactivar cliente
  const toggleCliente = async (id, activo) => {
    try {
      const nuevoEstado = !activo;
      const metodo = nuevoEstado ? "POST" : "DELETE";

      await api(`api/clientes/${id}`, metodo, { estado: nuevoEstado });

      // Actualizar la lista localmente
      setClientes((prevClientes) =>
        prevClientes.map((cliente) =>
          cliente.id === id ? { ...cliente, activo: nuevoEstado } : cliente
        )
      );
      const mensaje = `Cliente ${nuevoEstado ? "activado" : "desactivado"} correctamente.`;
      message.success(mensaje);
      alert(mensaje); // 🔔 Mostrar alert en pantalla
    } catch (error) {
      message.error(error.message || "Error al cambiar el estado del cliente.");
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Nombre", dataIndex: "nombre", key: "nombre" },
    { title: "Apellido", dataIndex: "apellido", key: "apellido" },
    { title: "Teléfono", dataIndex: "telefono", key: "telefono" },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => (
        <Button
          type={record.activo ? "dashed" : "primary"}
          onClick={() => toggleCliente(record.id, record.activo)}
        >
          {record.activo ? "Desactivar" : "Activar"}
        </Button>
      ),
    },
  ];

  return <Table dataSource={clientes} columns={columns} loading={loading} rowKey="id" />;
};

export default Clientes;
