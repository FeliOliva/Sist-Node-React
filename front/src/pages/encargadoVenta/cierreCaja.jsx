import React, { useEffect, useState } from "react";
import { Button, Input, Spin, Alert, Table, notification } from "antd";

import { api } from "../../services/api";

const CierreCajaEncargado = () => {
  const [caja, setCaja] = useState(null);
  const [totalSistema, setTotalSistema] = useState(0);
  const [montoContado, setMontoContado] = useState("");
  const [cierres, setCierres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  const cajaId = Number(sessionStorage.getItem("cajaId"));
  const usuarioId = Number(sessionStorage.getItem("usuarioId"));

  // Cargar datos de caja y cierres
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Info de la caja
        const cajaRes = await api(`api/caja/${cajaId}`, "GET");
        setCaja(cajaRes);

        // Total sistema (puedes ajustar el endpoint según tu backend)
        const totales = await api("api/entregas/totales-dia-caja");
        const total = totales.find((t) => t.cajaId === cajaId)?.totalEntregado || 0;
        setTotalSistema(total);

        // Historial de cierres solo de este usuario y caja
        setLoadingHistorial(true);
        const cierresRes = await api("api/cierres-caja");
        setCierres(
          cierresRes.filter(
            (c) => c.cajaId === cajaId && c.usuarioId === usuarioId
          )
        );
        setLoadingHistorial(false);
      } catch (err) {
        notification.error({
          message: "Error",
          description: "No se pudieron cargar los datos de la caja.",
        });
      }
      setLoading(false);
    };
    fetchData();
  }, [cajaId, usuarioId]);

  // Cerrar caja
 const handleCerrarCaja = async () => {
  setLoading(true);
  try {
    await api("api/cierre-caja", "POST", {
      cajaId,
      totalVentas: totalSistema,
      totalPagado: parseFloat(montoContado),
      ingresoLimpio: parseFloat(montoContado) - totalSistema,
    });
    notification.success({
      message: "Cierre realizado",
      description: "El cierre de caja se guardó correctamente.",
    });
    // Resetea todos los valores
    setCaja(null);
    setTotalSistema(0);
    setMontoContado("");
  } catch (err) {
    notification.error({
      message: "Error",
      description: "No se pudo realizar el cierre de caja.",
    });
  }
  setLoading(false);
};
  // Columnas para el historial
  const columns = [
    {
      title: "Fecha",
      dataIndex: "fecha",
      key: "fecha",
      render: (fecha) => new Date(fecha).toLocaleString("es-AR"),
    },
    {
      title: "Total sistema",
      dataIndex: "totalVentas",
      key: "totalVentas",
      render: (v) => `$${v}`,
    },
    {
      title: "Contado",
      dataIndex: "totalPagado",
      key: "totalPagado",
      render: (v) => `$${v}`,
    },
    {
      title: "Diferencia",
      dataIndex: "ingresoLimpio",
      key: "ingresoLimpio",
      render: (v) => (
        <span style={{ color: v === 0 ? "green" : "red" }}>${v}</span>
      ),
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      render: (estado) =>
        estado === "pendiente" ? (
          <span style={{ color: "#faad14" }}>Pendiente</span>
        ) : (
          <span style={{ color: "#52c41a" }}>Cerrado</span>
        ),
    },
  ];

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Cierre de Caja</h2>
      {loading ? (
        <Spin />
      ) : (
        <>
          <div className="mb-2">
            <strong>Caja:</strong> {caja?.nombre || "-"}
          </div>
          <div className="mb-2">
            <strong>Total sistema:</strong> ${totalSistema?.toLocaleString() || 0}
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium">Contado:</label>
            <Input
              type="number"
              min="0"
              value={montoContado}
              onChange={(e) => setMontoContado(e.target.value)}
              placeholder="Ingrese el monto contado"
            />
          </div>
          <div className="mb-4">
            <strong>Diferencia:</strong>{" "}
            <span
              style={{
                color:
                  parseFloat(montoContado) - totalSistema === 0
                    ? "green"
                    : "red",
              }}
            >
              $
              {isNaN(parseFloat(montoContado))
                ? 0
                : parseFloat(montoContado) - totalSistema}
            </span>
          </div>
          <Button
            type="primary"
            onClick={handleCerrarCaja}
            loading={loading}
            disabled={!montoContado || isNaN(parseFloat(montoContado))}
            block
          >
            Cerrar Caja
          </Button>
        </>
      )}

      <h3 className="text-xl font-semibold mt-8 mb-2">Historial de Cierres</h3>
      <Table
        columns={columns}
        dataSource={cierres}
        rowKey="id"
        loading={loadingHistorial}
        pagination={{ pageSize: 5 }}
        size="small"
      />
    </div>
  );
};

export default CierreCajaEncargado;

