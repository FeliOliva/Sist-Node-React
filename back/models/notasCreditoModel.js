const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getNotasCredito = async (limit, page) => {
    try {
        limit = parseInt(limit) || 10;
        page = parseInt(page) || 1;

        const offset = (page - 1) * limit;
        const notasCredito = await prisma.notaCredito.findMany({
            skip: offset,
            take: limit,
            include: {
                cliente: {
                    select: {
                        nombre: true,
                        apellido: true
                    }
                },
                negocio: {
                    select: {
                        nombre: true
                    }
                },
            },
        });
        const totalNotasCredito = await prisma.notaCredito.count();

        return {
            notasCredito,
            total: totalNotasCredito,
            totalPages: Math.ceil(totalNotasCredito / limit),
            currentPage: page
        }
    } catch (error) {
        console.error("Error al obtener todas las notas de credito", error);
        throw new Error("Error al obtener las notas de credito");
    }
}

const getNotasCreditoByClienteId = async (clienteId, limit, page) => {
    try {
        limit = parseInt(limit) || 10;
        page = parseInt(page) || 1;

        const offset = (page - 1) * limit;
        const notasCredito = await prisma.notaCredito.findMany({
            where: { clienteId: parseInt(clienteId) },
            skip: offset,
            take: limit,
            include: {
                cliente: {
                    select: {
                        nombre: true,
                        apellido: true
                    }
                },
                negocio: {
                    select: {
                        nombre: true
                    }
                },
            },
        });
        const totalNotasCredito = await prisma.notaCredito.count();

        return {
            notasCredito,
            total: totalNotasCredito,
            totalPages: Math.ceil(totalNotasCredito / limit),
            currentPage: page
        }
    } catch (error) {
        console.error("Error al obtener las notas de credito por cliente id", error);
        throw new Error("Error al obtener las notas de credito por cliente id");
    }
}

const getNotasCreditoByNegocioId = async (negocioId, limit, page) => {
    try {
        limit = parseInt(limit) || 10;
        page = parseInt(page) || 1;

        const offset = (page - 1) * limit;
        const notasCredito = await prisma.notaCredito.findMany({
            where: { negocioId: parseInt(negocioId) },
            skip: offset,
            take: limit,
            include: {
                cliente: {
                    select: {
                        nombre: true,
                        apellido: true
                    }
                },
                negocio: {
                    select: {
                        nombre: true
                    }
                },
            },
        });
        const totalNotasCredito = await prisma.notaCredito.count();

        return {
            notasCredito,
            total: totalNotasCredito,
            totalPages: Math.ceil(totalNotasCredito / limit),
            currentPage: page
        }
    } catch (error) {
        console.error("Error al obtener las notas de credito por negocio id", error);
        throw new Error("Error al obtener las notas de credito por negocio id");
    }
}

const getNotasCreditoById = async (id) => {
    try {
        return await prisma.notaCredito.findUnique({
            where: { id: parseInt(id) }
        });
    } catch (error) {
        console.error("Error al obtener la nota de credito", error);
        throw new Error("Error al obtener la nota de credito");
    }
}

const addNotasCredito = async (data) => {
    try {
        return await prisma.notaCredito.create({
            data
        });
    } catch (error) {
        console.error("Error al agregar la nota de credito", error);
        throw new Error("Error al agregar la nota de credito");
    }
}

const updateNotasCredito = async (id, motivo, monto) => {
    try {
        return await prisma.notaCredito.update({
            where: { id: parseInt(id) },
            data: { motivo, monto }
        });
    } catch (error) {
        console.error("Error al actualizar la nota de credito", error);
        throw new Error("Error al actualizar la nota de credito");
    }
}

const updateNotasCreditoStatus = async (id, estado) => {
    try {
        return await prisma.notaCredito.update({
            where: { id: parseInt(id) },
            data: { estado }
        });
    } catch (error) {
        console.error("Error al actualizar el estado de la nota de credito", error);
        throw new Error("Error al actualizar el estado de la nota de credito");
    }
}

module.exports = { getNotasCredito, getNotasCreditoByClienteId, getNotasCreditoByNegocioId, getNotasCreditoById, addNotasCredito, updateNotasCredito, updateNotasCreditoStatus };