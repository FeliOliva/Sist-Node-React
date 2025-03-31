import React, { useEffect, useState } from "react";
import { Table, message } from "antd";
import { api } from "../services/api";

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const data = await api("api/clientes?page=1&limit=3");
        setClientes(data.clients); // Extraemos correctamente el array de clientes
        console.log(data.clients); // Verificamos que los datos sean correctos
      } catch (error) {
        message.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, []);

  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Nombre", dataIndex: "nombre", key: "nombre" },
    { title: "Apellido", dataIndex: "apellido", key: "apellido" },
    { title: "Teléfono", dataIndex: "telefono", key: "telefono" },
  ];

  return (
    <Table
      dataSource={clientes}
      columns={columns}
      loading={loading}
      rowKey="id"
    />
  );
};

export default Clientes;
