const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getVentas = async (limitNumber, pageNumber) => {
    try {
        const offset = (pageNumber - 1) * limitNumber;

        const ventas = await prisma.venta.findMany({
            skip: offset,
            take: limitNumber,
            include: {
                cliente: {
                    select: { nombre: true, apellido: true }
                },
                negocio: {
                    select: { nombre: true }
                },
                caja: {
                    select: { nombre: true }
                },
                detalles: {
                    include: {
                        producto: true
                    }
                }
            }
        });

        const totalVentas = await prisma.venta.count();

        return {
            ventas,
            total: totalVentas,
            totalPages: Math.ceil(totalVentas / limitNumber),
            currentPage: pageNumber
        };

    } catch (error) {
        console.error("Error al obtener las ventas:", error);
        throw new Error("Error al obtener las ventas");
    }
};

const getVentasByNegocioId = async (negocioId, cajaId, startDate, endDate) => {
    try {
        const ventas = await prisma.venta.findMany({
            where: {
                negocioId: parseInt(negocioId),
                cajaId: parseInt(cajaId),
                fechaCreacion: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                cliente: {
                    select: { nombre: true, apellido: true }
                },
                negocio: {
                    select: { nombre: true }
                },
                caja: {
                    select: { nombre: true }
                },
                detalles: {
                    include: {
                        producto: true
                    }
                }
            }
        });

        const totalVentas = await prisma.venta.count({
            where: {
                negocioId: parseInt(negocioId),
                cajaId: parseInt(cajaId),
                fechaCreacion: {
                    gte: startDate,
                    lte: endDate,
                }
            }
        });

        return {
            ventas,
            total: totalVentas,
        };

    } catch (error) {
        console.error("Error al obtener las ventas por negocio y caja:", error);
        throw new Error("Error al obtener las ventas por negocio y caja");
    }
};

const getVentaById = async (id) => {
    try {
        return await prisma.venta.findUnique({ where: { id: parseInt(id) } });
    } catch (error) {
        console.error("Error consultando ventas:", error);
        throw new Error("Error al obtener la venta");
    }
}

const getVentasByCliente = async (clienteId, limit, page, startDate, endDate, cajaId) => {
    try {
        limit = parseInt(limit) || 10;
        page = parseInt(page) || 1;

        const offset = (page - 1) * limit;
        const filterStartDate = startDate ? new Date(startDate) : null;
        const filterEndDate = endDate ? new Date(endDate) : null;

        if (filterEndDate) {
            filterEndDate.setHours(23, 59, 59, 999);
        }
        const whereClause = {
            clienteId: parseInt(clienteId),
            ...(filterStartDate && { fechaCreacion: { gte: filterStartDate.toISOString() } }),
            ...(filterEndDate && { fechaCreacion: { lte: filterEndDate.toISOString() } }),
            ...(cajaId && { cajaId: parseInt(cajaId) })
        };
        const ventas = await prisma.venta.findMany({
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
                caja: {
                    select: {
                        nombre: true
                    }
                },
                detalles: {
                    include: {
                        producto: true
                    }
                }
            }
        })
        const totalVentas = await prisma.venta.count({ where: whereClause });
        return {
            ventas,
            total: totalVentas,
            totalPages: Math.ceil(totalVentas / limit),
            currentPage: page
        }

    } catch (error) {
        console.error("Error al obtener la entrega por cliente:", error);
        throw new Error("Error al obtener la entrega por cliente");
    }
}

const getVentasByNegocio = async (negocioId, limit, page, startDate, endDate, cajaId) => {
    try {
        limit = parseInt(limit) || 10;
        page = parseInt(page) || 1;

        const offset = (page - 1) * limit;
        const filterStartDate = startDate ? new Date(startDate) : null;
        const filterEndDate = endDate ? new Date(endDate) : null;

        if (filterEndDate) {
            filterEndDate.setHours(23, 59, 59, 999);
        }
        const whereClause = {
            negocioId: parseInt(negocioId),
            ...(filterStartDate && { fechaCreacion: { gte: filterStartDate.toISOString() } }),
            ...(filterEndDate && { fechaCreacion: { lte: filterEndDate.toISOString() } }),
            ...(cajaId && { cajaId: parseInt(cajaId) })
        };
        const ventas = await prisma.venta.findMany({
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
                caja: {
                    select: {
                        nombre: true
                    }
                },
                detalles: {
                    include: {
                        producto: true
                    }
                }
            }
        })
        const totalVentas = await prisma.venta.count({ where: whereClause });
        return {
            ventas,
            total: totalVentas,
            totalPages: Math.ceil(totalVentas / limit),
            currentPage: page
        }

    } catch (error) {
        console.error("Error al obtener la entrega por cliente:", error);
        throw new Error("Error al obtener la entrega por cliente");
    }
}

const addVenta = async (data) => {
    try {
        return await prisma.$transaction(async (prisma) => {
            const nuevaVenta = await prisma.venta.create({
                data: {
                    nroVenta: data.nroVenta,
                    total: data.total, // Se pasa el total ya calculado desde el controlador
                    clienteId: data.clienteId || null,
                    negocioId: data.negocioId,
                    cajaId: data.cajaId || null,
                },
            });

            await prisma.detalleVenta.createMany({
                data: data.detalles.map((detalle) => ({
                    precio: detalle.precio,
                    cantidad: detalle.cantidad,
                    subTotal: detalle.subTotal, // `subTotal` ya está calculado
                    ventaId: nuevaVenta.id,
                    productoId: detalle.productoId,
                })),
            });

            return {
                ...nuevaVenta,
                detalles: data.detalles,
            };
        });
    } catch (error) {
        console.error("Error al agregar la venta:", error);
        throw new Error("Error al agregar la venta");
    }
};

const updateVenta = async (data) => {
    try {
        return await prisma.$transaction(async (prisma) => {
            // Eliminar detalles anteriores
            await prisma.detalleVenta.deleteMany({
                where: { ventaId: parseInt(data.id) },
            });

            // Actualizar la venta
            const ventaActualizada = await prisma.venta.update({
                where: { id: parseInt(data.id) },
                data: {
                    nroVenta: data.nroVenta,
                    total: data.total,
                    clienteId: data.clienteId || null,
                    negocioId: data.negocioId,
                    cajaId: data.cajaId || null,
                },
            });

            // Agregar los nuevos detalles
            await prisma.detalleVenta.createMany({
                data: data.detalles.map((detalle) => ({
                    precio: detalle.precio,
                    cantidad: detalle.cantidad,
                    subTotal: detalle.subTotal,
                    ventaId: ventaActualizada.id,
                    productoId: detalle.productoId,
                })),
            });

            return {
                ...ventaActualizada,
                detalles: data.detalles,
            };
        });
    } catch (error) {
        console.error("Error al actualizar la venta:", error);
        throw new Error("Error al actualizar la venta");
    }
};

const dropVenta = async (id) => {
    try {
        await prisma.detalleVenta.deleteMany({
            where: {
                ventaId: parseInt(id)  // 🔥 Convertir a número
            }
        });

        await prisma.venta.delete({
            where: {
                id: parseInt(id)
            }
        });

    } catch (error) {
        console.error("Error al eliminar la venta:", error);
        throw new Error("Error al eliminar la venta");
    }
};




module.exports = { getVentas, getVentaById, dropVenta, addVenta, getVentasByCliente, getVentasByNegocio, updateVenta, getVentasByNegocioId };