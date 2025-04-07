import React, { useEffect, useState } from "react";
import {
  Table,
  message,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Divider,
} from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(3);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  const fetchClientes = async (page = 1) => {
    setLoading(true);
    try {
      const data = await api(`api/clientes?page=${page}&limit=${pageSize}`);
      setClientes(data.clients);
      setTotal(data.total || 0);
      setCurrentPage(page);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchClientes(currentPage);
  }, [currentPage]);

  const toggleCliente = async (id, estado) => {
    try {
      const nuevoEstado = estado === 1 ? 0 : 1;
      const metodo = estado === 1 ? "DELETE" : "POST";
      await api(`api/clientes/${id}`, metodo);
      message.success(
        `Cliente ${
          nuevoEstado === 1 ? "activado" : "desactivado"
        } correctamente.`
      );
      setClientes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, estado: nuevoEstado } : c))
      );
    } catch (error) {
      message.error(error.message || "Error al cambiar el estado del cliente.");
    }
  };

  const handleAgregarCliente = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    const rol = parseInt(localStorage.getItem("rol")) || 0;
    const clientePayload = {
      nombre: values.nombre,
      apellido: values.apellido,
      telefono: values.telefono,
      editable: 0,
      rol_usuario: rol,
    };

    try {
      // Crear cliente
      const nuevoCliente = await api("api/clientes", "POST", clientePayload);
      const clienteId = nuevoCliente.id;

      // Crear negocios asociados
      const negociosPayload = values.negocios.map((n) => ({
        nombre: n.nombre,
        direccion: n.direccion,
        clienteId,
        rol_usuario: rol,
      }));

      for (const negocio of negociosPayload) {
        await api("api/negocio", "POST", negocio);
      }

      message.success("Cliente y negocios agregados correctamente.");
      setModalVisible(false);
      form.resetFields();

      // Refrescar lista de clientes
      const data = await api("api/clientes?page=1&limit=3");
      setClientes(data.clients);
    } catch (error) {
      message.error(error.message || "Error al agregar cliente/negocios.");
    }
  };
  const goToNegocios = (id) => {
    navigate(`/negocios/${id}`);
  };

  const columns = [
    {
      title: "Nombre",
      dataIndex: "nombre",
      key: "nombre",
    },
    {
      title: "Apellido",
      dataIndex: "apellido",
      key: "apellido",
      responsive: ["sm"],
    },
    {
      title: "Teléfono",
      dataIndex: "telefono",
      key: "telefono",
      responsive: ["sm"],
    },
    {
      title: "Negocios",
      key: "Acciones",
      render: (_, record) => {
        return (
          <Space size="middle">
            <Button
              type="link"
              onClick={() => {
                goToNegocios(record.id);
                console.log(record.id);
              }}
            >
              Ver Negocios
            </Button>
          </Space>
        );
      },
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => (
        <Button
          type={record.estado === 1 ? "dashed" : "primary"}
          size="small"
          onClick={() => toggleCliente(record.id, record.estado)}
        >
          {record.estado === 1 ? "Desactivar" : "Activar"}
        </Button>
      ),
    },
  ];

  return (
    <div
      className="responsive-container"
      style={{ width: "100%", overflowX: "auto" }}
    >
      <Button type="primary" onClick={handleAgregarCliente}>
        Agregar Cliente
      </Button>

      <Table
        dataSource={clientes}
        columns={columns}
        loading={loading}
        rowKey="id"
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          onChange: (page) => fetchClientes(page),
          responsive: true,
          position: ["bottomCenter"],
          size: "small",
        }}
        size="small"
        scroll={{ x: "max-content" }}
      />

      <Modal
        title="Agregar Cliente y Negocios"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item
            label="Nombre"
            name="nombre"
            rules={[{ required: true, message: "Ingrese el nombre" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Apellido"
            name="apellido"
            rules={[{ required: true, message: "Ingrese el apellido" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Teléfono"
            name="telefono"
            rules={[{ required: true, message: "Ingrese el teléfono" }]}
          >
            <Input />
          </Form.Item>

          <Divider orientation="left">Negocios</Divider>

          <Form.List name="negocios">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Space
                    key={key}
                    style={{ display: "flex", marginBottom: 8 }}
                    align="baseline"
                  >
                    <Form.Item
                      {...rest}
                      name={[name, "nombre"]}
                      rules={[
                        { required: true, message: "Nombre del negocio" },
                      ]}
                    >
                      <Input placeholder="Nombre del negocio" />
                    </Form.Item>
                    <Form.Item
                      {...rest}
                      name={[name, "direccion"]}
                      rules={[
                        { required: true, message: "Dirección del negocio" },
                      ]}
                    >
                      <Input placeholder="Dirección" />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    Agregar Negocio
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
};

export default Clientes;
