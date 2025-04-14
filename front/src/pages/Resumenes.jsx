import React, { useEffect, useState } from "react";
import { Select, DatePicker, Button, Table, message } from "antd";
import dayjs from "dayjs";
import { api } from "../services/api";

const { Option } = Select;
const { RangePicker } = DatePicker;

const VentasPorNegocio = () => {
  const [negocios, setNegocios] = useState([]);
  const [negocioSeleccionado, setNegocioSeleccionado] = useState(null);
  const [fechas, setFechas] = useState([]);
  const [transacciones, setTransacciones] = useState([]);

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
      setTransacciones(res || []);
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
    </div>
  );
};

export default VentasPorNegocio;
