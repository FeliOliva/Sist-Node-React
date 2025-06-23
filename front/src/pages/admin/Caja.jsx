import React, { useEffect, useState } from "react";
import { api } from "../../services/api";

const CierreCajaGeneral = () => {
  const [cajas, setCajas] = useState([]);
  const [montosContados, setMontosContados] = useState({});
  const [loading, setLoading] = useState(false);
  const [totalesEntregas, setTotalesEntregas] = useState([]);
  const [cierres, setCierres] = useState([]);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    api("api/caja", "GET").then((data) => setCajas(data));
    api("api/entregas/totales-dia-caja", "GET").then((data) => setTotalesEntregas(data));
    api("api/cierres-caja", "GET").then((data) => setCierres(data));
  }, []);

  const showNotification = (type, message, description) => {
    setNotification({ type, message, description });
    setTimeout(() => setNotification(null), 4000);
  };

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

    try {
      await api("api/cierre-caja", "POST", JSON.stringify({
        cajaId: caja.id,
        totalVentas: totalSistema,
        totalPagado: contado,
        ingresoLimpio: diferencia,
      }));

      showNotification("success", "Cierre realizado", 
        `Cierre de caja ${caja.nombre} guardado. Diferencia: $${diferencia}`);

      // Refresca los datos
      const nuevosCierres = await api("api/cierres-caja", "GET");
      setCierres(nuevosCierres);
      const nuevasCajas = await api("api/caja", "GET");
      setCajas(nuevasCajas);
      setMontosContados((prev) => ({ ...prev, [caja.id]: 0 }));
          setTotalesEntregas((prev) =>
      prev.map((t) =>
        t.cajaId === caja.id ? { ...t, totalEntregado: 0 } : t
      )
    );
    } catch (error) {
      showNotification("error", "Error", "No se pudo realizar el cierre");
    }
    
    setLoading(false);
  };

  const handleCerrarPendiente = async (record) => {
    try {
      await api(`api/cierre-caja/${record.id}/cerrar`, "PATCH");
      showNotification("success", "Cierre actualizado", "Estado actualizado correctamente");
      const nuevosCierres = await api("api/cierres-caja", "GET");
      setCierres(nuevosCierres);
    } catch (error) {
      showNotification("error", "Error", "No se pudo actualizar el cierre");
    }
  };

  const formatCurrency = (value) => `$${value?.toLocaleString() || 0}`;
  const formatDate = (date) => new Date(date).toLocaleString();

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
          notification.type === 'success' ? 'bg-green-100 border-green-500 text-green-800' : 
          'bg-red-100 border-red-500 text-red-800'
        } border-l-4`}>
          <h4 className="font-semibold">{notification.message}</h4>
          <p className="text-sm">{notification.description}</p>
        </div>
      )}

      {/* Cierre de Cajas */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Cierre de Caja General</h2>
        </div>
        
        {/* Vista Desktop */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Caja</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sistema</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diferencia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cajas.map((caja) => {
                const contado = montosContados[caja.id] || 0;
                const sistema = getTotalSistema(caja.id);
                const diferencia = contado - sistema;
                
                return (
                  <tr key={caja.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{caja.nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(sistema)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        value={montosContados[caja.id] || ''}
                        onChange={(e) => handleInputChange(caja.id, parseFloat(e.target.value) || 0)}
                        className="w-24 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(diferencia)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleCerrarCaja(caja)}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        {loading ? 'Cerrando...' : 'Cerrar Caja'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Vista Mobile */}
        <div className="lg:hidden">
          {cajas.map((caja) => {
            const contado = montosContados[caja.id] || 0;
            const sistema = getTotalSistema(caja.id);
            const diferencia = contado - sistema;
            
            return (
              <div key={caja.id} className="p-4 border-b border-gray-200 last:border-b-0">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{caja.nombre}</span>
                    <span className="text-sm text-gray-500">Sistema: {formatCurrency(sistema)}</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600 min-w-0">Contado:</label>
                      <input
                        type="number"
                        min="0"
                        value={montosContados[caja.id] || ''}
                        onChange={(e) => handleInputChange(caja.id, parseFloat(e.target.value) || 0)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                    
                    <div className="text-sm">
                      <span className="text-gray-600">Diferencia: </span>
                      <span className={`font-medium ${diferencia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(diferencia)}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleCerrarCaja(caja)}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {loading ? 'Cerrando...' : 'Cerrar Caja'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historial de Cierres */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Historial de Cierres de Caja</h2>
        </div>

        {/* Vista Desktop */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Caja</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sistema</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diferencia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cierres.map((cierre) => (
                <tr key={cierre.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(cierre.fecha)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cierre.usuario?.usuario}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cierre.caja?.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(cierre.totalVentas)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(cierre.totalPagado)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(cierre.ingresoLimpio)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      cierre.estado === 'pendiente' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {cierre.estado === 'pendiente' ? 'Pendiente' : 'Cerrado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {cierre.estado === 'pendiente' && (
                      <button
                        onClick={() => handleCerrarPendiente(cierre)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                      >
                        Cerrar Pendiente
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vista Mobile */}
        <div className="lg:hidden">
          {cierres.map((cierre) => (
            <div key={cierre.id} className="p-4 border-b border-gray-200 last:border-b-0">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">{cierre.caja?.nombre}</div>
                    <div className="text-sm text-gray-500">{formatDate(cierre.fecha)}</div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    cierre.estado === 'pendiente' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {cierre.estado === 'pendiente' ? 'Pendiente' : 'Cerrado'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Usuario:</span>
                    <div className="font-medium">{cierre.usuario?.usuario}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Sistema:</span>
                    <div className="font-medium">{formatCurrency(cierre.totalVentas)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Contado:</span>
                    <div className="font-medium">{formatCurrency(cierre.totalPagado)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Diferencia:</span>
                    <div className={`font-medium ${cierre.ingresoLimpio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(cierre.ingresoLimpio)}
                    </div>
                  </div>
                </div>
                
                {cierre.estado === 'pendiente' && (
                  <button
                    onClick={() => handleCerrarPendiente(cierre)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Cerrar Pendiente
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CierreCajaGeneral;