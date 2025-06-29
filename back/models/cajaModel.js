const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getCajas = async () => {
  try {
    // Incluye las ventas asociadas a cada caja y suma el total
    const cajas = await prisma.caja.findMany({
      include: {
        ventas: {
          select: { total: true, estadoPago: true },
        },
      },
    });

    // Calcula el total solo de ventas cobradas (estadoPago === 2)
    return cajas.map(caja => ({
      ...caja,
      totalVentas: caja.ventas
        .filter(v => v.estadoPago === 2)
        .reduce((acc, v) => acc + v.total, 0),
    }));
  } catch (error) {
    console.error("Error al obtener las cajas:", error);
    throw new Error("Error al obtener las cajas");
  }
};

const crearCierreCaja = async (data) => {
  try {
    return await prisma.cierreCaja.create({
      data: {
        fecha: new Date(),
        usuarioId: data.usuarioId,
        cajaId: data.cajaId,
        totalVentas: data.totalVentas,
        totalPagado: data.totalPagado,
        totalCuentaCorriente: data.totalCuentaCorriente || 0,
        totalDiferido: data.totalDiferido || 0,
        ingresoLimpio: data.ingresoLimpio || 0,
        estado: "cerrado",
      },
    });
  } catch (error) {
    console.error("Error al crear cierre de caja:", error);
    throw new Error("Error al crear cierre de caja");
  }
};

const getCierresCaja = async () => {
  try {
    return await prisma.cierreCaja.findMany({
      include: { usuario: { select: { usuario: true } }, caja: { select: { nombre: true } } },
      orderBy: { fecha: "desc" },

    });
  } catch (error) {
    console.error("Error al obtener cierres de caja:", error);
    throw new Error("Error al obtener cierres de caja");
  }
};

const crearCierreCajaPendiente = async (cajaId, totalVentas = 0) => {
  try {
    return await prisma.cierreCaja.create({
      data: {
        fecha: new Date(),
        usuarioId: null,
        cajaId,
        totalVentas,
        totalPagado: 0,
        totalCuentaCorriente: 0,
        totalDiferido: 0,
        ingresoLimpio: 0,
        estado: "pendiente"
      },
    });
  } catch (error) {
    console.error("Error al crear cierre de caja pendiente:", error);
    throw new Error("Error al crear cierre de caja pendiente");
  }
};

const cerrarCierreCajaPendiente = async (cierreId, usuarioId) => {
  try {
    return await prisma.cierreCaja.update({
      where: { id: cierreId },
      data: {
        estado: "cerrado",
        usuarioId,
        fecha: new Date(), // opcional: actualiza la fecha de cierre
      },
    });
  } catch (error) {
    console.error("Error al cerrar cierre pendiente:", error);
    throw new Error("Error al cerrar cierre pendiente");
  }
};

const getCajaById = async (id) => {
  try {
    return await prisma.caja.findUnique({
      where: { id },
      include: {
        ventas: {
          select: { total: true, estadoPago: true },
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener la caja:", error);
    throw new Error("Error al obtener la caja");
  }
};

module.exports = {
  // ...otros métodos...
  cerrarCierreCajaPendiente,
};

module.exports = {
  getCajas,
  crearCierreCaja,
  getCierresCaja,
  getCajaById,
  crearCierreCajaPendiente,
  cerrarCierreCajaPendiente,
};