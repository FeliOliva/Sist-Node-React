const clientModel = require("../models/clientModel");
const { redisClient } = require("../db");

const getAllClients = async (req, res) => {
    try {
        const clientsData = await clientModel.getAllClients()
        res.status(200).json(clientsData);
    } catch (error) {
        console.error("Error al obtener clientes:", error);
        res.status(500).json({ error: "Error al obtener clientes" });
    }
}
const getClients = async (req, res) => {
    try {
        const { page, limit } = req.query;
        const pageNumber = parseInt(page) || 1;
        const limitNumber = parseInt(limit) || 10;

        if (pageNumber < 1 || limitNumber < 1) {
            return res.status(400).json({ error: "Los parámetros de paginación no son válidos" });
        }

        const cacheKey = `clients:${limitNumber}:${pageNumber}`;

        //Verificar si los datos están en caché
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData)); // Retorna la caché
        }

        //Consultar la base de datos con Prisma
        const clientsData = await clientModel.getClients(limitNumber, pageNumber);

        //Guardar en Redis con expiración de 10 minutos
        await redisClient.setEx(cacheKey, 600, JSON.stringify(clientsData));

        res.status(200).json(clientsData);
    } catch (error) {
        console.error("Error al obtener clientes:", error);
        res.status(500).json({ error: "Error al obtener clientes" });
    }
};


const getClientById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "El id es obligatorio" });
        }
        const client = await clientModel.getClientById(id);
        res.json(client);
    } catch (error) {
        console.error("Error al obtener el cliente:", error);
        res.status(500).json({ error: "Error al obtener el cliente" });
    }
}

const addClient = async (req, res) => {
    try {
        const { nombre, apellido, telefono, editable, rol_usuario } = req.body;
        if (rol_usuario !== 0) {
            return res.status(401).json({ error: "No tienes permiso para realizar esta acción" });
        }
        if (!nombre || !apellido || editable === undefined) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }
        const keys = await redisClient.keys("clients:*");
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
        const newClient = await clientModel.addClient({ nombre: nombre.toUpperCase(), apellido: apellido.toUpperCase(), telefono, editable });
        res.json(newClient);
    }
    catch (error) {
        console.error("Error al obtener los clientes:", error);
        res.status(500).json({ error: "Error al obtener los clientes" });
    }
}
const updateClient = async (req, res) => {
    try {
        const { nombre, apellido, telefono, editable, rol_usuario } = req.body;
        const { id } = req.params;

        if (rol_usuario !== 0) {
            return res.status(401).json({ error: "No tienes permiso para realizar esta acción" });
        }

        if (!id) {
            return res.status(400).json({ error: "El id es obligatorio" });
        }

        const client = await clientModel.getClientById(id);
        if (!client) {
            return res.status(404).json({ error: "El cliente no existe" });
        }

        if (!nombre || !apellido) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }
        await redisClient.del(`clients:${id}`);

        const keys = await redisClient.keys("cliens:*");
        if (keys.length > 0) {
            await redisClient.del(keys);
        }

        await clientModel.updateClient(id, {
            nombre: nombre.toUpperCase(),
            apellido: apellido.toUpperCase(),
            telefono,
            editable,
        });

        res.status(200).json({ message: "Cliente actualizado correctamente" });
    } catch (error) {
        console.error("Error al actualizar el cliente:", error);
        res.status(500).json({ error: "Error al editar el cliente" });
    }
};

const deleteClient = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "El id es obligatorio" });
        }
        await redisClient.del(`clients:${id}`);

        const keys = await redisClient.keys("clients:*");
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
        const deletedClient = await clientModel.updateClienteStatus(id, 0);
        res.json(deletedClient);
    } catch (error) {
        console.error("Error al desactivar el cliente:", error);
        res.status(500).json({ error: "Error al desactivar el cliente" });
    }
}
const upClient = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "El id es obligatorio" });
        }
        await redisClient.del(`clients:${id}`);

        const keys = await redisClient.keys("clients:*");
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
        const upClient = await clientModel.updateClienteStatus(id, 1);
        res.json(upClient);
    } catch (error) {
        console.error("Error al Activar el cliente:", error);
        res.status(500).json({ error: "Error al activar el cliente" });
    }
}



module.exports = { getAllClients, getClients, addClient, updateClient, deleteClient, upClient, getClientById };