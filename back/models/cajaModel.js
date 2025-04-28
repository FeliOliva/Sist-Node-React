const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const getCajas = async () => {
  try {
    return await prisma.caja.findMany({});
  } catch (error) {
    console.error("Error al obtener las cajas:", error);
    throw new Error("Error al obtener las cajas");
  }
};

module.exports = {
  getCajas,
};
