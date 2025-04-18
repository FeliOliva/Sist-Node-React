import React, { useEffect, useState } from "react";
import {
  Table,
  message,
  Modal,
  Button,
  Select,
  Input,
  Form,
  Space,
  List,
} from "antd";
import { api } from "../services/api";

const { Option } = Select;

// Hook personalizado para detectar si la pantalla es móvil
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // 768px es generalmente el breakpoint para dispositivos móviles
    };

    // Verificar al inicio
    checkScreenSize();

    // Escuchar cambios de tamaño de ventana
    window.addEventListener('resize', checkScreenSize);

    // Limpiar el listener cuando el componente se desmonta
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return isMobile;
};

const Ventas = () => {
  const isMobile = useIsMobile();
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
  const [ventaEditando, setVentaEditando] = useState(null);
  const [unidadSeleccionada, setUnidadSeleccionada] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);
  const [totalVentas, setTotalVentas] = useState(0);

  const fetchVentas = async (page = 1) => {
    try {
      setLoading(true);
      const { ventas, total } = await api(`api/ventas?page=${page}&limit=${pageSize}`);

      const clientesPromises = ventas.map((venta) =>
        api(`api/clientes/${venta.clienteId}`)
      );
      const negociosPromises = ventas.map((venta) =>
        api(`api/negocio/${venta.negocioId}`)
      );

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
      setTotalVentas(total || ventas.length);
      setCurrentPage(page);
    } catch (error) {
      message.error("Error al obtener ventas: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVentas(currentPage);
  }, [currentPage]);

  const fetchClientes = async () => {
    const res = await api("api/clientes");
    setClientes(res.clients || []);
  };

  const fetchNegocios = async (clienteId) => {
    const res = await api(`api/getAllNegociosByCliente/${clienteId}`);
    const negociosArray = Array.isArray(res.negocios) ? res.negocios : [];
    setNegocios(negociosArray);
  };
  
  const buscarProductos = async () => {
    try {
      const res = await api("api/getAllProducts");
      const productos = res.products || [];
      console.log(productos);
      // Filtrar en el frontend por coincidencia de nombre
      const filtrados = productos.filter((producto) =>
        producto.nombre.toLowerCase().includes(productoBuscado.toLowerCase())
      );

      setProductosDisponibles(filtrados);
    } catch (err) {
      message.error("Error al buscar productos: " + err.message);
    }
  };

  useEffect(() => {
    if (productoBuscado.trim().length >= 2) {
      buscarProductos();
    } else {
      setProductosDisponibles([]);
    }
  }, [productoBuscado]);

  const agregarProducto = (producto) => {
    if (!cantidad || cantidad <= 0) return;

    const yaExiste = productosSeleccionados.some((p) => p.id === producto.id);
    if (yaExiste) {
      message.warning("Este producto ya fue agregado.");
      return;
    }

    setProductosSeleccionados([
      ...productosSeleccionados,
      {
        ...producto,
        cantidad: parseInt(cantidad),
        tipoUnidad: producto.tipoUnidad?.tipo || "Unidad", // Guardar unidad
      },
    ]);

    setProductoBuscado("");
    setCantidad(1);
    setUnidadSeleccionada("");
    setProductosDisponibles([]);
  };

  const eliminarProducto = (index) => {
    const nuevos = [...productosSeleccionados];
    nuevos.splice(index, 1);
    setProductosSeleccionados(nuevos);
  };

  const total = productosSeleccionados.reduce(
    (acc, p) => acc + p.precio * p.cantidad,
    0
  );

  const obtenerProximoNumeroVenta = () => {
    const maxNro = ventas.reduce((max, v) => {
      const match = v.nroVenta?.match(/^V(\d+)$/);
      const num = match ? parseInt(match[1]) : 0;
      return num > max ? num : max;
    }, 0);
    const nuevoNumero = maxNro + 1;
    return `V${nuevoNumero.toString().padStart(5, "0")}`;
  };

  const guardarVenta = async () => {
    if (
      !selectedCliente ||
      !selectedNegocio ||
      productosSeleccionados.length === 0
    ) {
      message.warning("Debe completar todos los campos");
      return;
    }

    setIsSaving(true);

    try {
      const nroVenta = ventaEditando
        ? ventaEditando.nroVenta
        : obtenerProximoNumeroVenta();

      const detalles = productosSeleccionados.map((producto) => ({
        precio: producto.precio,
        cantidad: producto.cantidad,
        productoId: parseInt(producto.id),
      }));

      const ventaData = {
        id: ventaEditando?.id, // solo si estás editando
        nroVenta,
        clienteId: parseInt(selectedCliente),
        negocioId: parseInt(selectedNegocio),
        cajaId: 1,
        rol_usuario: 0,
        detalles,
      };

      await api("api/ventas", "POST", ventaData);

      message.success(
        ventaEditando ? "Venta editada con éxito" : "Venta guardada con éxito"
      );
      alert(
        ventaEditando
          ? "¡Venta editada exitosamente!"
          : "¡Venta guardada exitosamente!"
      );
      window.location.reload();
    } catch (err) {
      message.error("Error al guardar venta: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const editarVenta = async (venta) => {
    try {
      await fetchClientes(); // para mostrar todos los clientes

      const cliente = await api(`api/clientes/${venta.clienteId}`);
      const negocios = await api(`api/negocio/${venta.clienteId}`);
      setSelectedCliente(venta.clienteId);
      setSelectedNegocio(venta.negocioId);
      setNegocios(
        Array.isArray(negocios.negocio) ? negocios.negocio : [negocios]
      );

      // 1. Obtener detalles de productos
      const detalles = venta.detalles || [];

      // 2. Pedir la info de cada producto por su id
      const productosInfo = await Promise.all(
        detalles.map(async (detalle) => {
          const producto = await api(`api/products/${detalle.productoId}`);
          return {
            ...producto,
            cantidad: detalle.cantidad,
            precio: detalle.precio,
          };
        })
      );

      // 3. Setear productos seleccionados
      setProductosSeleccionados(productosInfo);

      // Guardar la venta que se está editando
      setVentaEditando(venta);
      setModalVisible(true);

      // Agregar cliente a la lista si no está
      const yaExiste = clientes.some((c) => c.id === cliente.id);
      if (!yaExiste) {
        setClientes((prev) => [...prev, cliente]);
      }
    } catch (error) {
      message.error("Error al cargar los datos de la venta: " + error.message);
    }
  };

  const eliminarVenta = async (id) => {
    try {
      await api(`api/ventas/${id}`, "DELETE");
      message.success("Venta eliminada correctamente");
      setVentas((prev) => prev.filter((venta) => venta.id !== id)); // actualiza el estado local
    } catch (error) {
      message.error("Error al eliminar la venta: " + error.message);
    }
  };

  const columns = [
    {
      title: "Nro. Venta",
      dataIndex: "nroVenta",
      key: "nroVenta"
    },
    {
      title: "Nombre",
      dataIndex: "nombre",
      key: "nombre"
    },
    {
      title: "Apellido",
      dataIndex: "apellido",
      key: "apellido",
      responsive: ["sm"] // Solo visible en pantallas sm y superiores
    },
    {
      title: "Negocio",
      dataIndex: "negocioNombre",
      key: "negocioNombre",
      responsive: ["sm"] // Solo visible en pantallas sm y superiores
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total"
    },
    {
      title: "Fecha",
      dataIndex: "fechaCreacion",
      key: "fechaCreacion",
      responsive: ["md"] // Solo visible en pantallas md y superiores
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (text, record) => (
        <Space size="small">
          <Button size={isMobile ? "small" : "middle"} onClick={() => editarVenta(record)}>Editar</Button>
          <Button
            size={isMobile ? "small" : "middle"}
            danger
            onClick={() => {
              Modal.confirm({
                title: "¿Estás seguro?",
                content: "Esta acción eliminará la venta permanentemente.",
                okText: "Sí, eliminar",
                okType: "danger",
                cancelText: "Cancelar",
                onOk: () => eliminarVenta(record.id),
              });
            }}
          >
            Eliminar
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="responsive-container" style={{ width: "100%", overflowX: "auto" }}>
      <Button
        type="primary"
        onClick={() => {
          fetchClientes();
          setModalVisible(true);
        }}
      >
        Registrar Venta
      </Button>

      <Table
        dataSource={ventas}
        columns={columns}
        loading={loading}
        rowKey="id"
        style={{ marginTop: 20 }}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalVentas,
          onChange: (page) => setCurrentPage(page),
          position: ["bottomCenter"],
          size: isMobile ? "small" : "default",
          responsive: true,
        }}
        size={isMobile ? "small" : "default"}
        scroll={{ x: "max-content" }}
      />

      <Modal
        title="Nueva Venta"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setVentaEditando(null);
          setProductosSeleccionados([]);
          setSelectedCliente(null);
          setSelectedNegocio(null);
        }}
        footer={[
          <Button key="cancelar" onClick={() => setModalVisible(false)}>
            Cancelar
          </Button>,
          <Button
            key="guardar"
            type="primary"
            onClick={guardarVenta}
            loading={isSaving}
          >
            Guardar Venta
          </Button>,
        ]}
        width={isMobile ? "95%" : "700px"}
        style={{ maxWidth: "700px" }}
      >
        <Form layout="vertical">
          <Form.Item label="Cliente">
            <Select
              placeholder="Seleccionar cliente"
              value={selectedCliente}
              onChange={(val) => {
                setSelectedCliente(val);
                setSelectedNegocio(null);
                fetchNegocios(val);
              }}
            >
              {clientes.map((client) => (
                <Option key={client.id} value={client.id}>
                  {client.nombre} {client.apellido}
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
                  onClick={() => {
                    setUnidadSeleccionada(item.tipoUnidad?.tipo || "Unidad");
                    agregarProducto(item);
                  }}
                >
                  {item.nombre} ({item.tipoUnidad?.tipo || "Unidad"}) - ${item.precio}
                </List.Item>
              )}
              style={{ maxHeight: 150, overflowY: "auto", marginTop: 8 }}
              size={isMobile ? "small" : "default"}
            />
          </Form.Item>

          <Form.Item label="Productos Seleccionados">
            <List
              bordered
              dataSource={productosSeleccionados}
              renderItem={(item, index) => (
                <List.Item
                  actions={[
                    <Button
                      danger
                      onClick={() => eliminarProducto(index)}
                      size={isMobile ? "small" : "middle"}
                    >
                      Eliminar
                    </Button>,
                  ]}
                >
                  {item.nombre} ({item.tipoUnidad || "Unidad"}) x {item.cantidad} = ${item.precio * item.cantidad}
                </List.Item>
              )}
              size={isMobile ? "small" : "default"}
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