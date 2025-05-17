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
        totalVentas: data.totalVentas,
        totalPagado: data.totalPagado,
        totalCuentaCorriente: data.totalCuentaCorriente || 0,
        totalDiferido: data.totalDiferido || 0,
        ingresoLimpio: data.ingresoLimpio || 0,
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
      include: { usuario: { select: { usuario: true } } },
      orderBy: { fecha: "desc" },
    });
  } catch (error) {
    console.error("Error al obtener cierres de caja:", error);
    throw new Error("Error al obtener cierres de caja");
  }
};

module.exports = {
  getCajas,
  crearCierreCaja,
  getCierresCaja,
};