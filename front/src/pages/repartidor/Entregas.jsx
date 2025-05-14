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
  Select,
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
  BankOutlined,
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
  const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
  const [form] = Form.useForm();
  const [wsConnected, setWsConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const [metodoPagos, setMetodoPagos] = useState([
    { id: 1, nombre: "EFECTIVO" },
    { id: 2, nombre: "TRANSFERENCIA/QR" },
    { id: 3, nombre: "TARJETA DEBITO" },
    { id: 4, nombre: "TARJETA CREDITO" },
  ]);
  const initialized = useRef(false);

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
            // Transformar los datos para que coincidan con el formato esperado
            const nuevasVentas = mensaje.data.map((venta) => ({
              id: venta.id,
              tipo: "Venta",
              numero: venta.nroVenta,
              monto: venta.total,
              monto_pagado: venta.totalPagado,
              resto_pendiente: venta.restoPendiente,
              metodo_pago: venta.estadoPago === 1 ? null : "EFECTIVO", // 1 = pendiente
              estado: venta.estadoPago,
              negocio: {
                id: venta.negocio?.id || venta.negocioId,
                nombre: venta.negocio?.nombre || `Negocio #${venta.negocioId}`,
              },
              detalles: venta.detalles.map((detalle) => ({
                id: detalle.id,
                cantidad: detalle.cantidad,
                precio: detalle.precio,
                subTotal: detalle.subTotal,
                producto: {
                  id: detalle.productoId,
                  nombre: `Producto #${detalle.productoId}`,
                },
              })),
            }));

            // Actualizamos la lista de entregas con los datos del WebSocket
            setEntregas(nuevasVentas);
            // Cambiamos el estado de carga
            setLoading(false);
          } else {
            // Si no hay ventas iniciales, simplemente quitamos el estado de carga
            setLoading(false);
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
              estado: mensaje.data.estadoPago,
              negocio: {
                id: mensaje.data.negocio?.id || mensaje.data.negocioId,
                nombre:
                  mensaje.data.negocio?.nombre ||
                  `Negocio #${mensaje.data.negocioId}`,
              },
              detalles: mensaje.data.detalles.map((detalle) => ({
                id: detalle.id,
                cantidad: detalle.cantidad,
                precio: detalle.precio,
                subTotal: detalle.subTotal,
                producto: {
                  id: detalle.productoId,
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
        } else if (mensaje.tipo === "venta-eliminada") {
          const idEliminado = mensaje.data?.id;
          if (idEliminado) {
            setEntregas((prevEntregas) =>
              prevEntregas.filter(
                (venta) => venta.id.toString() !== idEliminado.toString()
              )
            );

            notification.warning({
              message: "Venta eliminada",
              description: `Se ha eliminado la venta con ID #${idEliminado}`,
              icon: <ReloadOutlined style={{ color: "#faad14" }} />,
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
    setPaymentMethod("EFECTIVO");
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

      const cajaId = sessionStorage.getItem("cajaId");
      if (!cajaId) {
        setPaymentError("No se encontró el ID de la caja activa");
        setProcessingPayment(false);
        return;
      }

      // Obtener el ID del método de pago
      const selectedMethodId =
        metodoPagos.find((metodo) => metodo.nombre === paymentMethod)?.id || 1;

      // Crear el objeto de datos para la API
      const paymentData = {
        monto: payLater ? 0 : parseFloat(paymentAmount),
        metodoPagoId: payLater ? null : selectedMethodId,
        cajaId: parseInt(cajaId),
        negocioId: selectedEntrega.negocio?.id || 1,
        ventaId: selectedEntrega.id,
        pagoOtroDia: payLater,
      };

      console.log("Enviando datos de pago:", paymentData);

      // Llamar a la API para registrar la entrega
      const response = await api(
        "api/entregas",
        "POST",
        JSON.stringify(paymentData)
      );
      console.log("Respuesta de la API:", response);

      // Actualizar la lista de entregas
      const updatedEntregas = entregas.map((item) => {
        if (item.id === selectedEntrega.id) {
          return {
            ...item,
            metodo_pago: payLater ? "PENDIENTE_OTRO_DIA" : paymentMethod,
            estado: payLater ? 3 : 2, // 3 = PAGO OTRO DÍA, 2 = COBRADA
            monto_pagado: payLater ? 0 : parseFloat(paymentAmount),
            resto_pendiente: payLater
              ? item.monto
              : Math.max(0, item.monto - parseFloat(paymentAmount)),
          };
        }
        return item;
      });

      setEntregas(updatedEntregas);
      setPaymentModalVisible(false);
      setDetailsModalVisible(false);
      setSelectedEntrega(null);

      // Mensaje de éxito
      notification.success({
        message: payLater ? "Pago aplazado" : "Pago procesado",
        description: payLater
          ? "Entrega marcada para pago en otro día"
          : `Entrega cobrada con éxito por ${formatMoney(
              parseFloat(paymentAmount)
            )}`,
        icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
      });
    } catch (error) {
      console.error("Error al procesar el pago:", error);
      setPaymentError("Error al procesar el pago. Intente nuevamente.");
    } finally {
      setProcessingPayment(false);
      // Comentamos el reload para que no se recargue la página y perder el estado
      // location.reload();
    }
  };

  const formatMoney = (amount) => {
    return `$${Number(amount).toLocaleString()}`;
  };

  // Renderizado condicional basado en estado de carga
  if (loading) {
    return (
      <div className="flex justify-center items-center h-80">
        <Spin size="large" />
      </div>
    );
  }

  // Verificar si hay entregas para mostrar
  if (!entregas || entregas.length === 0) {
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
            {hasNewVentas && (
              <Badge count="Nuevo" color="#1890ff">
                <BellOutlined />
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {entregas.map((entrega) => (
            <Card
              key={entrega.id}
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
                  {entrega.tipo === "Venta" ? (
                    entrega.estado === 3 ? (
                      <Tag icon={<CalendarOutlined />} color="processing">
                        PAGO OTRO DÍA
                      </Tag>
                    ) : entrega.estado === 2 ? (
                      <Tag icon={<CheckCircleOutlined />} color="success">
                        COBRADA
                      </Tag>
                    ) : (
                      <Tag icon={<ClockCircleOutlined />} color="warning">
                        PENDIENTE
                      </Tag>
                    )
                  ) : null}

                  <div className="flex gap-2 mt-2">
                    <Button
                      type="default"
                      size="small"
                      onClick={() => handleViewDetails(entrega)}
                    >
                      Ver Detalles
                    </Button>

                    {(entrega.estado === 1 || entrega.estado === 3) &&
                      !entrega.metodo_pago && (
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
          selectedEntrega && selectedEntrega.estado === 1 && (
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
                  {selectedEntrega.estado === 3
                    ? "PAGO OTRO DÍA"
                    : selectedEntrega.estado === 2
                    ? "COBRADA"
                    : "PENDIENTE"}
                </p>
                {selectedEntrega.metodo_pago &&
                  selectedEntrega.estado !== 3 && (
                    <p>
                      <strong>Método de pago:</strong>{" "}
                      {selectedEntrega.metodo_pago}
                    </p>
                  )}
                <p className="text-xl font-bold text-green-600">
                  {formatMoney(selectedEntrega.monto)}
                </p>
                {selectedEntrega.resto_pendiente > 0 && (
                  <p className="text-sm text-orange-500">
                    Pendiente: {formatMoney(selectedEntrega.resto_pendiente)}
                  </p>
                )}
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

          {!payLater && (
            <>
              <Form.Item label="Método de pago" className="mb-4">
                <Select
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  disabled={payLater}
                  className="w-full"
                  placeholder="Seleccione un método de pago"
                >
                  {metodoPagos.map((metodo) => (
                    <Select.Option key={metodo.id} value={metodo.nombre}>
                      {metodo.nombre}
                    </Select.Option>
                  ))}
                </Select>
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
            </>
          )}

          {paymentMethod === "EFECTIVO" && !payLater && (
            <Form.Item label="Vuelto" className="mb-4">
              <Input
                prefix={<DollarOutlined />}
                readOnly
                value={
                  paymentAmount && !isNaN(parseFloat(paymentAmount))
                    ? formatMoney(
                        Math.max(
                          0,
                          parseFloat(paymentAmount) -
                            (selectedEntrega?.monto || 0)
                        )
                      )
                    : "$0"
                }
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default Entregas;
