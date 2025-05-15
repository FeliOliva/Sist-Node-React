const entregaModel = require("../models/entregaModel");
const { redisClient } = require("../db");
const { actualizarVenta } = require("../websocket");

const generarNroEntrega = async () => {
  try {
    // Obtener la fecha actual en formato AAAAMMDD
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");
    const fechaStr = `${anio}${mes}${dia}`;

    // Buscar la última entrega del día para determinar el siguiente número secuencial
    const ultimaEntrega = await entregaModel.getUltimaEntregaDelDia();

    let numeroSecuencial = 1; // Valor por defecto si no hay entregas previas

    if (ultimaEntrega && ultimaEntrega.nroEntrega) {
      // Verificar si la última entrega es del mismo día
      const partes = ultimaEntrega.nroEntrega.split("-");
      if (partes.length === 2 && partes[0] === fechaStr) {
        // Si es del mismo día, incrementar el contador
        numeroSecuencial = parseInt(partes[1]) + 1;
      }
    }

    // Formatear el número secuencial con ceros a la izquierda
    const secuencialStr = String(numeroSecuencial).padStart(4, "0");

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
    const { monto, metodoPagoId, cajaId, negocioId, ventaId, pagoOtroDia } =
      req.body;
    if ((!monto && !pagoOtroDia) || !cajaId || !negocioId) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos requeridos para crear la entrega",
      });
    }

    // Si es un pago para otro día, sólo actualizamos la venta
    if (pagoOtroDia && ventaId) {
      const ventaActualizada = await entregaModel.marcarVentaParaPagoOtroDia(
        ventaId
      );
      let estadoSocket = "venta-aplazada";
      actualizarVenta(cajaId, ventaActualizada, estadoSocket);
      return res.status(200).json({
        success: true,
        message: "Venta marcada para pago en otro día",
        data: ventaActualizada,
      });
    }

    // Crear nueva entrega
    const nuevaEntrega = await entregaModel.addEntrega({
      monto,
      negocioId,
      metodoPagoId,
      cajaId,
      ventaId,
    });

    let venta = null;
    // Si tiene ID de venta, actualizar su estado
    if (ventaId) {
      const resultado = await entregaModel.actualizarVentaPorEntrega(
        ventaId,
        monto
      );
      venta = resultado.venta;
      const estadoSocket = resultado.estadoSocket;

      console.log("ventaActualizada", venta);
      console.log("estadoSocket", estadoSocket);

      actualizarVenta(cajaId, venta, estadoSocket);
    }

    // Devolver respuesta exitosa
    return res.status(201).json({
      success: true,
      message: "Entrega creada correctamente",
      data: {
        entrega: nuevaEntrega,
        venta,
      },
    });
  } catch (error) {
    console.error("Error al crear entrega:", error);
    return res.status(500).json({
      success: false,
      message: "Error al procesar la solicitud",
      error: error.message,
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

const getTotalesEntregasDelDiaPorCaja = async (req, res) => {
  try {
    const totales = await entregaModel.getTotalesEntregasDelDiaPorCaja();
    res.json(totales);
  } catch (error) {
    res.status(500).json({
      error: "Error al obtener los totales de entregas del día por caja",
    });
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
  getTotalesEntregasDelDiaPorCaja,
};
