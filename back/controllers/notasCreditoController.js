const notasCreditoModel = require("../models/notasCreditoModel");
const { redisClient } = require("../db");

const clearNotasCreditoCache = async () => {
    try {
        const keys = await redisClient.keys("NotasCredito:*");
        const clientKeys = await redisClient.keys("NotasCreditoCliente:*");
        const negocioKeys = await redisClient.keys("NotasCreditoNegocio:*");

        const allKeys = [...keys, ...clientKeys, ...negocioKeys];

        if (allKeys.length > 0) {
            await redisClient.del(allKeys);
        }
    } catch (error) {
        console.error("Error al limpiar la caché de NotasCredito:", error);
    }
};

const getNotasCredito = async (req, res) => {
    try {
        const { page, limit } = req.query;
        const pageNumber = parseInt(page) || 1;
        const limitNumber = parseInt(limit) || 10;

        if (isNaN(pageNumber) || pageNumber < 1 || isNaN(limitNumber) || limitNumber < 1) {
            return res.status(400).json({ error: "Parámetros de paginación no válidos" });
        }

        const cacheKey = `NotasCredito:${limitNumber}:${pageNumber}`;
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        const notasCreditoData = await notasCreditoModel.getNotasCredito(limitNumber, pageNumber);
        await redisClient.setEx(cacheKey, 600, JSON.stringify(notasCreditoData));

        res.json(notasCreditoData);

    } catch (error) {
        console.error("Error al obtener las NotasCredito:", error);
        res.status(500).json({ error: "Error al obtener las NotasCredito" });
    }
};

const getNotasCreditoById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "El id es obligatorio" });
        }
        const notasCreditoData = await notasCreditoModel.getNotasCreditoById(id);
        res.json(notasCreditoData);
    } catch (error) {
        console.error("Error al obtener la NotaCredito:", error);
        res.status(500).json({ error: "Error al obtener la NotaCredito" });
    }
};

const getNotasCreditoByClienteId = async (req, res) => {
    try {
        const { clienteId } = req.params;
        const { page, limit } = req.query;
        const pageNumber = parseInt(page) || 1;
        const limitNumber = parseInt(limit) || 10;

        if (isNaN(pageNumber) || pageNumber < 1 || isNaN(limitNumber) || limitNumber < 1) {
            return res.status(400).json({ error: "Parámetros de paginación no válidos" });
        }

        const cacheKey = `NotasCreditoCliente:${limitNumber}:${pageNumber}`;
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        const notasCreditoData = await notasCreditoModel.getNotasCreditoByClienteId(clienteId, limitNumber, pageNumber);
        await redisClient.setEx(cacheKey, 600, JSON.stringify(notasCreditoData));

        res.json(notasCreditoData);
    } catch (error) {
        console.error("Error al obtener las notas de credito por cliente id", error)
        res.status(500).json({ error: "Error al obtener las notas de credito x cliente" })
    }
}

const getNotasCreditoByNegocioId = async (req, res) => {
    try {
        const { negocioId } = req.params;
        const { page, limit } = req.query;
        const pageNumber = parseInt(page) || 1;
        const limitNumber = parseInt(limit) || 10;

        if (isNaN(pageNumber) || pageNumber < 1 || isNaN(limitNumber) || limitNumber < 1) {
            return res.status(400).json({ error: "Parámetros de paginación no válidos" });
        }

        const cacheKey = `NotasCreditoNegocio:${limitNumber}:${pageNumber}`;
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        const notasCreditoData = await notasCreditoModel.getNotasCreditoByNegocioId(negocioId, limitNumber, pageNumber);
        await redisClient.setEx(cacheKey, 600, JSON.stringify(notasCreditoData));

        res.json(notasCreditoData);
    } catch (error) {
        console.error("Error al obtener las notas de credito por cliente id", error)
        res.status(500).json({ error: "Error al obtener las notas de credito x cliente" })
    }
}

const addNotasCredito = async (req, res) => {
    try {
        const { motivo, monto, clienteId, negocioId } = req.body;
        if (!motivo || !monto || !clienteId || !negocioId) {
            return res.status(400).json({ error: "Faltan datos obligatorios" });
        }
        await clearNotasCreditoCache();

        const notasCreditoData = await notasCreditoModel.addNotasCredito({ motivo, monto, clienteId, negocioId });
        res.json(notasCreditoData);
    } catch (error) {
        console.error("Error al agregar la nota de credito", error);
        res.status(500).json({ error: "Error al agregar la nota de credito" });
    }
}

const updateNotasCredito = async (req, res) => {
    try {
        const { motivo, monto } = req.body;
        const { id } = req.params;
        if (!id || !motivo || !monto) {
            return res.status(400).json({ error: "Faltan datos obligatorios" });
        }
        await clearNotasCreditoCache();

        const notasCreditoData = await notasCreditoModel.updateNotasCredito(id, motivo, monto);
        res.json(notasCreditoData);
    } catch (error) {
        console.error("Error al actualizar la nota de credito", error);
        res.status(500).json({ error: "Error al actualizar la nota de credito" });
    }
}

const dropNotasCredito = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Falta el id de la nota de credito" });
        }
        await clearNotasCreditoCache();
        const deletedNotaCredito = await notasCreditoModel.dropNotasCredito(id);
        res.json(deletedNotaCredito);
    } catch (error) {
        console.error("Error al eliminar la nota de credito", error);
        res.status(500).json({ error: "Error al eliminar la nota de credito" });
    }
}


module.exports = {
    getNotasCredito,
    getNotasCreditoById,
    getNotasCreditoByClienteId,
    getNotasCreditoByNegocioId,
    addNotasCredito,
    updateNotasCredito,
    dropNotasCredito
};