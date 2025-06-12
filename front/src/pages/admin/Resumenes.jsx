import React, { useEffect, useState } from "react";
import {
  Select,
  DatePicker,
  Button,
  Table,
  message,
  Modal,
  InputNumber,
  Drawer,
  Input,
} from "antd";
import dayjs from "dayjs";
import { api } from "../../services/api";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  FilterOutlined,
  PlusOutlined,
  PrinterFilled,
  PrinterOutlined,
  CaretDownOutlined,
  CreditCardOutlined,
} from "@ant-design/icons";
import logo from "../../assets/logo.png";

const { Option } = Select;
const { RangePicker } = DatePicker;

const VentasPorNegocio = () => {
  const [negocios, setNegocios] = useState([]);
  const [negocioSeleccionado, setNegocioSeleccionado] = useState(null);
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [transacciones, setTransacciones] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState(null);
  const [modalContent, setModalContent] = useState(null);
  const [modalTitle, setModalTitle] = useState("");
  const [editingRecord, setEditingRecord] = useState(null);
  const [editMonto, setEditMonto] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [actionDrawerVisible, setActionDrawerVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isAddPagoOpen, setIsAddPagoOpen] = useState(false);
  const [nuevoMonto, setNuevoMonto] = useState(null);
  const [nuevoMetodoPago, setNuevoMetodoPago] = useState(null);
  const [loadingPago, setLoadingPago] = useState(false)
  const [metodosPago, setMetodosPago] = useState([]);
  const [isAddNotaCreditoOpen, setIsAddNotaCreditoOpen] = useState(false);
  const [motivoNotaCredito, setMotivoNotaCredito] = useState("");
  const [montoNotaCredito, setMontoNotaCredito] = useState(null);
  const [loadingNotaCredito, setLoadingNotaCredito] = useState(false);
  // Detectar el ancho de la pantalla
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Determinar el tipo de pantalla
  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const isDesktop = screenWidth >= 1024;

  useEffect(() => {
    const fetchNegocios = async () => {
      try {
        const res = await api("api/getAllNegocios");
        setNegocios(res.negocios || []);
      } catch (err) {
        message.error("Error al cargar negocios");
      }
    };
    fetchNegocios();
  }, []);



  useEffect(() => {
    const fetchMetodosPago = async () => {
      try {
        const res = await api("api/metodosPago");
        setMetodosPago(res);
      } catch (err) {
        message.error("Error al cargar métodos de pago");
      }
    };
    fetchMetodosPago();
  }, []);

  const handleEditarVenta = async (record) => {
    try {
      const res = await api(`api/ventas/${record.id}`);
      setEditingRecord(res);
      setEditMonto(res.total);
      setIsEditModalOpen(true);
      setActionDrawerVisible(false);
    } catch (err) {
      message.error("Error al obtener la venta");
    }
  };

  const guardarEdicionVenta = async () => {
    try {
      await api(`api/ventas/${editingRecord.id}`, "POST", { total: editMonto });
      message.success("Venta actualizada correctamente");
      setIsEditModalOpen(false);
      obtenerResumen();
    } catch (err) {
      message.error("Error al actualizar la venta");
    }
  };

  const handleEliminarVenta = async (id) => {
    Modal.confirm({
      title: "¿Estás seguro que querés eliminar esta venta?",
      okText: "Sí, eliminar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        try {
          await api(`api/ventas/${id}`, "DELETE");
          message.success("Venta eliminada correctamente");
          obtenerResumen();
          setActionDrawerVisible(false);
        } catch (err) {
          message.error("Error al eliminar la venta");
        }
      },
    });
  };

  const handleAgregarPago = async () => {
    if (!negocioSeleccionado || !nuevoMonto || !nuevoMetodoPago) {
      message.warning("Completa todos los campos para agregar el pago");
      return;
    }
    setLoadingPago(true);
    try {
      const cajaId = parseInt(sessionStorage.getItem("cajaId"), 10);
      await api("api/entregas", "POST", {
        monto: nuevoMonto,
        metodoPagoId: nuevoMetodoPago,
        negocioId: negocioSeleccionado,
        cajaId, // <--- AGREGA ESTA LÍNEA
      });
      message.success("Pago registrado correctamente");
      setIsAddPagoOpen(false);
      setNuevoMonto(null);
      setNuevoMetodoPago(null);
      obtenerResumen();
    } catch (err) {
      message.error("Error al registrar el pago");
    } finally {
      setLoadingPago(false);
    }
  };

  const handleAgregarNotaCredito = async () => {
    if (!negocioSeleccionado || !motivoNotaCredito || !montoNotaCredito) {
      message.warning("Completa todos los campos para agregar la nota de crédito");
      return;
    }
    setLoadingNotaCredito(true);
    try {
      await api("api/notasCredito", "POST", {
        motivo: motivoNotaCredito,
        monto: montoNotaCredito,
        negocioId: negocioSeleccionado,
      });
      message.success("Nota de crédito registrada correctamente");
      setIsAddNotaCreditoOpen(false);
      setMotivoNotaCredito("");
      setMontoNotaCredito(null);
      obtenerResumen();
    } catch (err) {
      message.error("Error al registrar la nota de crédito");
    } finally {
      setLoadingNotaCredito(false);
    }
  };

  const handleVerDetalle = async (record) => {
    const { tipo, id } = record;
    try {
      if (tipo === "Nota de Crédito") {
        const res = await api(
          `api/notasCredito/${id}`
        );
        const nota = res;
        setModalTitle("Detalle de Nota de Crédito");
        setModalContent(
          <div className="text-sm">
            <p>
              <strong>Motivo:</strong> {nota.motivo}
            </p>
            <p>
              <strong>Monto:</strong> ${nota.monto.toLocaleString("es-AR")}
            </p>
            <p>
              <strong>Fecha:</strong>{" "}
              {dayjs(nota.fechaCreacion).format("DD/MM/YYYY")}
            </p>
          </div>
        );
      } else if (tipo === "Venta") {
        const res = await api(`api/ventas/${id}`);
        const venta = res;

        setDetalleSeleccionado(venta.detalles);
        setModalTitle("Detalle de Venta");
        setModalContent(
          <div className="text-sm">
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
                  {d.producto.nombre} - {d.cantidad} u. x $
                  {d.precio.toLocaleString("es-AR")} = $
                  {d.subTotal.toLocaleString("es-AR")}
                </li>
              ))}
            </ul>
          </div>
        );
      } else {
        setModalTitle("Entrega");
        setModalContent(
          <div className="text-sm">
            <p>
              <strong>Monto:</strong> ${record.monto.toLocaleString("es-AR")}
            </p>
            <p>
              <strong>Fecha:</strong> {dayjs(record.fecha).format("DD/MM/YYYY")}
            </p>
            <p>
              <strong>Método de pago:</strong> {record.metodo_pago}
            </p>
          </div>
        );
      }
      setModalVisible(true);
      setActionDrawerVisible(false);
    } catch (err) {
      message.error("No se pudieron obtener los detalles");
    }
  };

  const handleBuscarTransacciones = async () => {
    if (!negocioSeleccionado) {
      message.warning("Seleccioná un negocio");
      return;
    }

    if (!fechaInicio || !fechaFin) {
      message.warning("Seleccioná fechas de inicio y fin");
      return;
    }

    const cajaId = sessionStorage.getItem("cajaId");
    if (!cajaId) {
      message.warning("No se encontró el ID de la caja en sessionStorage");
      return;
    }

    const startDate = dayjs(fechaInicio).format("YYYY-MM-DD");
    const endDate = dayjs(fechaFin).format("YYYY-MM-DD");

    try {
      const res = await api(
        `api/resumenCuenta/negocio/${negocioSeleccionado}?startDate=${startDate}&endDate=${endDate}`
      );

      console.log(res);

      let saldoAcumulado = 0;

      const transaccionesOrdenadas = res
        .map((item) => ({
          ...item,
          uniqueId: `${item.tipo}-${item.id}`,
        }))
        .sort(
          (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
        )
        .map((item) => {
          let monto = item.total_con_descuento || item.monto || 0;
          monto = Number(monto);

          if (item.tipo === "Venta") {
            saldoAcumulado += monto;
          } else if (
            item.tipo === "Entrega" ||
            item.tipo === "Nota de Crédito"
          ) {
            saldoAcumulado -= monto;
          }

          return {
            ...item,
            saldo_restante: saldoAcumulado,
            monto_formateado: (
              item.total_con_descuento ||
              item.monto ||
              0
            ).toLocaleString("es-AR"),
          };
        })
        .sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );

      setTransacciones(transaccionesOrdenadas);
      setFilterDrawerVisible(false);
    } catch (err) {
      message.error("Error al cargar las transacciones");
    }
  };

  // Función para actualizar tanto fechaInicio como fechaFin cuando se usa RangePicker
  const handleRangePickerChange = (dates) => {
    if (dates && dates.length === 2) {
      setFechaInicio(dates[0]);
      setFechaFin(dates[1]);
    } else {
      setFechaInicio(null);
      setFechaFin(null);
    }
  };

  // Obtener resumen (función referenciada pero no definida)
  const obtenerResumen = () => {
    handleBuscarTransacciones();
  };

  // Definir columnas según el tamaño de pantalla
  const getColumns = () => {
    if (isMobile) {
      return [
        {
          title: "Tipo",
          dataIndex: "tipo",
          width: "25%",
        },
        {
          title: "Fecha",
          dataIndex: "fecha",
          width: "25%",
          render: (fecha) => dayjs(fecha).format("DD/MM/YYYY"),
        },
        {
          title: "Total",
          dataIndex: "monto_formateado",
          width: "25%",
          render: (monto) => `$${monto}`,
        },
        {
          title: "",
          width: "25%",
          render: (_, record) => (
            <Button
              icon={<MoreOutlined />}
              onClick={() => {
                setSelectedRecord(record);
                setActionDrawerVisible(true);
              }}
              size="small"
            />
          ),
        },
      ];
    } else if (isTablet) {
      return [
        {
          title: "Tipo",
          dataIndex: "tipo",
        },
        {
          title: "Fecha",
          dataIndex: "fecha",
          render: (fecha) => dayjs(fecha).format("DD/MM/YYYY"),
        },
        {
          title: "Total",
          dataIndex: "monto_formateado",
          render: (monto) => `$${monto}`,
        },
        {
          title: "Saldo",
          dataIndex: "saldo_restante",
          render: (saldo) =>
            saldo ? `$${saldo.toLocaleString("es-AR")}` : "-",
        },
        {
          title: "Acciones",
          render: (_, record) => (
            <div className="flex gap-1">
              <Button
                icon={<EyeOutlined />}
                onClick={() => handleVerDetalle(record)}
                size="small"
              />
              <Button
                icon={<EditOutlined />}
                onClick={() => handleEditarVenta(record)}
                size="small"
                disabled={record.tipo === "Nota de Crédito"}
              />
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleEliminarVenta(record.id)}
                size="small"
              />
            </div>
          ),
        },
      ];
    } else {
      return [
        {
          title: "Tipo",
          dataIndex: "tipo",
        },
        {
          title: "Fecha",
          dataIndex: "fecha",
          render: (fecha) => dayjs(fecha).format("DD/MM/YYYY"),
        },
        {
          title: "Número",
          dataIndex: "numero",
          render: (numero) => numero || "-",
        },
        {
          title: "Total",
          dataIndex: "monto_formateado",
          render: (monto) => `$${monto}`,
        },
        {
          title: "Método de pago",
          dataIndex: "metodo_pago",
          render: (m) => m || "-",
        },
        {
          title: "Saldo restante",
          dataIndex: "saldo_restante",
          render: (saldo) =>
            saldo ? `$${saldo.toLocaleString("es-AR")}` : "-",
        },
        {
          title: "Acciones",
          render: (_, record) => (
            <div className="flex gap-2">
              <Button
                icon={<EyeOutlined />}
                onClick={() => handleVerDetalle(record)}
              />
              <Button
                icon={<EditOutlined />}
                onClick={() => handleEditarVenta(record)}
                disabled={record.tipo === "Nota de Crédito"}
              />
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleEliminarVenta(record.id)}
              />
            </div>
          ),
        },
      ];
    }
  };

  const handleImprimirResumen = () => {
    const printContents = document.getElementById("printableArea").innerHTML;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); // para recargar el contenido original
  };

  // Renderizado principal
  return (
   <div className="p-4 max-w-7xl mx-auto">
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Resumen por Negocio</h2>
        </div>
        <div className="px-4 py-4 flex flex-col sm:flex-row flex-wrap gap-2 md:gap-4 items-start sm:items-center">
          <Select
            style={{ width: "100%", maxWidth: 250 }}
            placeholder="Selecciona un negocio"
            onChange={setNegocioSeleccionado}
            value={negocioSeleccionado}
          >
            {negocios
              .filter((n) => n.estado === 1 && n.esCuentaCorriente)
              .map((n) => (
                <Option key={n.id} value={n.id}>
                  {n.nombre}
                </Option>
              ))}
          </Select>

          <RangePicker
            onChange={handleRangePickerChange}
            value={[fechaInicio, fechaFin]}
            style={{ width: "100%", maxWidth: 350 }}
          />

          <Button type="primary" onClick={handleBuscarTransacciones}>
            Buscar Movimientos
          </Button>
          <Button
            icon={<PrinterOutlined />}
            onClick={handleImprimirResumen}
            type="primary"
          >
            Imprimir
          </Button>
          <Button
            icon={<CreditCardOutlined />}
            onClick={() => setIsAddPagoOpen(true)}
            type="primary"
            disabled={!negocioSeleccionado}
          >
            Agregar Pago
          </Button>
          <Button
            icon={<PlusOutlined />}
            onClick={() => setIsAddNotaCreditoOpen(true)}
            type="primary"
            disabled={!negocioSeleccionado}
          >
            Agregar Nota de Crédito
          </Button>
        </div>
      </div>


      {/* Botón de filtro para móviles */}
      {isMobile && (
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Ventas por Negocio</h3>
          <Button
            icon={<FilterOutlined />}
            onClick={() => setFilterDrawerVisible(true)}
            type="primary"
          >
            Filtros
          </Button>
        </div>
      )}
      
      {/* Tabla de transacciones */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Movimientos</h2>
        </div>
        <div className="overflow-x-auto px-4 py-4">
          <Table
            dataSource={transacciones}
            columns={getColumns()}
            rowKey={(record) => `${record.tipo}-${record.id}`}
            pagination={{
              pageSize: isMobile ? 5 : 10,
              size: isMobile ? "small" : "default",
              simple: isMobile,
            }}
            size={isMobile || isTablet ? "small" : "middle"}
            scroll={{ x: isMobile ? 480 : isTablet ? 650 : 950 }}
            locale={{ emptyText: "No hay datos disponibles" }}
          />
        </div>
      </div>

      {/* Modal para ver detalles */}
      {!isMobile ? (
        <Modal
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          title={modalTitle}
          width={isMobile ? "95%" : isTablet ? "80%" : 600}
        >
          {modalContent}
        </Modal>
      ) : (
        <Drawer
          open={modalVisible}
          onClose={() => setModalVisible(false)}
          title={modalTitle}
          placement="bottom"
          height="70%"
        >
          {modalContent}
        </Drawer>
      )}

      {/* Modal para editar venta */}
      {!isMobile ? (
        <Modal
          title="Editar"
          open={isEditModalOpen}
          onCancel={() => setIsEditModalOpen(false)}
          onOk={guardarEdicionVenta}
          okText="Guardar"
          width={isMobile ? "95%" : isTablet ? "80%" : 500}
        >
          <div className="space-y-4">
            <p>
              <strong>Numero:</strong> {editingRecord?.nroVenta}
            </p>
            <p>
              <strong>Fecha:</strong>{" "}
              {dayjs(editingRecord?.fechaCreacion).format("DD/MM/YYYY")}
            </p>
            <InputNumber
              value={editMonto ?? 0}
              onChange={(value) => setEditMonto(value)}
              formatter={(value) =>
                `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
              }
              parser={(value) => value?.replace(/\$\s?|(\.)/g, "")}
              min={0}
              style={{ width: "100%" }}
            />
          </div>
        </Modal>
      ) : (
        <Drawer
          title="Editar monto de venta"
          open={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          placement="bottom"
          height="50%"
          extra={
            <Button type="primary" onClick={guardarEdicionVenta}>
              Guardar
            </Button>
          }
        >
          <div className="space-y-4">
            <p>
              <strong>Nro Venta:</strong> {editingRecord?.nroVenta}
            </p>
            <p>
              <strong>Fecha:</strong>{" "}
              {dayjs(editingRecord?.fechaCreacion).format("DD/MM/YYYY")}
            </p>
            <InputNumber
              value={editMonto ?? 0}
              onChange={(value) => setEditMonto(value)}
              formatter={(value) =>
                `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
              }
              parser={(value) => value?.replace(/\$\s?|(\.)/g, "")}
              min={0}
              style={{ width: "100%" }}
            />
          </div>
        </Drawer>
      )}

      <Modal
        title="Agregar Pago/Entrega"
        open={isAddPagoOpen}
        onCancel={() => setIsAddPagoOpen(false)}
        onOk={handleAgregarPago}
        okText="Registrar"
        confirmLoading={loadingPago}
      >
        <div className="space-y-4">
          <div>
            <label>Monto</label>
            <InputNumber
              value={nuevoMonto}
              onChange={setNuevoMonto}
              min={1}
              style={{ width: "100%" }}
              placeholder="Monto"
            />
          </div>
          <div>
            <label>Método de pago</label>
            <Select
              value={nuevoMetodoPago}
              onChange={setNuevoMetodoPago}
              placeholder="Selecciona método de pago"
              style={{ width: "100%" }}
            >
              {metodosPago.map((m) => (
                <Option key={m.id} value={m.id}>
                  {m.nombre}
                </Option>
              ))}
            </Select>
          </div>
        </div>
      </Modal>


<Modal
  title="Agregar Nota de Crédito"
  open={isAddNotaCreditoOpen}
  onCancel={() => setIsAddNotaCreditoOpen(false)}
  onOk={handleAgregarNotaCredito}
  okText="Registrar"
  confirmLoading={loadingNotaCredito}
>
  <div className="space-y-4">
    <div>
      <label>Motivo</label>
      <Input
        type="text"
        className="ant-input"
        value={motivoNotaCredito}
        onChange={e => setMotivoNotaCredito(e.target.value)}
        placeholder="Motivo de la nota de crédito"
      />
    </div>
    <div>
      <label>Monto</label>
      <InputNumber
        value={montoNotaCredito}
        onChange={setMontoNotaCredito}
        min={1}
        style={{ width: "100%" }}
        placeholder="Monto"
      />
    </div>
  </div>
</Modal>

      {/* Drawer para filtros en móvil - Ahora con DatePicker individuales */}
      <Drawer
        title="Filtros"
        placement="bottom"
        onClose={() => setFilterDrawerVisible(false)}
        open={filterDrawerVisible}
        height="70%"
      >
        <div className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Negocio</label>
            <Select
              style={{ width: "100%" }}
              placeholder="Selecciona un negocio"
              onChange={setNegocioSeleccionado}
              value={negocioSeleccionado}
            >
              {negocios
                .filter((n) => n.estado === 1 && n.esCuentaCorriente)
                .map((n) => (
                  <Option key={n.id} value={n.id}>
                    {n.nombre}
                  </Option>
                ))}
            </Select>
          </div>

          {/* DatePicker separados para móviles en lugar de RangePicker */}
          <div>
            <label className="block mb-1 font-medium">Fecha inicial</label>
            <DatePicker
              value={fechaInicio}
              onChange={(date) => setFechaInicio(date)}
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder="Selecciona fecha inicial"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Fecha final</label>
            <DatePicker
              value={fechaFin}
              onChange={(date) => setFechaFin(date)}
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder="Selecciona fecha final"
              disabledDate={(current) => fechaInicio && current < fechaInicio}
            />
          </div>

          <Button
            type="primary"
            onClick={handleBuscarTransacciones}
            style={{ width: "100%" }}
          >
            Buscar Movimientos
          </Button>
          <Button
            icon={<PrinterFilled />}
            onClick={handleImprimirResumen}
            type="primary"
            style={{ width: "100%" }}
          >
            Imprimir Resumen
          </Button>
          <Button
            icon={<CreditCardOutlined />}
            onClick={() => setIsAddPagoOpen(true)}
            type="primary"
            style={{ width: "100%" }}
            disabled={!negocioSeleccionado}
          >
            Agregar Pago
          </Button>
          <Button
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
            type="primary"
            style={{ width: "100%" }}
            disabled={!negocioSeleccionado}
          >
            Agregar Nota de Crédito
          </Button>

        </div>
      </Drawer>



      {/* Drawer para acciones en móvil */}
      <Drawer
        title="Acciones"
        placement="bottom"
        onClose={() => setActionDrawerVisible(false)}
        open={actionDrawerVisible}
        height="50%"
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="bg-gray-100 p-3 rounded">
              <p>
                <strong>Tipo:</strong> {selectedRecord.tipo}
              </p>
              <p>
                <strong>Fecha:</strong>{" "}
                {dayjs(selectedRecord.fecha).format("DD/MM/YYYY")}
              </p>
              <p>
                <strong>Total:</strong> ${selectedRecord.monto_formateado}
              </p>
              <p>
                <strong>Saldo:</strong> $
                {selectedRecord.saldo_restante?.toLocaleString("es-AR") || "-"}
              </p>
            </div>

            <div className="space-y-2">
              <Button
                type="primary"
                icon={<EyeOutlined />}
                onClick={() => handleVerDetalle(selectedRecord)}
                style={{ width: "100%" }}
              >
                Ver detalle
              </Button>

              <Button
                icon={<EditOutlined />}
                onClick={() => handleEditarVenta(selectedRecord)}
                style={{ width: "100%" }}
                disabled={selectedRecord?.tipo === "Nota de Crédito"}
              >
                Editar
              </Button>

              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleEliminarVenta(selectedRecord.id)}
                style={{ width: "100%" }}
              >
                Eliminar venta
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      <div id="printableArea" className="hidden print:block p-6">
        <div className="text-center mb-4">
          <img src={logo} alt="Logo" className="mx-auto mb-2" style={{ width: "100px" }} />
          <h1 className="text-2xl font-bold">Mi Familia</h1>
          <h2 className="text-xl mt-2">Resumen de Cuenta</h2>
          {negocios.find((n) => n.id === negocioSeleccionado)?.nombre && (
            <p className="mt-2">
              Negocio: <strong>{negocios.find((n) => n.id === negocioSeleccionado)?.nombre}</strong>
            </p>
          )}
          {fechaInicio && fechaFin && (
            <p>
              Desde: {dayjs(fechaInicio).format("DD/MM/YYYY")} hasta:{" "}
              {dayjs(fechaFin).format("DD/MM/YYYY")}
            </p>
          )}
        </div>

        <table className="w-full text-sm border border-black border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-black p-2">Tipo</th>
              <th className="border border-black p-2">Fecha</th>
              <th className="border border-black p-2">Monto</th>
              <th className="border border-black p-2">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {transacciones.map((item) => (
              <tr key={item.uniqueId}>
                <td className="border border-black p-2">{item.tipo}</td>
                <td className="border border-black p-2">{dayjs(item.fecha).format("DD/MM/YYYY")}</td>
                <td className="border border-black p-2">${item.monto_formateado}</td>
                <td className="border border-black p-2">
                  ${item.saldo_restante.toLocaleString("es-AR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

  );
};

export default VentasPorNegocio;
