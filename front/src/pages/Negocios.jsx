import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, message, Typography } from "antd";
import { useParams } from "react-router-dom";
import { api } from "../services/api";

const { Title } = Typography;

const Negocios = () => {
  const { id } = useParams();
  const [negocios, setNegocios] = useState([]);
  const [clienteNombre, setClienteNombre] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchNegocios = async () => {
    try {
      const data = await api(`api/getAllNegociosByCliente/${id}`);
      setNegocios(data.negocios);
      if (data.negocios.length > 0) {
        const cliente = await api(`api/clientes/${id}`);
        console.log("cliente", cliente);
        setClienteNombre(cliente.nombre + " " + cliente.apellido);
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNegocios();
  }, []);

  const handleAddNegocio = async (values) => {
    try {
      const rol = localStorage.getItem("rol");
      await api("api/negocio", "POST", {
        ...values,
        clienteId: parseInt(id),
        rol_usuario: parseInt(rol),
      });
      message.success("Negocio agregado exitosamente");
      setModalVisible(false);
      form.resetFields();
      fetchNegocios(); // Recargar negocios
    } catch (error) {
      message.error(error.message);
    }
  };

  const columns = [
    {
      title: "Nombre",
      dataIndex: "nombre",
      key: "nombre",
    },
    {
      title: "Dirección",
      dataIndex: "direccion",
      key: "direccion",
    },
  ];

  return (
    <div className="p-6">
      <Title level={3} className="!mb-4">
        Negocios de {clienteNombre}
      </Title>
      <div className="flex justify-between items-center mb-4">
        <Button type="primary" onClick={() => setModalVisible(true)}>
          Agregar Negocio
        </Button>
        <Button type="default" onClick={() => window.history.back()}>
          Volver
        </Button>
      </div>

      <Table
        dataSource={negocios}
        columns={columns}
        loading={loading}
        rowKey="id"
        pagination={false}
        bordered
      />

      <Modal
        title="Agregar Nuevo Negocio"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText="Agregar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" onFinish={handleAddNegocio}>
          <Form.Item
            name="nombre"
            label="Nombre del negocio"
            rules={[{ required: true, message: "Ingrese un nombre" }]}
          >
            <Input placeholder="Nombre del negocio" />
          </Form.Item>
          <Form.Item
            name="direccion"
            label="Dirección"
            rules={[{ required: true, message: "Ingrese una dirección" }]}
          >
            <Input placeholder="Dirección del negocio" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Negocios;
