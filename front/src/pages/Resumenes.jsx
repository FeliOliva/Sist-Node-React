import React, { useEffect, useState } from "react";
import { Select, DatePicker, Button, Table, message, Modal, InputNumber } from "antd";
import dayjs from "dayjs";
import { api } from "../services/api";
import { EyeOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";


const { Option } = Select;
const { RangePicker } = DatePicker;

const VentasPorNegocio = () => {
  const [negocios, setNegocios] = useState([]);
  const [negocioSeleccionado, setNegocioSeleccionado] = useState(null);
  const [fechas, setFechas] = useState([]);
  const [transacciones, setTransacciones] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [modalContent, setModalContent] = useState(null);
  const [modalTitle, setModalTitle] = useState("");
  const [editingRecord, setEditingRecord] = useState(null);
  const [editMonto, setEditMonto] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);


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


  const handleEditarVenta = async (record) => {
    try {
      const res = await api(`api/ventas/${record.id}`);
      setEditingRecord(res);
      setEditMonto(res.total);
      setIsEditModalOpen(true);
    } catch (err) {
      message.error("Error al obtener la venta");
    }
  };

  const guardarEdicionVenta = async () => {
    try {
      await api(`api/ventas/${editingRecord.id}`, "POST", { total: editMonto });
      message.success("Venta actualizada correctamente");
      setIsEditModalOpen(false);
      // Recargar los datos, si tenés una función para eso
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
          obtenerResumen(); // o refrescar datos
        } catch (err) {
          message.error("Error al eliminar la venta");
        }
      },
    });
  };


  const handleVerDetalle = async (record) => {
    const { tipo, id, negocioId } = record;
    try {
      if (tipo === "Nota de Crédito") {
        const res = await api(`api/notasCredito/negocio/${negocioId}?page=1&limit=10`);
        const nota = res.notasCredito.find((n) => n.id === id);
        setModalTitle("Detalle de Nota de Crédito");
        setModalContent(
          <div>
            <p><strong>Cliente:</strong> {nota.cliente?.nombre} {nota.cliente?.apellido}</p>
            <p><strong>Motivo:</strong> {nota.motivo}</p>
            <p><strong>Monto:</strong> ${nota.monto.toLocaleString("es-AR")}</p>
            <p><strong>Fecha:</strong> {dayjs(nota.fechaCreacion).format("DD/MM/YYYY")}</p>
          </div>
        );
      } else if (tipo === "Venta") {
        const cajaId = sessionStorage.getItem("cajaId");
        const startDate = dayjs(fechas[0]).format("YYYY-MM-DD");
        const endDate = dayjs(fechas[1]).format("YYYY-MM-DD");
        const res = await api(`api/ventas/negocio/${negocioId}?startDate=${startDate}&endDate=${endDate}&cajaId=${cajaId}`);
        const venta = res.ventas.find((v) => v.id === id);
        setModalTitle("Detalle de Venta");
        setModalContent(
          <div>
            <p><strong>Cliente:</strong> {venta.cliente?.nombre} {venta.cliente?.apellido}</p>
            <p><strong>Total:</strong> ${venta.total.toLocaleString("es-AR")}</p>
            <p><strong>Fecha:</strong> {dayjs(venta.fechaCreacion).format("DD/MM/YYYY")}</p>
            <p><strong>Productos:</strong></p>
            <ul className="list-disc pl-5">
              {venta.detalles.map((d) => (
                <li key={d.id}>
                  {d.producto.nombre} - {d.cantidad} u. x ${d.precio.toLocaleString("es-AR")}
                </li>
              ))}
            </ul>
          </div>
        );
      } else {
        setModalTitle("Entrega");
        setModalContent(
          <div>
            <p><strong>Monto:</strong> ${record.monto.toLocaleString("es-AR")}</p>
            <p><strong>Fecha:</strong> {dayjs(record.fecha).format("DD/MM/YYYY")}</p>
            <p><strong>Método de pago:</strong> {record.metodo_pago}</p>
          </div>
        );
      }
      setModalVisible(true);
    } catch (err) {
      message.error("No se pudieron obtener los detalles");
    }
  };


  const handleBuscarTransacciones = async () => {
    if (!negocioSeleccionado) {
      message.warning("Seleccioná un negocio");
      return;
    }

    if (fechas.length !== 2) {
      message.warning("Seleccioná un rango de fechas");
      return;
    }

    const cajaId = sessionStorage.getItem("cajaId");
    if (!cajaId) {
      message.warning("No se encontró el ID de la caja en sessionStorage");
      return;
    }

    const startDate = dayjs(fechas[0]).format("YYYY-MM-DD");
    const endDate = dayjs(fechas[1]).format("YYYY-MM-DD");

    try {
      const res = await api(
        `api/resumenCuenta/negocio/${negocioSeleccionado}?startDate=${startDate}&endDate=${endDate}&cajaId=${cajaId}`
      );

      console.log("Transacciones recibidas:", res);

      let saldoAcumulado = 0;

      const transaccionesOrdenadas = res
        .map((item) => ({
          ...item,
          uniqueId: `${item.tipo}-${item.id}`,
        }))
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()) // Orden ascendente
        .map((item) => {
          let monto = item.total_con_descuento || item.monto || 0;
          monto = Number(monto);


          if (item.tipo === "Venta") {
            saldoAcumulado += monto;
          } else if (item.tipo === "Entrega" || item.tipo === "Nota de Crédito") {
            saldoAcumulado -= monto;
          }

          return {
            ...item,
            saldo_restante: saldoAcumulado,
          };
        })
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()); // Opcional: volver a orden descendente

      console.log("Transacciones ordenadas:", transaccionesOrdenadas);
      setTransacciones(transaccionesOrdenadas);
    } catch (err) {
      message.error("Error al cargar las transacciones");
    }
  };

  const columnas = [
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
      title: "Total / Monto",
      render: (_, record) => {
        return record.total_con_descuento || record.monto || "-";
      },
    },
    {
      title: "Método de pago",
      dataIndex: "metodo_pago",
      render: (m) => m || "-",
    },
    {
      title: "Saldo restante",
      dataIndex: "saldo_restante",
      render: (saldo) => saldo ? `$${saldo.toLocaleString("es-AR")}` : "-"
    },
    {
      title: "Acciones",
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            icon={<EyeOutlined />}
            onClick={() => handleVerDetalle(record)}
          />
          <Button icon={<EditOutlined />} onClick={() => handleEditarVenta(record)} />
          <Button danger icon={<DeleteOutlined />} onClick={() => handleEliminarVenta(record.id)} />
        </div>
      ),
    }
  ];

  return (

    <div className="p-4 space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        <Select
          style={{ minWidth: 250 }}
          placeholder="Selecciona un negocio"
          onChange={setNegocioSeleccionado}
          value={negocioSeleccionado}
        >
          {negocios.map((n) => (
            <Option key={n.id} value={n.id}>
              {n.nombre}
            </Option>
          ))}
        </Select>

        <RangePicker onChange={(dates) => setFechas(dates)} />

        <Button type="primary" onClick={handleBuscarTransacciones}>
          Buscar Movimientos
        </Button>
      </div>

      <Table
        dataSource={transacciones}
        columns={columnas}
        rowKey={(record) => `${record.tipo}-${record.id}`}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        title={modalTitle}
        width={600}
      >
        {modalContent}
      </Modal>
      <Modal
        title="Editar monto de venta"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        onOk={guardarEdicionVenta}
        okText="Guardar"
      >
        <div className="space-y-4">
          <p><strong>Nro Venta:</strong> {editingRecord?.nroVenta}</p>
          <p><strong>Fecha:</strong> {dayjs(editingRecord?.fechaCreacion).format("DD/MM/YYYY")}</p>
          <InputNumber
            value={editMonto ?? 0}
            onChange={(value) => setEditMonto(value)}
            formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
            parser={(value) => value?.replace(/\$\s?|(\.)/g, "")}
            min={0}
            style={{ width: "100%" }}
          />
        </div>
      </Modal>
    </div>

  );
};

export default VentasPorNegocio;
