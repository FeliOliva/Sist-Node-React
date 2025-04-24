const entregaModel = require("../models/entregaModel");
const { redisClient } = require("../db");

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
    const { nroEntrega, monto, negocioId, metodoPagoId, ventaId, cajaId } =
      req.body;
    if (
      !nroEntrega ||
      !monto ||
      !negocioId ||
      !metodoPagoId ||
      !ventaId ||
      !cajaId
    ) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const venta = await entregaModel.getVentaById(ventaId);
    if (!venta) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }
    let estado;
    let nuevoTotalPagado = venta.totalPagado + monto;
    let nuevoSaldoRestante = venta.total - nuevoTotalPagado;

    if (nuevoTotalPagado > venta.total) {
      return res
        .status(400)
        .json({ error: "El monto excede el total de la venta" });
    }

    if (nuevoTotalPagado === venta.total) {
      estado = 2; // totalPagado
    } else {
      estado = 3; // parcialPagado
    }

    // Actualizar la venta
    await entregaModel.updateVenta(ventaId, {
      estadoPago: estado,
      totalPagado: nuevoTotalPagado,
      restoPendiente: nuevoSaldoRestante,
    });

    // Limpiar caché Redis si corresponde
    const keys = await redisClient.keys("Ventas:*");
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    await clearEntregaCache();

    const newEntrega = await entregaModel.addEntrega({
      nroEntrega,
      monto,
      negocioId,
      metodoPagoId,
      ventaId,
      cajaId,
    });
    res.json(newEntrega);
  } catch (error) {
    console.error("Error al agregar la entrega:", error);
    res.status(500).json({ error: "Error al agregar la entrega" });
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
