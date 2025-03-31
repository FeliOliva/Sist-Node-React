const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllClients = async () => {
    try {
        const clients = await prisma.cliente.findMany()
        const totalClients = await prisma.cliente.count();

        return {
            clients,
            total: totalClients,
        };
    } catch (error) {
        console.error("Error en getClients:", error);
        throw new Error("Error al obtener los clientes");
    }
}

const getClients = async (limit, page) => {
    try {
        const offset = (page - 1) * limit;

        const clients = await prisma.cliente.findMany({
            skip: offset,
            take: limit
        });

        const totalClients = await prisma.cliente.count();

        return {
            clients,
            total: totalClients,
            totalPages: Math.ceil(totalClients / limit),
            currentPage: page
        };
    } catch (error) {
        console.error("Error en getClients:", error);
        throw new Error("Error al obtener los clientes");
    }
};

const getClientById = async (id) => {
    try {
        return await prisma.cliente.findUnique({ where: { id: parseInt(id) } });
    } catch (error) {
        console.error("Error consultando clientes:", error);
        throw error;
    }
}

const addClient = async (data) => {
    try {
        return await prisma.cliente.create({ data })
    } catch (error) {
        console.error("Error consultando clientes:", error);
        throw error;
    }
}

const updateClient = async (id, data) => {
    try {
        return await prisma.cliente.update({
            where: { id: parseInt(id) },
            data
        });
    } catch (error) {
        console.error("Error actualizando cliente:", error);
        throw new Error("No se pudo actualizar el cliente");
    }
};

const updateClienteStatus = async (id, estado) => {
    try {
        return await prisma.cliente.update({
            where: { id: parseInt(id) },
            data: { estado },
        });
    } catch (error) {
        console.error("Error actualizando el estado de cliente:", error);
        throw error;
    }
}
module.exports = { getAllClients, getClients, addClient, updateClient, updateClienteStatus, getClientById };