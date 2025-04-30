const entregaModel = require("../models/entregaModel");
const { redisClient } = require("../db");



const generarNroEntrega = async () => {
  try {
    // Obtener la fecha actual en formato AAAAMMDD
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    const fechaStr = `${anio}${mes}${dia}`;
    
    // Buscar la última entrega del día para determinar el siguiente número secuencial
    const ultimaEntrega = await entregaModel.getUltimaEntregaDelDia();
    
    let numeroSecuencial = 1; // Valor por defecto si no hay entregas previas
    
    if (ultimaEntrega && ultimaEntrega.nroEntrega) {
      // Verificar si la última entrega es del mismo día
      const partes = ultimaEntrega.nroEntrega.split('-');
      if (partes.length === 2 && partes[0] === fechaStr) {
        // Si es del mismo día, incrementar el contador
        numeroSecuencial = parseInt(partes[1]) + 1;
      }
    }
    
    // Formatear el número secuencial con ceros a la izquierda
    const secuencialStr = String(numeroSecuencial).padStart(4, '0');
    
    // Combinar para formar el número de entrega completo
    const nroEntrega = `${fechaStr}-${secuencialStr}`;
    
    return nroEntrega;
  } catch (error) {
    console.error("Error al generar número de entrega:", error);
    // En caso de error, generar un número basado en timestamp para evitar fallas
    const timestamp = new Date().getTime();
    return `E${timestamp}`;
  }
};


const clearEntregaCache = async () => {
  try {
    const keys = await redisClient.keys("Entregas:*");
    const clientKeys = await redisClient.keys("EntregasCliente:*");
    const negocioKeys = await redisClient.keys("EntregasNegocio:*");

    const allKeys = [...keys, ...clientKeys, ...negocioKeys];

    if (allKeys.length > 0) {
      await redisClient.del(allKeys);
    }
  } catch (error) {
    console.error("Error al limpiar la caché de entregas:", error);
  }
};

const getEntregas = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;

    if (
      isNaN(pageNumber) ||
      pageNumber < 1 ||
      isNaN(limitNumber) ||
      limitNumber < 1
    ) {
      return res
        .status(400)
        .json({ error: "Parámetros de paginación no válidos" });
    }

    const cacheKey = `Entregas:${limitNumber}:${pageNumber}`;
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const entregasData = await entregaModel.getAllEntregas(
      limitNumber,
      pageNumber
    );
    await redisClient.setEx(cacheKey, 600, JSON.stringify(entregasData));

    res.json(entregasData);
  } catch (error) {
    console.error("Error al obtener las entregas:", error);
    res.status(500).json({ error: "Error al obtener las entregas" });
  }
};

const cambiarEstadoVenta = async (req, res) => {
  try {
    const { venta_id, estado } = req.query;
    if (!venta_id || !estado) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
    await entregaModel.updateVenta(venta_id, { estadoPago: parseInt(estado) });
    const keys = await redisClient.keys("Ventas:*");
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    await clearEntregaCache();

    res.json({ message: "Estado de la venta actualizado" });
  } catch (error) {
    console.error("Error al cambiar el estado de la entrega:", error);
    res.status(500).json({ error: "Error al cambiar el estado de la entrega" });
  }
};

const getEntregaById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "El id es obligatorio" });
    }

    const entregaData = await entregaModel.getEntregaById(id);
    res.json(entregaData);
  } catch (error) {
    console.error("Error al obtener la entrega por id:", error);
    res.status(500).json({ error: "Error al obtener la entrega por id" });
  }
};

const getEntregasByNegocio = async (req, res) => {
  try {
    const { negocioId } = req.params;
    const { page, limit, startDate, endDate, cajaId } = req.query;

    const pageNumber = parseInt(page) || 1;
    const limitNumber = parseInt(limit) || 10;

    if (
      isNaN(pageNumber) ||
      pageNumber < 1 ||
      isNaN(limitNumber) ||
      limitNumber < 1
    ) {
      return res
        .status(400)
        .json({ error: "Parámetros de paginación no válidos" });
    }

    const filterStartDate = startDate ? new Date(startDate) : null;
    let filterEndDate = endDate ? new Date(endDate) : null;

    if (filterEndDate) {
      filterEndDate.setHours(23, 59, 59, 999);
    }

    const cacheKey = `EntregasNegocio:${negocioId}:${startDate || ""}:${
      endDate || ""
    }:${cajaId || ""}:${pageNumber}:${limitNumber}`;
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const entregasData = await entregaModel.getEntregasByNegocio(
      negocioId,
      limitNumber,
      pageNumber,
      filterStartDate,
      filterEndDate,
      cajaId
    );
    await redisClient.setEx(cacheKey, 600, JSON.stringify(entregasData));

    res.json(entregasData);
  } catch (error) {
    console.error("Error al obtener entregas del negocio:", error);
    res.status(500).json({ error: "Error al obtener entregas del negocio" });
  }
};

const addEntrega = async (req, res) => {
  try {
    const { ventaId, monto, medioPago, estadoPago, cajaId } = req.body;
    
    // Validar campos obligatorios
    if (!ventaId || (estadoPago !== 1 && !monto) || !medioPago) {
      return res.status(400).json({ 
        success: false, 
        message: "Faltan campos obligatorios" 
      });
    }

    // Obtener la venta
    const venta = await entregaModel.getVentaById(ventaId);
    if (!venta) {
      return res.status(404).json({ 
        success: false, 
        message: "Venta no encontrada" 
      });
    }

    // Mapear medioPago a metodoPagoId
    let metodoPagoId;
    
    // Primera opción: verificar si medioPago es un número válido
    if (!isNaN(medioPago) && parseInt(medioPago) > 0) {
      metodoPagoId = parseInt(medioPago);
    } else {
      // Segunda opción: mapear desde string a ID
      const medioPagoMap = {
        'efectivo': 1,
        'debito': 2,
        'credito': 3,
        'transferencia': 4,
        'qr': 5,
        'pendiente_caja': 6
      };
      
      metodoPagoId = medioPagoMap[medioPago.toLowerCase()];
    }
  

    // Obtener el negocioId de la venta o desde el request si está disponible
    const negocioId = venta.negocioId || req.body.negocioId;
    
    if (!negocioId) {
      return res.status(400).json({ 
        success: false, 
        message: "ID de negocio no encontrado" 
      });
    }

    // Generar número de entrega
    const nroEntrega = await generarNroEntrega();
    
    let montoFinal = parseFloat(monto);
    let nuevoTotalPagado, nuevoSaldoRestante;
    
    // Procesar según estadoPago
    if (estadoPago === 1) { // Pendiente en caja
      // No modificar totalPagado porque queda pendiente
      nuevoTotalPagado = venta.totalPagado || 0;
      montoFinal = parseFloat(venta.total_con_descuento || venta.total || 0);
      nuevoSaldoRestante = venta.total - nuevoTotalPagado;
    } else {
      nuevoTotalPagado = (venta.totalPagado || 0) + montoFinal;
      nuevoSaldoRestante = parseFloat(venta.total_con_descuento || venta.total || 0) - nuevoTotalPagado;
      
      // Validar que el monto no exceda el total
      if (nuevoTotalPagado > parseFloat(venta.total_con_descuento || venta.total || 0)) {
        return res.status(400).json({ 
          success: false, 
          message: "El monto excede el total de la venta" 
        });
      }
    }

    // Asegurar que montoFinal sea un entero si la BD espera Int
    montoFinal = Math.round(montoFinal);

    // Actualizar la venta con el nuevo estado de pago
    await entregaModel.updateVenta(ventaId, {
      estadoPago,
      totalPagado: nuevoTotalPagado,
      restoPendiente: nuevoSaldoRestante,
    });

    // Limpiar caché Redis si corresponde
    const keys = await redisClient.keys("Ventas:*");
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    await clearEntregaCache();

    // Registrar la entrega/pago
    const newEntrega = await entregaModel.addEntrega({
      nroEntrega,
      monto: montoFinal,
      negocioId,
      metodoPagoId,
      ventaId,
      cajaId: cajaId || 1,
    });

    res.json({
      success: true,
      message: "Pago registrado correctamente",
      data: newEntrega
    });
  } catch (error) {
    console.error("Error al registrar el pago:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error al registrar el pago" 
    });
  }
};

const updateEntrega = async (req, res) => {
  try {
    const { monto } = req.body;
    const { id } = req.params;
    if (!id || !monto) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    await clearEntregaCache();

    const updatedEntrega = await entregaModel.updateEntrega(id, monto);
    res.json(updatedEntrega);
  } catch (error) {
    console.error("Error al actualizar la entrega:", error);
    res.status(500).json({ error: "Error al actualizar la entrega" });
  }
};

const dropEntrega = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "El id es obligatorio" });
    }

    await clearEntregaCache();

    const deletedEntrega = await entregaModel.dropEntrega(id);
    res.json(deletedEntrega);
  } catch (error) {
    console.error("Error al eliminar la entrega:", error);
    res.status(500).json({ error: "Error al eliminar la entrega" });
  }
};



module.exports = {
  getEntregas,
  getEntregaById,
  getEntregasByNegocio,
  addEntrega,
  dropEntrega,
  updateEntrega,
  cambiarEstadoVenta,
};
