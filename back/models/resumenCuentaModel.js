const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getResumenCuentaByNegocio = async (negocioId, startDate, endDate, cajaId) => {
    const [ventas, entregas, notasCredito] = await Promise.all([
        prisma.venta.findMany({
            where: {
                negocioId,
                cajaId,
                fechaCreacion: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            },
            select: {
                id: true,
                clienteId: true,
                nroVenta: true,
                fechaCreacion: true,
                total: true,
            },
        }),

        prisma.entregas.findMany({
            where: {
                negocioId,
                cajaId,
                fechaCreacion: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            },
            select: {
                id: true,
                clienteId: true,
                monto: true,
                metodoPagoId: true,
                nroEntrega: true,
                metodoPago: {
                    select: { nombre: true },
                },
                fechaCreacion: true,
            },
        }),

        prisma.notaCredito.findMany({
            where: {
                negocioId,
                cajaId,
                fechaCreacion: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            },
            select: {
                id: true,
                clienteId: true,
                monto: true,
                fechaCreacion: true,
                motivo: true,
            },
        }),
    ]);

    const result = [
        ...ventas.map(v => ({
            tipo: 'Venta',
            id: v.id,
            clienteId: v.clienteId,
            numero: v.nroVenta,
            fecha: v.fechaCreacion,
            monto: v.total,
            metodo_pago: null,
        })),
        ...entregas.map(e => ({
            tipo: 'Entrega',
            id: e.id,
            clienteId: e.clienteId,
            numero: e.nroEntrega,
            fecha: e.fechaCreacion,
            monto: e.monto,
            metodo_pago: e.metodoPago?.nombre || null,
        })),
        ...notasCredito.map(nc => ({
            tipo: 'Nota de Crédito',
            id: nc.id,
            clienteId: nc.clienteId,
            numero: null,
            fecha: nc.fechaCreacion,
            monto: nc.monto,
            metodo_pago: null,
        })),
    ];

    result.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    return result;
};

module.exports = {
    getResumenCuentaByNegocio,
};