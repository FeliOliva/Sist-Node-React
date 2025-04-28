import React, { useEffect, useState } from "react";
import {
  Table,
  message,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
} from "antd";
import { api } from "../../services/api";

const { Option } = Select;

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchProductos = async (page = 1) => {
    setLoading(true);
    try {
      const data = await api(`api/products?page=${page}&limit=${pageSize}`);
      setProductos(data.products);
      setTotal(data.total || data.products?.length || 0);
      setCurrentPage(page);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos(currentPage);
  }, [currentPage]);

  const toggleProductos = async (id, estado) => {
    try {
      const nuevoEstado = estado === 1 ? 0 : 1;
      const metodo = estado === 1 ? "DELETE" : "POST";
      await api(`api/products/${id}`, metodo);
      message.success(
        `Producto ${
          nuevoEstado === 1 ? "activado" : "desactivado"
        } correctamente.`
      );
      setProductos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, estado: nuevoEstado } : p))
      );
    } catch (error) {
      message.error(
        error.message || "Error al cambiar el estado del producto."
      );
    }
  };

  const onFinish = async (values) => {
    const token = sessionStorage.getItem("token");
    let rol_usuario = 0;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      rol_usuario = payload.rol || 0;
    } catch (e) {
      message.warning("No se pudo leer el rol del token.");
    }

    const body = {
      ...values,
      precioInicial: values.precio,
      rol_usuario,
    };
    try {
      await api("api/products", "POST", body);
      message.success("Producto agregado correctamente");
      form.resetFields();
      setModalVisible(false);
      fetchProductos(currentPage);
    } catch (error) {
      message.error(error.message || "Error al agregar producto.");
    }
  };

  const columns = [
    {
      title: "Nombre",
      dataIndex: "nombre",
      key: "nombre",
    },
    {
      title: "Unidad",
      key: "tipoUnidad",
      render: (_, record) => record.tipoUnidad?.tipo || "-",
    },
    {
      title: "Precio",
      render: (_, record) => {
        const precio = record.precioInicial || 0;
        return (
          <span>
            {precio.toLocaleString("es-CL", {
              style: "currency",
              currency: "CLP",
            })}
          </span>
        );
      },
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (text, record) => (
        <Space size="middle">
          <Button
            type="primary"
            onClick={() => toggleProductos(record.id, record.estado)}
          >
            {record.estado === 1 ? "Desactivar" : "Activar"}
          </Button>
        </Space>
      ),
    },
  ];
  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div
      className="responsive-container"
      style={{ width: "100%", overflowX: "auto" }}
    >
      <div style={{ marginBottom: 16, textAlign: "left" }}>
        <Input
          placeholder="Buscar por nombre"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ width: 300, marginTop: 10 }}
        />

        <Button type="primary" onClick={() => setModalVisible(true)}>
          Agregar Producto
        </Button>
      </div>

      <Table
        dataSource={productosFiltrados}
        columns={columns}
        loading={loading}
        rowKey="id"
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          onChange: (page) => fetchProductos(page),
          responsive: true,
          position: ["bottomCenter"],
          size: "small",
        }}
        size="small"
        scroll={{ x: "max-content" }}
      />

      <Modal
        title="Agregar producto"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <Form layout="vertical" form={form} onFinish={onFinish}>
          <Form.Item
            name="nombre"
            label="Nombre"
            rules={[{ required: true, message: "Ingrese un nombre" }]}
          >
            <Input placeholder="Ej: Manzana Moño Azul" />
          </Form.Item>

          <Form.Item
            name="precio"
            label="Precio"
            rules={[{ required: true, message: "Ingrese un precio" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              step={100}
              placeholder="Ej: 20000"
            />
          </Form.Item>

          <Form.Item
            name="tipoUnidadId"
            label="Unidad de medida"
            rules={[{ required: true, message: "Seleccione una unidad" }]}
          >
            <Select placeholder="Selecciona una unidad">
              <Option value={1}>KG</Option>
              <Option value={2}>Bolsa</Option>
              <Option value={3}>Unidad</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Productos;
