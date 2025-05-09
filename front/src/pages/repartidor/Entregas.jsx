import React, { useEffect, useState, useRef } from "react";
import {
  Card,
  Button,
  Spin,
  Tag,
  Empty,
  Modal,
  List,
  Divider,
  Input,
  Checkbox,
  Form,
  Alert,
  notification,
  Badge,
  InputNumber,
} from "antd";
import {
  ShoppingCartOutlined,
  CreditCardOutlined,
  FileTextOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  CalendarOutlined,
  BellOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { api } from "../../services/api";

const Entregas = () => {
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntrega, setSelectedEntrega] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [payLater, setPayLater] = useState(false);
  const [hasNewVentas, setHasNewVentas] = useState(false);
  const [form] = Form.useForm();
  const [wsConnected, setWsConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const initialized = useRef(false); // Variable para controlar la inicialización del WebSocket

  // Configurar WebSocket
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const cajaId = sessionStorage.getItem("cajaId");
    if (!cajaId) {
      console.error("No hay cajaId en sessionStorage");
      return;
    }

    // Crear conexión WebSocket
    const ws = new WebSocket(`ws://localhost:3001?cajaId=${cajaId}`);
    setSocket(ws);

    // Evento de conexión establecida
    ws.onopen = () => {
      console.log("Conexión WebSocket establecida");
      setWsConnected(true);
    };

    // Evento de error de conexión
    ws.onerror = (error) => {
      console.error("Error en la conexión WebSocket:", error);
      setWsConnected(false);
    };

    // Evento de cierre de conexión
    ws.onclose = () => {
      console.log("Conexión WebSocket cerrada");
      setWsConnected(false);
    };

    // Evento de recepción de mensaje
    ws.onmessage = (event) => {
      try {
        const mensaje = JSON.parse(event.data);
        console.log("Mensaje WebSocket recibido:", mensaje);

        // Procesamos el mensaje según su tipo
        if (mensaje.tipo === "ventas-iniciales") {
          // Si es la carga inicial de ventas, actualizamos el estado
          if (mensaje.data && mensaje.data.length > 0) {
            // Transformar los datos si es necesario para que coincidan con el formato esperado
            const nuevasVentas = mensaje.data.map((venta) => ({
              id: venta.id,
              tipo: "Venta",
              numero: venta.nroVenta,
              monto: venta.total,
              monto_pagado: venta.totalPagado,
              resto_pendiente: venta.restoPendiente,
              metodo_pago: venta.estadoPago === 1 ? null : "EFECTIVO", // Asumimos que 1 = pendiente
              negocio: { nombre: `Negocio #${venta.negocio?.nombre}` }, // Ajusta esto según tus datos
              detalles: venta.detalles.map((detalle) => ({
                cantidad: detalle.cantidad,
                precio: detalle.precio,
                subTotal: detalle.subTotal,
                producto: {
                  nombre: `Producto #${detalle.productoId}`, // Ajusta esto según tus datos
                },
              })),
            }));

            // Si estamos en la carga inicial, reemplazamos todo
            setEntregas((prevEntregas) => [...prevEntregas, ...nuevasVentas]);
          }
        } else if (mensaje.tipo === "nueva-venta") {
          // Si es una nueva venta, la agregamos a la lista y mostramos notificación
          if (mensaje.data) {
            const nuevaVenta = {
              id: mensaje.data.id,
              tipo: "Venta",
              numero: mensaje.data.nroVenta,
              monto: mensaje.data.total,
              monto_pagado: mensaje.data.totalPagado,
              resto_pendiente: mensaje.data.restoPendiente,
              metodo_pago: mensaje.data.estadoPago === 1 ? null : "EFECTIVO",
              negocio: { nombre: `Negocio #${mensaje.data.negocio?.nombre}` },
              detalles: mensaje.data.detalles.map((detalle) => ({
                cantidad: detalle.cantidad,
                precio: detalle.precio,
                subTotal: detalle.subTotal,
                producto: {
                  nombre: `Producto #${detalle.productoId}`,
                },
              })),
            };

            setEntregas((prevEntregas) => [nuevaVenta, ...prevEntregas]);
            setHasNewVentas(true);

            // Mostrar notificación
            notification.open({
              message: "Nueva venta registrada",
              description: `Se ha registrado una nueva venta #${
                nuevaVenta.numero
              } por ${formatMoney(nuevaVenta.monto)}`,
              icon: <ShoppingCartOutlined style={{ color: "#1890ff" }} />,
              placement: "topRight",
              duration: 5,
            });
          }
        }
      } catch (error) {
        console.error("Error al procesar mensaje WebSocket:", error);
      }
    };

    // Limpiar conexión al desmontar
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []); // Este efecto solo se ejecuta una vez al montar el componente

  // Cargar entregas iniciales
  useEffect(() => {
    fetchEntregas();
  }, []);

  const fetchEntregas = async () => {
    try {
      setLoading(true);
      const cajaId = sessionStorage.getItem("cajaId");
      console.log("cajaId", cajaId);
      if (!cajaId) throw new Error("No hay cajaId en sessionStorage");

      const data = await api(`api/resumenDia?cajaId=${cajaId}`, "GET");
      console.log("Resumen del día:", data);
      setEntregas(data);
      setHasNewVentas(false); // Resetear el indicador de nuevas ventas
    } catch (error) {
      console.error("Error cargando entregas:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (entrega) => {
    setSelectedEntrega(entrega);
    setDetailsModalVisible(true);
  };

  const handleCloseDetailsModal = () => {
    setDetailsModalVisible(false);
    setSelectedEntrega(null);
  };

  const handleOpenPaymentModal = (entrega) => {
    setSelectedEntrega(entrega);
    setPaymentAmount(entrega.monto.toString());
    setPayLater(false);
    setPaymentError("");
    setPaymentModalVisible(true);
  };

  const handleClosePaymentModal = () => {
    setPaymentModalVisible(false);
    form.resetFields();
  };

  const handlePayLaterChange = (e) => {
    setPayLater(e.target.checked);
    if (e.target.checked) {
      setPaymentAmount("");
    }
  };

  const handleSubmitPayment = async () => {
    try {
      setProcessingPayment(true);
      setPaymentError("");

      if (
        !payLater &&
        (!paymentAmount ||
          isNaN(parseFloat(paymentAmount)) ||
          parseFloat(paymentAmount) <= 0)
      ) {
        setPaymentError("Por favor ingrese un monto válido");
        setProcessingPayment(false);
        return;
      }

      // Aquí no llamamos a la API, solo procesamos localmente
      console.log("Procesando pago:", {
        entregaId: selectedEntrega.id,
        monto: payLater ? 0 : parseFloat(paymentAmount),
        pagoOtroDia: payLater,
      });

      // Simulamos una actualización exitosa
      const updatedEntregas = entregas.map((item) => {
        if (item.id === selectedEntrega.id) {
          return {
            ...item,
            metodo_pago: payLater ? "PENDIENTE_OTRO_DIA" : "EFECTIVO",
            monto_pagado: payLater ? 0 : parseFloat(paymentAmount),
          };
        }
        return item;
      });

      setEntregas(updatedEntregas);
      setPaymentModalVisible(false);
      setDetailsModalVisible(false);
      setSelectedEntrega(null);

      // Mensaje de éxito
      alert(
        payLater
          ? "Entrega marcada para pago en otro día"
          : "Entrega cobrada con éxito"
      );
    } catch (error) {
      console.error("Error al procesar el pago:", error);
      setPaymentError("Error al procesar el pago. Intente nuevamente.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const formatMoney = (amount) => {
    return `$${Number(amount).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-80">
        <Spin size="large" />
      </div>
    );
  }

  if (!entregas || !entregas.length) {
    return (
      <div className="flex justify-center items-center h-80">
        <Empty description="No hay entregas para mostrar" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-lg mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-700">
            Entregas Pendientes
          </h1>
          <div className="flex items-center gap-3">
            {wsConnected ? (
              <Tag color="success" icon={<CheckCircleOutlined />}>
                Conectado
              </Tag>
            ) : (
              <Tag color="error" icon={<ClockCircleOutlined />}>
                Desconectado
              </Tag>
            )}

            <Badge dot={hasNewVentas} offset={[-5, 0]}>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={fetchEntregas}
                title="Actualizar entregas"
              >
                Actualizar
              </Button>
            </Badge>
          </div>
        </div>

        <div className="space-y-4">
          {entregas.map((entrega, index) => (
            <Card
              className="shadow-md rounded-lg border-l-4 hover:shadow-lg transition-shadow"
              style={{
                borderLeftColor: entrega.metodo_pago ? "#10b981" : "#f59e0b",
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <FileTextOutlined className="text-blue-600" />
                    <span className="font-semibold">
                      {entrega.tipo} #{entrega.numero}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <ShopOutlined className="text-gray-600" />
                    <span>{entrega.negocio?.nombre || "N/A"}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CreditCardOutlined className="text-green-600" />
                    <span className="font-medium">
                      {formatMoney(entrega.monto)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {entrega.metodo_pago ? (
                    entrega.metodo_pago === "PENDIENTE_OTRO_DIA" ? (
                      <Tag icon={<CalendarOutlined />} color="processing">
                        PAGO OTRO DÍA
                      </Tag>
                    ) : (
                      <Tag icon={<CheckCircleOutlined />} color="success">
                        COBRADA
                      </Tag>
                    )
                  ) : (
                    <Tag icon={<ClockCircleOutlined />} color="warning">
                      PENDIENTE
                    </Tag>
                  )}

                  <div className="flex gap-2 mt-2">
                    <Button
                      type="default"
                      size="small"
                      onClick={() => handleViewDetails(entrega)}
                    >
                      Ver Detalles
                    </Button>

                    {!entrega.metodo_pago && (
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => handleOpenPaymentModal(entrega)}
                      >
                        Cobrar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal para mostrar los detalles */}
      <Modal
        title={
          selectedEntrega
            ? `Detalles de ${selectedEntrega.tipo} #${selectedEntrega.numero}`
            : "Detalles"
        }
        open={detailsModalVisible}
        onCancel={handleCloseDetailsModal}
        footer={[
          <Button key="back" onClick={handleCloseDetailsModal}>
            Cerrar
          </Button>,
          !selectedEntrega?.metodo_pago && (
            <Button
              key="cobrar"
              type="primary"
              onClick={() => {
                handleCloseDetailsModal();
                handleOpenPaymentModal(selectedEntrega);
              }}
            >
              Cobrar Entrega
            </Button>
          ),
        ]}
        width={600}
      >
        {selectedEntrega && (
          <div>
            <div className="flex justify-between mb-4">
              <div>
                <p>
                  <strong>Negocio:</strong>{" "}
                  {selectedEntrega.negocio?.nombre || "N/A"}
                </p>
                <p>
                  <strong>Tipo:</strong> {selectedEntrega.tipo}
                </p>
                <p>
                  <strong>Número:</strong> {selectedEntrega.numero}
                </p>
              </div>
              <div>
                <p>
                  <strong>Estado:</strong>{" "}
                  {selectedEntrega.metodo_pago === "PENDIENTE_OTRO_DIA"
                    ? "PAGO OTRO DÍA"
                    : selectedEntrega.metodo_pago
                    ? "COBRADA"
                    : "PENDIENTE"}
                </p>
                {selectedEntrega.metodo_pago &&
                  selectedEntrega.metodo_pago !== "PENDIENTE_OTRO_DIA" && (
                    <p>
                      <strong>Método de pago:</strong>{" "}
                      {selectedEntrega.metodo_pago}
                    </p>
                  )}
                <p className="text-xl font-bold text-green-600">
                  {formatMoney(selectedEntrega.monto)}
                </p>
              </div>
            </div>

            <Divider>Productos</Divider>

            <List
              dataSource={selectedEntrega.detalles || []}
              renderItem={(item) => (
                <List.Item key={item.id} className="border-b">
                  <div className="flex w-full justify-between">
                    <div className="flex-1">
                      <div className="font-medium">
                        {item.producto?.nombre || "Producto"}
                      </div>
                      <div className="text-gray-600">
                        {item.cantidad} x {formatMoney(item.precio)}
                      </div>
                    </div>
                    <div className="font-semibold">
                      {formatMoney(item.subTotal)}
                    </div>
                  </div>
                </List.Item>
              )}
              footer={
                <div className="flex justify-end mt-4">
                  <div className="text-lg font-bold">
                    Total: {formatMoney(selectedEntrega.monto)}
                  </div>
                </div>
              }
            />
          </div>
        )}
      </Modal>

      {/* Modal para procesar el pago */}
      <Modal
        title="Cobrar Entrega"
        open={paymentModalVisible}
        onCancel={handleClosePaymentModal}
        footer={[
          <Button key="back" onClick={handleClosePaymentModal}>
            Cancelar
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={processingPayment}
            onClick={handleSubmitPayment}
          >
            {payLater ? "Guardar" : "Cobrar"}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" className="mt-4">
          {paymentError && (
            <Alert
              message={paymentError}
              type="error"
              showIcon
              className="mb-4"
            />
          )}

          <Form.Item label="Monto total" className="mb-4">
            <Input
              prefix={<DollarOutlined />}
              readOnly
              value={formatMoney(selectedEntrega?.monto || 0)}
            />
          </Form.Item>

          <Form.Item label="Pagar otro día" className="mb-4">
            <Checkbox checked={payLater} onChange={handlePayLaterChange}>
              Marcar para pago en otra fecha
            </Checkbox>
          </Form.Item>

          <Form.Item
            label="Monto recibido"
            className="mb-4"
            tooltip={
              payLater
                ? "Desactive 'Pagar otro día' para ingresar un monto"
                : ""
            }
          >
            <Input
              prefix={<DollarOutlined />}
              placeholder="Ingrese el monto recibido"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              disabled={payLater}
              type="number"
              min="0"
              step="0.01"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Entregas;
