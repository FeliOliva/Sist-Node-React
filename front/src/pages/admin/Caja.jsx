import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import { Card, InputNumber, Button, Table, notification } from "antd";

const CierreCajaGeneral = () => {
  const [cajas, setCajas] = useState([]);
  const [montosContados, setMontosContados] = useState({});
  const [loading, setLoading] = useState(false);
  const [totalesEntregas, setTotalesEntregas] = useState([]);

  useEffect(() => {
    api("api/caja", "GET").then((data) => setCajas(data));
    api("api/entregas/totales-dia-caja", "GET").then((data) => setTotalesEntregas(data));
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

    await api("api/cierre-caja", "POST", JSON.stringify({
      cajaId: caja.id,
      contado,
      diferencia,
    }));

    notification.success({
      message: "Cierre realizado",
      description: `Cierre de caja ${caja.nombre} guardado. Diferencia: $${diferencia}`,
    });
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
    </Card>
  );
};

export default CierreCajaGeneral;