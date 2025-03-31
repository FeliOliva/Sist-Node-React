const tipoUnidadesModel = require('../models/tiposUnidadesModel');
const { redisClient } = require("../db");

const getTiposUnidades = async (req, res) => {
    try {
        const cacheKey = `TipoUnidades:*`;
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }
        const tiposUnidades = await tipoUnidadesModel.getTiposUnidades();
        await redisClient.setEx(cacheKey, 600, JSON.stringify(tiposUnidades));
        res.json(tiposUnidades);
    } catch (error) {
        console.error("Error al obtener los tipos de unidades:", error);
        res.status(500).json({ error: "Error al obtener los tipos de unidades" });
    }
};

const getTiposUnidadesById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Falta el id del tipo de unidad" });
        }
        const tipoUnidades = await tipoUnidadesModel.getTiposUnidadesById(id);
        res.json(tipoUnidades);
    } catch (error) {
        console.error("Error al obtener el tipo de unidad:", error);
        res.status(500).json({ error: "Error al obtener el tipo de unidad" });
    }
}
const addTiposUnidades = async (req, res) => {
    try {
        const { tipo } = req.body;
        if (!tipo) {
            return res.status(400).json({ error: "Falta el tipo del tipo de unidad" });
        }
        const keys = await redisClient.keys("TipoUnidades:*");
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
        const tipoNombre = tipo.toUpperCase();
        const tipoUnidades = await tipoUnidadesModel.addTiposUnidades(tipoNombre);
        res.json(tipoUnidades);
    } catch (error) {
        console.error("Error al añadir el tipo de unidad:", error);
        res.status(500).json({ error: "Error al añadir el tipo de unidad" });
    }
}

const updateTiposUnidades = async (req, res) => {
    try {
        const { tipo } = req.body;
        const { id } = req.params;
        if (!id || !tipo) {
            return res.status(400).json({ error: "Faltan campos obligatorios" });
        }
        const keys = await redisClient.keys("TipoUnidades:*");
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
        const tipoNombre = tipo.toUpperCase();
        const updatedTipoUnidades = await tipoUnidadesModel.updateTiposUnidades(id, tipoNombre);
        res.json(updatedTipoUnidades);
    } catch (error) {
        console.error("Error al actualizar el tipo de unidad:", error);
        res.status(500).json({ error: "Error al actualizar el tipo de unidad" });
    }
}

const dropTiposUnidades = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Falta el id del tipo de unidad" });
        }
        const keys = await redisClient.keys("TipoUnidades:*");
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
        await tipoUnidadesModel.updateTipoUnidadesStatus(id, 0);
        res.json({ message: "Tipo de unidad eliminado" });
    } catch (error) {
        console.error("Error al eliminar el tipo de unidad:", error);
        res.status(500).json({ error: "Error al eliminar el tipo de unidad" });
    }
}

const upTiposUnidades = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Falta el id del tipo de unidad" });
        }
        const keys = await redisClient.keys("TipoUnidades:*");
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
        const upTipoUnidades = await tipoUnidadesModel.updateTipoUnidadesStatus(id, 1);
        res.json(upTipoUnidades);
    } catch (error) {
        console.error("Error al activar el tipo de unidad:", error);
        res.status(500).json({ error: "Error al activar el tipo de unidad" });
    }
}

module.exports = {
    getTiposUnidades,
    getTiposUnidadesById,
    addTiposUnidades,
    updateTiposUnidades,
    dropTiposUnidades,
    upTiposUnidades
};