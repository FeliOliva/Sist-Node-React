import React, { useState, useEffect } from "react";
import "./PagoModal.css";
import { api } from "../../services/api";

const PagoModal = ({ isOpen, onClose, item, onPaymentComplete }) => {
  const [monto, setMonto] = useState("");
  const [medioPago, setMedioPago] = useState("efectivo");
  const [dejarEnCaja, setDejarEnCaja] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && item) {
      // Establecer el monto total por defecto
      setMonto(item.total_con_descuento || item.monto || "");
      // Resetear otros campos
      setMedioPago("efectivo");
      setDejarEnCaja(false);
      setError(null);
    }
  }, [isOpen, item]);

  if (!isOpen) return null;

  const totalVenta = parseFloat(item?.total_con_descuento || item?.monto || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let estadoPago;
      const montoFloat = parseFloat(monto);

      // Determinar el estado del pago
      if (dejarEnCaja) {
        estadoPago = 1; // Pendiente en caja
      } else if (montoFloat >= totalVenta) {
        estadoPago = 2; // Totalmente pagado
      } else {
        estadoPago = 3; // Parcialmente pagado
      }

      // Preparar los datos para el pago
      const paymentData = {
        ventaId: item.id,
        monto: montoFloat,
        medioPago: dejarEnCaja ? "pendiente_caja" : medioPago,
        estadoPago,
      };

      // Llamada a la API para registrar el pago
      // Asegurándonos de pasar los parámetros correctos según la implementación de api()
      const response = await api("api/entregas", "POST", JSON.stringify(paymentData));

      console.log("Response:", response);

      if (response && response.success) {
        onPaymentComplete(response.data || response);
        onClose();
      } else {
        throw new Error(response?.message || "Error al procesar el pago");
      }
    } catch (err) {
      console.error("Error al registrar el pago:", err);
      setError(err.message || "No se pudo procesar el pago. Intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pago-modal-backdrop">
      <div className="pago-modal-content">
        <div className="pago-modal-header">
          <h3>Registrar Pago</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        <div className="pago-modal-body">
          <div className="venta-details">
            <p>
              <strong>Venta #{item?.numero || "-"}</strong>
            </p>
            <p>
              {item?.negocio?.nombre || "Cliente"}: 
              <span className="monto-total">{totalVenta.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}</span>
            </p>
            {item?.totalPagado > 0 && (
              <p>
                Ya pagado: 
                <span className="monto-pagado">
                  {parseFloat(item.totalPagado).toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
                </span>
              </p>
            )}
            {item?.totalPagado > 0 && (
              <p>
                Saldo pendiente: 
                <span className="monto-pendiente">
                  {(totalVenta - parseFloat(item.totalPagado)).toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
                </span>
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="dejarEnCaja" className="checkbox-container">
                <input
                  type="checkbox"
                  id="dejarEnCaja"
                  checked={dejarEnCaja}
                  onChange={(e) => setDejarEnCaja(e.target.checked)}
                />
                <span className="label-text">Dejar pendiente en caja</span>
              </label>
            </div>

            <div className={`form-group ${dejarEnCaja ? "disabled" : ""}`}>
              <label htmlFor="monto">Monto a pagar</label>
              <input
                type="number"
                id="monto"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                disabled={dejarEnCaja}
                step="0.01"
                min="0"
                max={item?.totalPagado > 0 ? totalVenta - parseFloat(item.totalPagado) : totalVenta}
                required={!dejarEnCaja}
              />
            </div>

            <div className={`form-group ${dejarEnCaja ? "disabled" : ""}`}>
              <label htmlFor="medioPago">Medio de pago</label>
              <select
                id="medioPago"
                value={medioPago}
                onChange={(e) => setMedioPago(e.target.value)}
                disabled={dejarEnCaja}
                required
              >
                <option value="efectivo">Efectivo</option>
                <option value="debito">Débito</option>
                <option value="credito">Crédito</option>
                <option value="transferencia">Transferencia</option>
                <option value="qr">QR</option>
              </select>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="button-group">
              <button 
                type="button" 
                className="cancel-button"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="submit-button"
                disabled={isSubmitting || (!dejarEnCaja && !monto)}
              >
                {isSubmitting ? "Procesando..." : "Confirmar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PagoModal;