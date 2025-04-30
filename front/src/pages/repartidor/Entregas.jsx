import React, { useEffect, useState } from "react";
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
  const [form] = Form.useForm();

  useEffect(() => {
    fetchEntregas();
  }, []);

  const fetchEntregas = async () => {
    try {
      setLoading(true);
      const cajaId = sessionStorage.getItem("cajaId");
      if (!cajaId) throw new Error("No hay cajaId en sessionStorage");

      const data = await api(`api/resumenDia?cajaId=${cajaId}`, "GET");
      console.log("Entregas:", data);
      setEntregas(data);
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
        <h1 className="text-2xl font-bold text-center mb-6 text-blue-700">
          Entregas Pendientes
        </h1>

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
