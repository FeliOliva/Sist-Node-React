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

module.exports = {
  getCajas,
};