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
  Drawer,
  Card,
  Badge,
  Divider,
  Avatar,
  Empty,
  Tag,
  InputNumber,
  Row,
  Col,
} from "antd";
import { api } from "../services/api";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ShoppingCartOutlined,
  SearchOutlined,
  PlusOutlined,
  MinusOutlined,
  ShopOutlined,
  UserOutlined,
  PrinterOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";


const { Option } = Select;

// Hook personalizado para detectar si la pantalla es móvil
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return isMobile;
};

const generarPDF = async (record) => {
  try {
    const venta = await api(`api/ventas/${record.id}`);
    const cliente = await api(`api/clientes/${venta.clienteId}`);

    const detalleHTML = document.createElement("div");
    detalleHTML.style.padding = "20px";
    detalleHTML.style.fontSize = "30px";
    detalleHTML.innerHTML = `
      <h2>Detalle de Venta</h2>
      <p><strong>Nro Venta:</strong> ${venta.nroVenta}</p>
      <p><strong>Cliente:</strong> ${cliente?.nombre} ${cliente?.apellido}</p>
      <p><strong>Negocio:</strong> ${record.negocioNombre}</p>
      <p><strong>Total:</strong> $${venta.total.toLocaleString("es-AR")}</p>
      <p><strong>Fecha:</strong> ${dayjs(venta.fechaCreacion).format("DD/MM/YYYY")}</p>
      <p><strong>Productos:</strong></p>
      <ul>
        ${venta.detalles
          .map(
            (d) =>
              `<li>${d.producto?.nombre || "Producto"} - ${d.cantidad} u. x $${d.precio.toLocaleString(
                "es-AR"
              )} = $${(d.precio * d.cantidad).toLocaleString("es-AR")}</li>`
          )
          .join("")}
      </ul>
    `;

    document.body.appendChild(detalleHTML);

    const canvas = await html2canvas(detalleHTML, {
      scale: 2, // Mejorar calidad de la imagen
      width: 800, // Ancho máximo
      height: 1200, // Alto máximo
    });

    const imgData = canvas.toDataURL("image/png");

    // Crear el PDF con el tamaño A4
    const pdf = new jsPDF("p", "pt", "a4");

    // Ajustar imagen al tamaño A4
    const pdfWidth = 595.28; // Ancho A4 en puntos
    const pdfHeight = 841.89; // Alto A4 en puntos

    const imgProps = pdf.getImageProperties(imgData);
    const aspectRatio = imgProps.width / imgProps.height;

    // Escalar la imagen para ajustarse a la página A4
    let scaledWidth = pdfWidth;
    let scaledHeight = pdfWidth / aspectRatio;

    // Si la altura escalada excede el tamaño A4, ajustamos la altura
    if (scaledHeight > pdfHeight) {
      scaledHeight = pdfHeight;
      scaledWidth = pdfHeight * aspectRatio;
    }

    // Calcular la posición para centrar la imagen
    const marginX = (pdfWidth - scaledWidth) / 2;
    const marginY = (pdfHeight - scaledHeight) / 2;

    // Agregar la imagen centrada
    pdf.addImage(imgData, "PNG", marginX, marginY, scaledWidth, scaledHeight);

    // Guardar el PDF
    pdf.save(`venta-${venta.nroVenta}.pdf`);

    document.body.removeChild(detalleHTML);
  } catch (error) {
    message.error("Error al generar el PDF: " + error.message);
  }
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
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Estados para mostrar detalles de venta
  const [detalleModalVisible, setDetalleModalVisible] = useState(false);
  const [detalleVenta, setDetalleVenta] = useState(null);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState(null);

  // Estado para controlar si mostrar la lista de productos
  const [showProductList, setShowProductList] = useState(false);

  // Resto de funciones sin cambios...
  const fetchVentas = async (page = 1) => {
    try {
      setLoading(true);
      const { ventas, total } = await api(
        `api/ventas?page=${page}&limit=${pageSize}`
      );

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
      setLoadingProducts(true);
      const res = await api("api/getAllProducts");
      const productos = res.products || [];
      // Filtrar en el frontend por coincidencia de nombre
      const filtrados = productos.filter((producto) =>
        producto.nombre.toLowerCase().includes(productoBuscado.toLowerCase())
      );

      setProductosDisponibles(filtrados);
      setShowProductList(filtrados.length > 0);
    } catch (err) {
      message.error("Error al buscar productos: " + err.message);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (productoBuscado.trim().length >= 2) {
      buscarProductos();
    } else {
      setProductosDisponibles([]);
      setShowProductList(false);
    }
  }, [productoBuscado]);

  const agregarProducto = (producto) => {
    if (!cantidad || cantidad <= 0) {
      message.warning("La cantidad debe ser mayor a 0");
      return;
    }

    const yaExiste = productosSeleccionados.some((p) => p.id === producto.id);
    if (yaExiste) {
      // Actualizar la cantidad si ya existe
      const nuevos = productosSeleccionados.map((p) =>
        p.id === producto.id
          ? { ...p, cantidad: p.cantidad + parseInt(cantidad) }
          : p
      );
      setProductosSeleccionados(nuevos);
      message.success(`Se actualizó la cantidad de ${producto.nombre}`);
    } else {
      setProductosSeleccionados([
        ...productosSeleccionados,
        {
          ...producto,
          cantidad: parseInt(cantidad),
          tipoUnidad: producto.tipoUnidad?.tipo || "Unidad",
        },
      ]);
      message.success(`${producto.nombre} agregado al carrito`);
    }

    setProductoBuscado("");
    setCantidad(1);
    setUnidadSeleccionada("");
    setProductosDisponibles([]);
    setShowProductList(false);
  };

  const modificarCantidad = (index, incremento) => {
    const nuevos = [...productosSeleccionados];
    const nuevaCantidad = nuevos[index].cantidad + incremento;

    if (nuevaCantidad <= 0) {
      eliminarProducto(index);
      return;
    }

    nuevos[index].cantidad = nuevaCantidad;
    setProductosSeleccionados(nuevos);
  };

  const actualizarCantidad = (index, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarProducto(index);
      return;
    }

    const nuevos = [...productosSeleccionados];
    nuevos[index].cantidad = nuevaCantidad;
    setProductosSeleccionados(nuevos);
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
      const cajaId = parseInt(sessionStorage.getItem("cajaId"));
      const rolUsuario = parseInt(sessionStorage.getItem("rol"));
      const ventaData = {
        id: ventaEditando?.id,
        nroVenta,
        clienteId: parseInt(selectedCliente),
        negocioId: parseInt(selectedNegocio),
        cajaId: cajaId,
        rol_usuario: rolUsuario,
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
      await fetchClientes();

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
      setVentas((prev) => prev.filter((venta) => venta.id !== id));
    } catch (error) {
      message.error("Error al eliminar la venta: " + error.message);
    }
  };

  // Ver detalle de venta
  const handleVerDetalle = async (record) => {
    try {
      const venta = await api(`api/ventas/${record.id}`);
      const cliente = await api(`api/clientes/${venta.clienteId}`);

      setDetalleVenta(venta);
      setModalTitle("Detalle de Venta");
      setModalContent(
        <div className="text-sm">
          <p>
            <strong>Nro Venta:</strong> {venta.nroVenta}
          </p>
          <p>
            <strong>Cliente:</strong> {cliente?.nombre} {cliente?.apellido}
          </p>
          <p>
            <strong>Negocio:</strong> {record.negocioNombre}
          </p>
          <p>
            <strong>Total:</strong> ${venta.total.toLocaleString("es-AR")}
          </p>
          <p>
            <strong>Fecha:</strong>{" "}
            {dayjs(venta.fechaCreacion).format("DD/MM/YYYY")}
          </p>
          <p>
            <strong>Productos:</strong>
          </p>
          <ul className="list-disc pl-5">
            {venta.detalles.map((d) => (
              <li key={d.id} className="mb-1">
                {d.producto?.nombre || "Producto"} - {d.cantidad} u. x $
                {d.precio.toLocaleString("es-AR")} = $
                {(d.precio * d.cantidad).toLocaleString("es-AR")}
              </li>
            ))}
          </ul>
        </div>
      );

      setDetalleModalVisible(true);
    } catch (error) {
      message.error(
        "Error al cargar los detalles de la venta: " + error.message
      );
    }
  };

  const columns = [
    {
      title: "Nro. Venta",
      dataIndex: "nroVenta",
      key: "nroVenta",
    },
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
      title: "Negocio",
      dataIndex: "negocioNombre",
      key: "negocioNombre",
      responsive: ["sm"],
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (total) => `$${total.toLocaleString("es-AR")}`,
    },
    {
      title: "Fecha",
      dataIndex: "fechaCreacion",
      key: "fechaCreacion",
      responsive: ["md"],
      render: (fecha) => dayjs(fecha).format("DD/MM/YYYY"),
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (text, record) => (
        <Space size="small">
          <Button
            size={isMobile ? "small" : "middle"}
            icon={<EyeOutlined />}
            onClick={() => handleVerDetalle(record)}
          >
            {!isMobile && "Ver"}
          </Button>
          <Button
            size={isMobile ? "small" : "middle"}
            icon={<EditOutlined />}
            onClick={() => editarVenta(record)}
          >
            {!isMobile && "Editar"}
          </Button>
          <Button
            size={isMobile ? "small" : "middle"}
            danger
            icon={<DeleteOutlined />}
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
            {!isMobile && "Eliminar"}
          </Button>
          <Button
            size={isMobile ? "small" : "middle"}
            icon={<PrinterOutlined />}
            onClick={() => generarPDF(record)}
          >
            {!isMobile && "Imprimir"}
          </Button>
        </Space>
      ),
    }
  ];    

  // Renderizado de cada producto en la lista de búsqueda
  const renderProductItem = (item) => (
    <List.Item
      key={item.id}
      style={{ cursor: "pointer", padding: "8px 12px" }}
      onClick={() => {
        setUnidadSeleccionada(item.tipoUnidad?.tipo || "Unidad");
        agregarProducto(item);
      }}
    >
      <List.Item.Meta
        avatar={
          <Avatar
            icon={<ShoppingCartOutlined />}
            style={{ backgroundColor: "#1890ff" }}
          />
        }
        title={item.nombre}
        description={
          <Space>
            <Tag color="blue">{item.tipoUnidad?.tipo || "Unidad"}</Tag>
            <Tag color="green">${item.precio.toLocaleString("es-AR")}</Tag>
          </Space>
        }
      />
      <Button type="primary" size="small" icon={<PlusOutlined />}>
        Agregar
      </Button>
    </List.Item>
  );

  // Renderizado de cada producto en el carrito
  const renderCartItem = (item, index) => (
    <List.Item key={item.id} style={{ padding: "12px" }}>
      <div style={{ width: "100%" }}>
        <div
          style={{
            fontWeight: "bold",
            marginBottom: "6px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ wordBreak: "break-word" }}>{item.nombre}</div>
          <Button
            danger
            size="small"
            onClick={() => eliminarProducto(index)}
            icon={<DeleteOutlined />}
          >
            Eliminar
          </Button>
        </div>

        <div style={{ color: "#666", marginBottom: "6px" }}>
          {item.tipoUnidad || "Unidad"} - ${item.precio.toLocaleString("es-AR")}{" "}
          c/u
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <Button
              size="small"
              icon={<MinusOutlined />}
              onClick={() => modificarCantidad(index, -1)}
            />
            <InputNumber
              min={1}
              value={item.cantidad}
              onChange={(value) => actualizarCantidad(index, value)}
              size="small"
              style={{ width: "60px", margin: "0 4px" }}
            />
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={() => modificarCantidad(index, 1)}
            />
          </div>
          <div style={{ fontWeight: "bold", color: "#1890ff" }}>
            ${(item.precio * item.cantidad).toLocaleString("es-AR")}
          </div>
        </div>
      </div>
    </List.Item>
  );

  return (
    <div
      className="responsive-container"
      style={{ width: "100%", overflowX: "auto" }}
    >
      <Button
        type="primary"
        onClick={() => {
          fetchClientes();
          setModalVisible(true);
        }}
        icon={<PlusOutlined />}
        style={{ marginBottom: 20 }}
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

      {/* Modal para crear/editar venta con estética mejorada y adaptada para móvil */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <ShoppingCartOutlined
              style={{ fontSize: 20, marginRight: 8, color: "#1890ff" }}
            />
            <span>{ventaEditando ? "Editar Venta" : "Nueva Venta"}</span>
          </div>
        }
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
            icon={<ShoppingCartOutlined />}
          >
            {ventaEditando ? "Actualizar" : "Finalizar"}
          </Button>,
        ]}
        width={isMobile ? "95%" : "800px"}
        style={{ maxWidth: "800px", top: isMobile ? 20 : 100 }}
        bodyStyle={{
          padding: "12px",
          maxHeight: isMobile ? "80vh" : "auto",
          overflowY: "auto",
        }}
      >
        <Form layout="vertical">
          {/* Sección de Datos del Cliente */}
          <div
            style={{
              background: "#f5f5f5",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "12px",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: "12px",
                fontSize: isMobile ? 16 : 18,
                display: "flex",
                alignItems: "center",
              }}
            >
              <UserOutlined style={{ marginRight: 8 }} />
              Datos del Cliente
            </h3>

            <Form.Item label="Cliente" style={{ marginBottom: 12 }}>
              <Select
                placeholder="Seleccionar cliente"
                value={selectedCliente}
                onChange={(val) => {
                  setSelectedCliente(val);
                  setSelectedNegocio(null);
                  fetchNegocios(val);
                }}
                style={{ width: "100%" }}
                size={isMobile ? "middle" : "large"}
                showSearch
                optionFilterProp="children"
              >
                {clientes.map((client) => (
                  <Option key={client.id} value={client.id}>
                    {client.nombre} {client.apellido}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Negocio" style={{ marginBottom: 0 }}>
              <Select
                placeholder="Seleccionar negocio"
                value={selectedNegocio}
                onChange={(val) => setSelectedNegocio(val)}
                disabled={!negocios.length}
                style={{ width: "100%" }}
                size={isMobile ? "middle" : "large"}
                suffixIcon={<ShopOutlined />}
              >
                {negocios.map((negocio) => (
                  <Option key={negocio.id} value={negocio.id}>
                    {negocio.nombre}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          {/* Sección de Agregar Productos */}
          <div
            style={{
              background: "#f6f9ff",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "12px",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: "12px",
                fontSize: isMobile ? 16 : 18,
                display: "flex",
                alignItems: "center",
              }}
            >
              <ShoppingCartOutlined style={{ marginRight: 8 }} />
              Agregar Productos
            </h3>

            <Form.Item
              label="Buscar y Agregar Productos"
              style={{ marginBottom: 8 }}
            >
              <Row gutter={[8, 8]}>
                <Col span={isMobile ? 16 : 18}>
                  <Input
                    placeholder="Buscar producto"
                    value={productoBuscado}
                    onChange={(e) => setProductoBuscado(e.target.value)}
                    prefix={<SearchOutlined style={{ color: "#1890ff" }} />}
                    style={{ width: "100%" }}
                    size={isMobile ? "middle" : "large"}
                  />
                </Col>
                <Col span={isMobile ? 8 : 6}>
                  <InputNumber
                    min={1}
                    value={cantidad}
                    onChange={(value) => setCantidad(value)}
                    addonBefore="Cant."
                    style={{ width: "100%" }}
                    size={isMobile ? "middle" : "large"}
                  />
                </Col>
              </Row>

              {showProductList && (
                <Card
                  size="small"
                  style={{
                    marginTop: 8,
                    maxHeight: 200,
                    overflow: "auto",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                  bodyStyle={{ padding: 0 }}
                >
                  <List
                    dataSource={productosDisponibles}
                    renderItem={renderProductItem}
                    loading={loadingProducts}
                    locale={{
                      emptyText: (
                        <Empty description="No se encontraron productos" />
                      ),
                    }}
                    size="small"
                  />
                </Card>
              )}
            </Form.Item>
          </div>

          {/* Sección de Carrito de Productos */}
          <div
            style={{
              background: "#f7f7f7",
              padding: "12px",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: isMobile ? 16 : 18,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <ShoppingCartOutlined style={{ marginRight: 8 }} />
                Carrito de Productos
              </h3>
              <Badge
                count={productosSeleccionados.length}
                style={{
                  backgroundColor: productosSeleccionados.length
                    ? "#1890ff"
                    : "#d9d9d9",
                }}
              />
            </div>

            {productosSeleccionados.length > 0 ? (
              <>
                <Card
                  size="small"
                  style={{
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    maxHeight: isMobile ? 250 : 300,
                    overflow: "auto",
                  }}
                  bodyStyle={{ padding: 0 }}
                >
                  <List
                    dataSource={productosSeleccionados}
                    renderItem={renderCartItem}
                    size="small"
                  />
                </Card>

                <Divider style={{ margin: "12px 0 8px 0" }} />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    background: "#e6f7ff",
                    padding: "10px",
                    borderRadius: "6px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: "bold",
                      color: "#1890ff",
                    }}
                  >
                    Total: ${total.toLocaleString("es-AR")}
                  </div>
                </div>
              </>
            ) : (
              <Empty
                description="No hay productos en el carrito"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </div>
        </Form>
      </Modal>

      {/* Modal o Drawer para ver detalles (sin cambios) */}
      {!isMobile ? (
        <Modal
          open={detalleModalVisible}
          onCancel={() => setDetalleModalVisible(false)}
          footer={null}
          title={modalTitle}
          width={600}
        >
          {modalContent}
        </Modal>
      ) : (
        <Drawer
          open={detalleModalVisible}
          onClose={() => setDetalleModalVisible(false)}
          title={modalTitle}
          placement="bottom"
          height="70%"
        >
          {modalContent}
        </Drawer>
      )}
    </div>
  );
};

export default Ventas;
