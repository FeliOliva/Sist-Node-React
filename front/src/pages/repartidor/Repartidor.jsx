import React, { useState, useEffect } from "react";
import "./RepartidorMovil.css";
import DetalleModal from "../../components/DetalleModal";
import PagoModal from "./PagoModal";
import { api } from "../../services/api";

const Repartidor = () => {
  const [resumenData, setResumenData] = useState([]);
  const [entregasData, setEntregasData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pagoItem, setPagoItem] = useState(null); // Item para el modal de pago
  const [saldoActual, setSaldoActual] = useState(0);
  const userName = sessionStorage.getItem("userName") || "Usuario";

  useEffect(() => {
    fetchResumen();
  }, []);

  const fetchResumen = async () => {
    try {
      setLoading(true);
      const res = await api("api/resumenDia?cajaId=1");
      console.log("Respuesta de API:", res);

      if (!res || !Array.isArray(res)) {
        console.error("La respuesta no es un array:", res);
        setResumenData([]);
        setLoading(false);
        return;
      }

      let saldoAcumulado = 0;
      const entregas = [];

      const datosConSaldo = res
        .map((item) => ({
          ...item,
          uniqueId: `${item.tipo}-${item.id}`,
        }))
        // Ordenar por fecha si la tienen, si no, usar el orden actual
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
            // Guardar las entregas para el historial
            if (item.tipo === "Entrega") {
              entregas.push({
                ...item,
                monto_formateado: formatMoney(monto),
                saldo_despues: saldoAcumulado,
              });
            }
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
        });

      setResumenData(datosConSaldo);
      setEntregasData(entregas);
      setSaldoActual(saldoAcumulado);
      setLoading(false);
    } catch (err) {
      console.error("Error al obtener el resumen del día:", err);
      setError("No se pudo cargar la información. Intente nuevamente.");
      setLoading(false);
    }
  };

  // Función para formatear el monto como dinero
  const formatMoney = (amount) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  const handlePagoClick = (e, item) => {
    e.stopPropagation(); // Evitar que se abra el modal de detalle
    setPagoItem(item);
    // Detener la propagación del evento y prevenir el comportamiento por defecto
    e.preventDefault();
    // Asegurar que la pantalla no se desplace al abrir el modal
    document.body.style.overflow = 'hidden';
  };

  const handleClosePagoModal = () => {
    setPagoItem(null);
    // Restaurar el desplazamiento cuando se cierra el modal
    document.body.style.overflow = 'auto';
  };

  const handlePaymentComplete = () => {
    // Recargar los datos después de procesar un pago
    fetchResumen();
  };

  // Renderizado condicional del botón de pago para las ventas
  const renderPagoButton = (item) => {
    if (item.tipo === "Venta") {
      return (
        <button 
          className="pago-button"
          onClick={(e) => handlePagoClick(e, item)}
        >
          Pagar
        </button>
      );
    }
    return null;
  };

  if (loading)
    return <div className="loading-container">Cargando datos...</div>;
  if (error) return <div className="error-container">{error}</div>;

  return (
    <div className="resumen-movil-container">
      <header className="resumen-header">
        <div className="header-brand">
          <img src="/logo.png" alt="Mi Familia" className="header-logo" />
          <h1>Mi Familia</h1>
        </div>
        <div className="header-user">{userName}</div>
      </header>

      <main className="resumen-content">
        {/* Card para mostrar el saldo actual */}
        <div className="saldo-card">
          <div className="saldo-actual">
            <h3>Saldo Actual</h3>
            <div className="saldo-monto">{formatMoney(saldoActual)}</div>
          </div>

          <div className="entregas-historial">
            <h3>Historial de Entregas</h3>
            {entregasData.length > 0 ? (
              <div className="entregas-list">
                {entregasData.map((entrega) => (
                  <div key={entrega.uniqueId} className="entrega-item">
                    <div className="entrega-info">
                      <span className="entrega-numero">
                        Entrega #{entrega.numero || "-"}
                      </span>
                      <span className="entrega-fecha">
                        {entrega.fecha_hora || "-"}
                      </span>
                    </div>
                    <div className="entrega-montos">
                      <span className="entrega-monto">
                        {entrega.monto_formateado}
                      </span>
                      <span className="entrega-saldo">
                        Saldo: {formatMoney(entrega.saldo_despues)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-entregas">No hay entregas registradas</p>
            )}
          </div>
        </div>

        <h2>Resumen del Día</h2>

        <div className="resumen-table-container">
          <table className="resumen-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Número</th>
                <th>Negocio</th>
                <th>Monto</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {resumenData && resumenData.length > 0 ? (
                resumenData.map((item) => (
                  <tr
                    key={item.uniqueId}
                    className={item.tipo?.toLowerCase() || ""}
                    onClick={() => handleItemClick(item)}
                  >
                    <td>{item.tipo || "-"}</td>
                    <td>{item.numero || "-"}</td>
                    <td>{item.negocio?.nombre || "-"}</td>
                    <td>{formatMoney(item.monto || 0)}</td>
                    <td className="action-cell">
                      {renderPagoButton(item)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-data">
                    No hay datos disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {selectedItem && (
        <DetalleModal item={selectedItem} onClose={handleCloseModal} />
      )}

      {pagoItem && (
        <PagoModal 
          isOpen={!!pagoItem}
          onClose={handleClosePagoModal}
          item={pagoItem}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
};

export default Repartidor;