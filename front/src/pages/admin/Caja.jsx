import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { Card, InputNumber, Button, Table, notification } from "antd";

const CierreCajaGeneral = () => {
  const [cajas, setCajas] = useState([]);
  const [montosContados, setMontosContados] = useState({});
  const [loading, setLoading] = useState(false);
  const [totalesEntregas, setTotalesEntregas] = useState([]);
  const [cierres, setCierres] = useState([]);

useEffect(() => {
  api("api/caja", "GET").then((data) => setCajas(data));
  api("api/entregas/totales-dia-caja", "GET").then((data) => setTotalesEntregas(data));
  api("api/cierres-caja", "GET").then((data) => setCierres(data));
}, []);

  const handleInputChange = (cajaId, value) => {
    setMontosContados((prev) => ({ ...prev, [cajaId]: value }));
  };

  const getTotalSistema = (cajaId) => {
    const encontrado = totalesEntregas.find((t) => t.cajaId === cajaId);
    return encontrado ? encontrado.totalEntregado : 0;
  };

const handleCerrarCaja = async (caja) => {
  setLoading(true);
  const contado = montosContados[caja.id] || 0;
  const totalSistema = getTotalSistema(caja.id);
  const diferencia = contado - totalSistema;

  // Simula usuarioId, reemplaza por el real si lo tienes en sesión
  const usuarioId = 1;

  await api("api/cierre-caja", "POST", JSON.stringify({
    usuarioId,
    totalVentas: totalSistema,
    totalPagado: contado,
    ingresoLimpio: diferencia,
  }));

  notification.success({
    message: "Cierre realizado",
    description: `Cierre de caja ${caja.nombre} guardado. Diferencia: $${diferencia}`,
  });

  // Refresca la tabla de cierres
  const nuevosCierres = await api("api/cierres-caja", "GET");
  setCierres(nuevosCierres);

  setLoading(false);
};

  return (
    <Card title="Cierre de Caja General" className="mb-6">
      <Table
        dataSource={cajas}
        rowKey="id"
        pagination={false}
        columns={[
          { title: "Caja", dataIndex: "nombre" },
          {
            title: "Total Sistema",
            render: (_, caja) => `$${getTotalSistema(caja.id)}`
          },
          {
            title: "Contado",
            render: (_, caja) => (
              <InputNumber
                min={0}
                value={montosContados[caja.id]}
                onChange={value => handleInputChange(caja.id, value)}
                formatter={v => `$ ${v}`}
              />
            ),
          },
          {
            title: "Diferencia",
            render: (_, caja) => {
              const contado = montosContados[caja.id] || 0;
              const sistema = getTotalSistema(caja.id);
              return <span>{`$${contado - sistema}`}</span>;
            },
          },
          {
            title: "Acción",
            render: (_, caja) => (
              <Button
                type="primary"
                onClick={() => handleCerrarCaja(caja)}
                loading={loading}
              >
                Cerrar Caja
              </Button>
            ),
          },
        ]}
      />
      <Card title="Historial de Cierres de Caja" className="mb-6 mt-6">
  <Table
    dataSource={cierres}
    rowKey="id"
    pagination={false}
    columns={[
      { title: "Fecha", dataIndex: "fecha", render: v => new Date(v).toLocaleString() },
      { title: "Usuario", dataIndex: ["usuario", "usuario"] },
      { title: "Total Sistema", dataIndex: "totalVentas", render: v => `$${v}` },
      { title: "Contado", dataIndex: "totalPagado", render: v => `$${v}` },
      { title: "Diferencia", dataIndex: "ingresoLimpio", render: v => `$${v}` },
    ]}
  />
</Card>
    </Card>
    
  );
};

export default CierreCajaGeneral;