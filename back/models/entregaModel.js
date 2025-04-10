const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllEntregas = async (limit, page) => {
    try {
        limit = parseInt(limit) || 10;
        page = parseInt(page) || 1;

        const offset = (page - 1) * limit;
        const entregas = await prisma.entregas.findMany({
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
                metodoPago: {
                    select: {
                        nombre: true
                    }
                }
            },
        });
        const totalEntregas = await prisma.entregas.count();

        return {
            entregas,
            total: totalEntregas,
            totalPages: Math.ceil(totalEntregas / limit),
            currentPage: page
        };
    } catch (error) {
        console.error("Error obteniendo todas las entregas:", error);
        throw new Error("Error al obtener las entregas");
    }
};

const getEntregaById = async (id) => {
    try {
        return await prisma.entregas.findUnique({
            where: { id: parseInt(id) },
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
                metodoPago: {
                    select: {
                        nombre: true
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error obteniendo entrega por id:", error);
        throw new Error("Error al obtener la entrega por id");
    }

}

const getEntregasByCliente = async (clienteId, limit, page, startDate, endDate, cajaId) => {
    try {
        limit = parseInt(limit) || 10;
        page = parseInt(page) || 1;

        const offset = (page - 1) * limit;
        // Convertir fechas a UTC correctamente
        const filterStartDate = startDate ? new Date(startDate) : null;
        const filterEndDate = endDate ? new Date(endDate) : null;

        if (filterEndDate) {
            filterEndDate.setUTCHours(23, 59, 59, 999); // Asegurar que se incluye todo el día en UTC
        }

        const whereClause = {
            clienteId: parseInt(clienteId),
            estado: 1,
            ...(filterStartDate && { fechaCreacion: { gte: filterStartDate.toISOString() } }),
            ...(filterEndDate && { fechaCreacion: { lte: filterEndDate.toISOString() } }),
            ...(cajaId && { cajaId: parseInt(cajaId) })
        };
        const entregas = await prisma.entregas.findMany({
            where: whereClause,
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
                metodoPago: {
                    select: {
                        nombre: true
                    }
                }
            }
        });
        const totalEntregas = await prisma.entregas.count({
            where: whereClause
        });

        return {
            entregas,
            total: totalEntregas,
            totalPages: Math.ceil(totalEntregas / limit),
            currentPage: page
        };
    } catch (error) {
        console.error("Error obteniendo entregas por cliente:", error);
        throw new Error("Error al obtener las entregas del cliente");
    }
};

const getEntregasByNegocio = async (negocioId, limit, page, startDate, endDate, cajaId) => {
    try {
        limit = parseInt(limit) || 10;
        page = parseInt(page) || 1;
        const offset = (page - 1) * limit;

        // Convertir fechas a UTC correctamente
        const filterStartDate = startDate ? new Date(startDate) : null;
        const filterEndDate = endDate ? new Date(endDate) : null;

        if (filterEndDate) {
            filterEndDate.setUTCHours(23, 59, 59, 999); // Asegurar que se incluye todo el día en UTC
        }

        const whereClause = {
            negocioId: parseInt(negocioId),
            estado: 1,
            ...(filterStartDate && { fechaCreacion: { gte: filterStartDate.toISOString() } }),
            ...(filterEndDate && { fechaCreacion: { lte: filterEndDate.toISOString() } }),
            ...(cajaId && { cajaId: parseInt(cajaId) })
        };

        const entregas = await prisma.entregas.findMany({
            where: whereClause,
            skip: offset,
            take: limit,
            include: {
                cliente: { select: { nombre: true, apellido: true } },
                negocio: { select: { nombre: true } },
                metodoPago: { select: { nombre: true } }
            }
        });

        const totalEntregas = await prisma.entregas.count({ where: whereClause });

        return {
            entregas,
            total: totalEntregas,
            totalPages: Math.ceil(totalEntregas / limit),
            currentPage: page
        };
    } catch (error) {
        console.error("Error obteniendo entregas por negocio:", error);
        throw new Error("Error al obtener las entregas del negocio");
    }
};

const addEntrega = async (data) => {
    try {
        return await prisma.entregas.create({ data });
    } catch (error) {
        console.error("Error agregando entrega:", error);
        throw new Error("Error al agregar la entrega");
    }
};

const updateEntrega = async (id, monto) => {
    try {
        return await prisma.entregas.update({
            where: { id: parseInt(id) },
            data: { monto }
        });
    } catch (error) {
        console.error("Error actualizando entrega:", error);
        throw new Error("Error al actualizar la entrega");
    }
};

const dropEntrega = async (id) => {
    try {
        return await prisma.entregas.delete({
            where: { id: parseInt(id) }
        });
    } catch (error) {
        console.error("Error eliminando entrega:", error);
        throw new Error("Error al eliminar la entrega");
    }
}
module.exports = {
    getAllEntregas,
    getEntregaById,
    getEntregasByCliente,
    getEntregasByNegocio,
    addEntrega,
    updateEntrega,
    dropEntrega
};
