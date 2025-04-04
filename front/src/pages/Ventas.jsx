import React, { useEffect, useState } from "react";
import { Table, message, Modal, Button, Select, Input, Form, Space, List, Popconfirm } from "antd";
import { api } from "../services/api";

const { Option } = Select;

const Ventas = () => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [negocios, setNegocios] = useState([]);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [selectedNegocio, setSelectedNegocio] = useState(null);
  const [productoBuscado, setProductoBuscado] = useState("");
  const [cantidad, setCantidad] = useState(1);

  const [isSaving, setIsSaving] = useState(false);
  const [lastVentaNumber, setLastVentaNumber] = useState(100); // Suponemos que arranca en 100, luego se puede cargar desde backend.

  useEffect(() => {
    const fetchVentas = async () => {
      try {
        setLoading(true);
        const { ventas } = await api("api/ventas?page=1&limit=3");

        const clientesPromises = ventas.map((venta) => api(`api/clientes/${venta.clienteId}`));
        const negociosPromises = ventas.map((venta) => api(`api/negocio/${venta.negocioId}`));

        const [clientes, negocios] = await Promise.all([
          Promise.all(clientesPromises),
          Promise.all(negociosPromises),
        ]);

        const ventasConNombres = ventas.map((venta, index) => ({
          ...venta,
          nombre: clientes[index]?.nombre || "Desconocido",
          apellido: clientes[index]?.apellido || "Desconocido",
          negocioNombre: negocios[index]?.nombre || "Desconocido",
        }));

        setVentas(ventasConNombres);
      } catch (error) {
        message.error("Error al obtener los datos: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVentas();
  }, []);

  const fetchClientes = async () => {
    const res = await api("api/clientes")
    console.log(res);
    setClientes(res.clients || []);
  };

  const fetchNegocios = async (clienteId) => {
    const res = await api(`api/negocio/${clienteId}`);
    console.log("Negocios desde API:", res);
  
    const negociosArray = Array.isArray(res.negocio)
      ? res.negocio
      : [res]; // si ya es el negocio directamente
  
    setNegocios(negociosArray);
  };
  

  const buscarProductos = async () => {
    if (productoBuscado.length < 2) return;
    const res = await api("api/products?nombre=" + productoBuscado);
    setProductosDisponibles(res.products || []);
  };
  
  const agregarProducto = (producto) => {
    if (!cantidad || cantidad <= 0) return;
    setProductosSeleccionados([
      ...productosSeleccionados,
      {
        ...producto,
        cantidad: parseInt(cantidad),
      },
    ]);
    setProductoBuscado("");
    setCantidad(1);
    setProductosDisponibles([]);
  };

  const eliminarProducto = (index) => {
    const nuevos = [...productosSeleccionados];
    nuevos.splice(index, 1);
    setProductosSeleccionados(nuevos);
  };

  const total = productosSeleccionados.reduce((acc, p) => acc + p.precio * p.cantidad, 0);

  const guardarVenta = async () => {
    if (!selectedCliente || !selectedNegocio || productosSeleccionados.length === 0) {
      message.warning("Debe seleccionar cliente, negocio y al menos un producto");
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No se encontró el token");

      const nuevoNumeroVenta = lastVentaNumber + 1;
      const nroVenta = `V${nuevoNumeroVenta.toString().padStart(5, "0")}`;

      const detalles = productosSeleccionados.map((producto) => ({
        precio: producto.precio,
        cantidad: producto.cantidad,
        productoId: parseInt(producto.id),
      }));

      const ventaData = {
        nroVenta,
        clienteId: parseInt(selectedCliente),
        negocioId: parseInt(selectedNegocio),
        cajaId: 1,
        rol_usuario: 0,
        detalles,
      };

      const response = await fetch(`/api/ventas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ventaData),
      });

      if (!response.ok) throw new Error("Error al guardar");

      message.success("Venta guardada con éxito");
      setLastVentaNumber(nuevoNumeroVenta);
      setModalVisible(false);
      setProductosSeleccionados([]);
    } catch (err) {
      message.error("Error al guardar la venta: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const columns = [
    { title: "Nro. Venta", dataIndex: "nroVenta", key: "nroVenta" },
    { title: "Nombre", dataIndex: "nombre", key: "nombre" },
    { title: "Apellido", dataIndex: "apellido", key: "apellido" },
    { title: "Negocio", dataIndex: "negocioNombre", key: "negocioNombre" },
    { title: "Total", dataIndex: "total", key: "total" },
    { title: "Fecha", dataIndex: "fechaCreacion", key: "fechaCreacion" },
  ];

  return (
    <div>
      <Button type="primary" onClick={() => {
        fetchClientes();
        setModalVisible(true);
      }}>Registrar Venta</Button>

      <Table dataSource={ventas} columns={columns} loading={loading} rowKey="id" style={{ marginTop: 20 }} />

      <Modal
        title="Nueva Venta"
        open={modalVisible}
        onCancel={() => {
          if (productosSeleccionados.length > 0) {
            Modal.confirm({
              title: "¿Cancelar esta venta?",
              content: "Se perderán los datos ingresados.",
              onOk: () => setModalVisible(false),
            });
          } else {
            setModalVisible(false);
          }
        }}
        footer={[
          <Button key="cancelar" onClick={() => {
            if (productosSeleccionados.length > 0) {
              Modal.confirm({
                title: "¿Cancelar esta venta?",
                content: "Se perderán los datos ingresados.",
                onOk: () => setModalVisible(false),
              });
            } else {
              setModalVisible(false);
            }
          }}>Cancelar</Button>,
          <Button key="guardar" type="primary" onClick={guardarVenta} loading={isSaving}>
            Guardar Venta
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="Cliente">
            <Select
              placeholder="Seleccionar cliente"
              onChange={(val) => {
                setSelectedCliente(val);
                setSelectedNegocio(null);
                fetchNegocios(val);
              }}
            >
              {clientes.map((clients) => (
                <Option key={clients.id} value={clients.id}>
                  {clients.nombre} {clients.apellido}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Negocio">
            <Select
              placeholder="Seleccionar negocio"
              value={selectedNegocio}
              onChange={(val) => setSelectedNegocio(val)}
              disabled={!negocios.length}
            >
              {negocios.map((negocio) => (
                <Option key={negocio.id} value={negocio.id}>
                  {negocio.nombre}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Buscar Producto">
            <Space.Compact style={{ width: "100%" }}>
              <Input
                placeholder="Buscar producto"
                value={productoBuscado}
                onChange={(e) => setProductoBuscado(e.target.value)}
                onPressEnter={buscarProductos}
              />
              <Input
                type="number"
                min={1}
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                style={{ width: 100 }}
              />
            </Space.Compact>
            <List
              bordered
              dataSource={productosDisponibles}
              renderItem={(item) => (
                <List.Item
                  style={{ cursor: "pointer" }}
                  onClick={() => agregarProducto(item)}
                >
                  {item.nombre} - ${item.precio}
                </List.Item>
              )}
              style={{ maxHeight: 150, overflowY: "auto", marginTop: 8 }}
            />
          </Form.Item>

          <Form.Item label="Productos Seleccionados">
            <List
              bordered
              dataSource={productosSeleccionados}
              renderItem={(item, index) => (
                <List.Item
                  actions={[
                    <Button danger onClick={() => eliminarProducto(index)} size="small">
                      Eliminar
                    </Button>
                  ]}
                >
                  {item.nombre} x {item.cantidad} = ${item.precio * item.cantidad}
                </List.Item>
              )}
            />
            <div style={{ marginTop: 10, fontWeight: "bold" }}>
              Total: ${total.toFixed(2)}
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Ventas;
