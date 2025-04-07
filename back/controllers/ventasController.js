const ventaModel = require("../models/ventaModel");
const { redisClient } = require("../db");

const getVentas = async (req, res) => {
    try {
        const { page, limit } = req.query;
        const pageNumber = parseInt(page) || 1;
        const limitNumber = parseInt(limit) || 10;

        if (pageNumber < 1 || limitNumber < 1) {
            return res.status(400).json({ error: "Los parámetros de paginación no son válidos" });
        }

        const cacheKey = `Ventas:${limitNumber}:${pageNumber}`;
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        const ventasData = await ventaModel.getVentas(limitNumber, pageNumber);
        await redisClient.setEx(cacheKey, 600, JSON.stringify(ventasData));

        res.status(200).json(ventasData);
    } catch (error) {
        console.error("Error al obtener las ventas:", error);
        res.status(500).json({ error: "Error al obtener las ventas" });
    }
};

const getVentaById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "El id es obligatorio" });
        }
        const ventaData = await ventaModel.getVentaById(id);
        res.status(200).json(ventaData);
    } catch (error) {
        console.error("Error al obtener la venta:", error);
        res.status(500).json({ error: "Error al obtener la venta" });
    }
}

const getVentasByCliente = async (req, res) => {
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

        const cacheKey = `VentasCliente:${clienteId}:${startDate || ''}:${endDate || ''}:${cajaId || ''}:${pageNumber}:${limitNumber}`;
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        const ventasData = await ventaModel.getVentasByCliente(clienteId, limitNumber, pageNumber, filterStartDate, filterEndDate, cajaId);
        await redisClient.setEx(cacheKey, 600, JSON.stringify(ventasData));

        res.json(ventasData);
    } catch (error) {
        console.error("Error al obtener la venta por cliente:", error);
        res.status(500).json({ error: "Error al obtener la venta por cliente" });
    }
}

const getVentasByNegocio = async (req, res) => {
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

        const cacheKey = `VentasNegocio:${negocioId}:${startDate || ''}:${endDate || ''}:${cajaId || ''}:${pageNumber}:${limitNumber}`;
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        const ventasData = await ventaModel.getVentasByNegocio(negocioId, limitNumber, pageNumber, filterStartDate, filterEndDate, cajaId);
        await redisClient.setEx(cacheKey, 600, JSON.stringify(ventasData));

        res.json(ventasData);
    } catch (error) {
        console.error("Error al obtener la venta por cliente:", error);
        res.status(500).json({ error: "Error al obtener la venta por cliente" });
    }
}

const addVenta = async (req, res) => {
    try {
        const { id, nroVenta, clienteId, negocioId, cajaId, rol_usuario, detalles } = req.body;

        if (rol_usuario !== 0 && rol_usuario !== 1) {
            return res.status(401).json({ error: "No tienes permiso para realizar esta acción" });
        }

        if (!nroVenta || !negocioId || !detalles || detalles.length === 0) {
            return res.status(400).json({ error: "Faltan campos obligatorios" });
        }

        const detallesProcesados = detalles.map(detalle => ({
            ...detalle,
            subTotal: detalle.cantidad * detalle.precio
        }));

        const totalCalculado = detallesProcesados.reduce((sum, detalle) => sum + detalle.subTotal, 0);

        const keys = await redisClient.keys("Ventas:*");
        if (keys.length > 0) {
            await redisClient.del(keys);
        }

        let venta;

        if (id) {
            venta = await ventaModel.updateVenta({
                id,
                nroVenta,
                total: totalCalculado,
                clienteId,
                negocioId,
                cajaId,
                detalles: detallesProcesados,
            });
        } else {
            venta = await ventaModel.addVenta({
                nroVenta,
                total: totalCalculado,
                clienteId,
                negocioId,
                cajaId,
                detalles: detallesProcesados,
            });
        }

        res.status(200).json(venta);
    } catch (error) {
        console.error("Error al guardar la venta:", error);
        res.status(500).json({ error: "Error al guardar la venta" });
    }
};


const dropVenta = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "El id es obligatorio" });
        }
        const keys = await redisClient.keys("Ventas:*");
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
        const ventaData = await ventaModel.updateVentaStatus(id, 0);
        res.status(200).json(ventaData);
    } catch (error) {
        console.error("Error al eliminar la venta:", error);
        res.status(500).json({ error: "Error al eliminar la venta" });
    }
}

const upVenta = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "El id es obligatorio" });
        }
        const keys = await redisClient.keys("Ventas:*");
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
        const ventaData = await ventaModel.updateVentaStatus(id, 1);
        res.status(200).json(ventaData);
    } catch (error) {
        console.error("Error al actualizar la venta:", error);
        res.status(500).json({ error: "Error al actualizar la venta" });
    }
}

module.exports = { getVentas, getVentaById, addVenta, dropVenta, upVenta, getVentasByCliente, getVentasByNegocio };