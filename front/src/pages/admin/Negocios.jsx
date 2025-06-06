import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, message, Typography, Checkbox } from "antd";
import { useParams } from "react-router-dom";
import { api } from "../../services/api";

const { Title } = Typography;

const Negocios = () => {
  const { id } = useParams();
  const [negocios, setNegocios] = useState([]);
  const [clienteNombre, setClienteNombre] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  // NUEVO: estados para búsqueda y filtro de estado
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos"); // "todos", "activos", "inactivos"

  const fetchNegocios = async () => {
    try {
      const data = await api(`api/getAllNegocios`);
      setNegocios(data.negocios);
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
      const rol = sessionStorage.getItem("rol");
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
  const handleDeshabilitar = async (id) => {
    try {
      await api(`api/negocio/${id}/deshabilitar`, "PUT");
      message.success("Negocio deshabilitado");
      fetchNegocios();
    } catch (error) {
      message.error("Error al deshabilitar el negocio");
    }
  };

  const handleHabilitar = async (id) => {
    try {
      await api(`api/negocio/${id}/habilitar`, "PUT");
      message.success("Negocio habilitado");
      fetchNegocios();
    } catch (error) {
      message.error("Error al habilitar el negocio");
    }
  };

  // FILTRO Y BÚSQUEDA
  const negociosFiltrados = negocios
    .filter((n) => {
      if (filtroEstado === "activos") return n.estado === 1;
      if (filtroEstado === "inactivos") return n.estado === 0;
      return true;
    })
    .filter((n) =>
      n.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      n.direccion.toLowerCase().includes(busqueda.toLowerCase())
    );

  const negociosOrdenados = [...negociosFiltrados].sort((a, b) => {
    if (a.estado !== b.estado) {
      return b.estado - a.estado; // Activos (1) primero, inactivos (0) después
    }
    return new Date(b.fechaCreacion) - new Date(a.fechaCreacion);
  });

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
    {
      title: "Cuenta Corriente",
      dataIndex: "esCuentaCorriente",
      key: "esCuentaCorriente",
      render: (value) => value ? "Sí" : "No",
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      render: (value) =>
        value === 1 ? (
          <span style={{ color: "green" }}>Activo</span>
        ) : (
          <span style={{ color: "red" }}>Inactivo</span>
        ),
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => (
        record.estado === 1 ? (
          <Button danger size="small" onClick={() => handleDeshabilitar(record.id)}>
            Deshabilitar
          </Button>
        ) : (
          <Button type="primary" size="small" onClick={() => handleHabilitar(record.id)}>
            Habilitar
          </Button>
        )
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <Button type="primary" onClick={() => setModalVisible(true)}>
          Agregar Negocio
        </Button>
      </div>

      {/* NUEVO: Buscador y botones de filtro */}
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Buscar por nombre o dirección"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ width: 250 }}
        />
        <Button
          type={filtroEstado === "todos" ? "primary" : "default"}
          onClick={() => setFiltroEstado("todos")}
        >
          Todos
        </Button>
        <Button
          type={filtroEstado === "activos" ? "primary" : "default"}
          onClick={() => setFiltroEstado("activos")}
        >
          Activos
        </Button>
        <Button
          type={filtroEstado === "inactivos" ? "primary" : "default"}
          onClick={() => setFiltroEstado("inactivos")}
        >
          Inactivos
        </Button>
      </div>

      <Table
        dataSource={negociosOrdenados}
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
          <Form.Item
            name="esCuentaCorriente"
            valuePropName="checked"
            initialValue={false}
          >
            <Checkbox>Registrar como cuenta corriente</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Negocios;