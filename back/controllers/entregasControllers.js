const entregaModel = require("../models/entregaModel");
const { redisClient } = require("../db");

// Función para eliminar caché de entregas generales, por cliente y por negocio
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

        if (isNaN(pageNumber) || pageNumber < 1 || isNaN(limitNumber) || limitNumber < 1) {
            return res.status(400).json({ error: "Parámetros de paginación no válidos" });
        }

        const cacheKey = `Entregas:${limitNumber}:${pageNumber}`;
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        const entregasData = await entregaModel.getAllEntregas(limitNumber, pageNumber);
        await redisClient.setEx(cacheKey, 600, JSON.stringify(entregasData));

        res.json(entregasData);
    } catch (error) {
        console.error("Error al obtener las entregas:", error);
        res.status(500).json({ error: "Error al obtener las entregas" });
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
}
const getEntregaByCliente = async (req, res) => {
    try {
        const { clienteId } = req.params;
        const { page, limit, startDate, endDate, cajaId } = req.query;
        const pageNumber = parseInt(page) || 1;
        const limitNumber = parseInt(limit) || 10;

        if (isNaN(pageNumber) || pageNumber < 1 || isNaN(limitNumber) || limitNumber < 1) {
            return res.status(400).json({ error: "Parámetros de paginación no válidos" });
        }

        // Convertir fechas a formato Date si existen
        const filterStartDate = startDate ? new Date(startDate) : null;
        let filterEndDate = endDate ? new Date(endDate) : null;

        // Si hay un endDate, ajustarlo para incluir todo el día hasta las 23:59:59
        if (filterEndDate) {
            filterEndDate.setHours(23, 59, 59, 999);
        }

        const cacheKey = `EntregasCliente:${clienteId}:${startDate || ''}:${endDate || ''}:${cajaId || ''}:${pageNumber}:${limitNumber}`;
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        const entregasData = await entregaModel.getEntregasByCliente(clienteId, limitNumber, pageNumber, filterStartDate, filterEndDate, cajaId);
        await redisClient.setEx(cacheKey, 600, JSON.stringify(entregasData));

        res.json(entregasData);
    } catch (error) {
        console.error("Error al obtener entregas del cliente:", error);
        res.status(500).json({ error: "Error al obtener entregas del cliente" });
    }
};

const getEntregasByNegocio = async (req, res) => {
    try {
        const { negocioId } = req.params;
        const { page, limit, startDate, endDate, cajaId } = req.query;

        const pageNumber = parseInt(page) || 1;
        const limitNumber = parseInt(limit) || 10;

        if (isNaN(pageNumber) || pageNumber < 1 || isNaN(limitNumber) || limitNumber < 1) {
            return res.status(400).json({ error: "Parámetros de paginación no válidos" });
        }

        // Convertir fechas a formato Date si existen
        const filterStartDate = startDate ? new Date(startDate) : null;
        let filterEndDate = endDate ? new Date(endDate) : null;

        // Si hay un endDate, ajustarlo para incluir todo el día hasta las 23:59:59
        if (filterEndDate) {
            filterEndDate.setHours(23, 59, 59, 999);
        }

        const cacheKey = `EntregasNegocio:${negocioId}:${startDate || ''}:${endDate || ''}:${cajaId || ''}:${pageNumber}:${limitNumber}`;
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        const entregasData = await entregaModel.getEntregasByNegocio(negocioId, limitNumber, pageNumber, filterStartDate, filterEndDate, cajaId);
        await redisClient.setEx(cacheKey, 600, JSON.stringify(entregasData));

        res.json(entregasData);
    } catch (error) {
        console.error("Error al obtener entregas del negocio:", error);
        res.status(500).json({ error: "Error al obtener entregas del negocio" });
    }
};


const addEntrega = async (req, res) => {
    try {
        const { nroEntrega, monto, clienteId, negocioId, metodoPagoId, cajaId } = req.body;
        if (!nroEntrega || !monto || !clienteId || !negocioId || !metodoPagoId) {
            return res.status(400).json({ error: "Faltan campos obligatorios" });
        }

        await clearEntregaCache(); // Eliminar caché después de agregar

        const newEntrega = await entregaModel.addEntrega({ nroEntrega, monto, clienteId, negocioId, metodoPagoId, cajaId });
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

        await clearEntregaCache(); // Eliminar caché después de actualizar

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

        await clearEntregaCache(); // Eliminar caché después de eliminar

        const deletedEntrega = await entregaModel.updateEntregaStatus(id, 0);
        res.json(deletedEntrega);
    } catch (error) {
        console.error("Error al eliminar la entrega:", error);
        res.status(500).json({ error: "Error al eliminar la entrega" });
    }
};

const upEntrega = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "El id es obligatorio" });
        }

        await clearEntregaCache(); // Eliminar caché después de reactivar

        const restoredEntrega = await entregaModel.updateEntregaStatus(id, 1);
        res.json(restoredEntrega);
    } catch (error) {
        console.error("Error al reactivar la entrega:", error);
        res.status(500).json({ error: "Error al reactivar la entrega" });
    }
};

module.exports = { getEntregas, getEntregaById, getEntregaByCliente, getEntregasByNegocio, addEntrega, dropEntrega, updateEntrega, upEntrega };
