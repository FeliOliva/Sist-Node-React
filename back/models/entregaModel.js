const { PrismaClient } = require("@prisma/client");
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
        negocio: {
          select: {
            nombre: true,
          },
        },
        metodoPago: {
          select: {
            nombre: true,
          },
        },
      },
    });
    const totalEntregas = await prisma.entregas.count();

    return {
      entregas,
      total: totalEntregas,
      totalPages: Math.ceil(totalEntregas / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error("Error obteniendo todas las entregas:", error);
    throw new Error("Error al obtener las entregas");
  }
};

const updateVenta = async (id, data) => {
  try {
    return await prisma.venta.update({
      where: { id: parseInt(id) },
      data,
    });
  } catch (error) {
    console.error("Error actualizando venta:", error);
    throw new Error("Error al actualizar la venta");
  }
};

const getEntregaById = async (id) => {
  try {
    return await prisma.entregas.findUnique({
      where: { id: parseInt(id) },
      include: {
        negocio: {
          select: {
            nombre: true,
          },
        },
        metodoPago: {
          select: {
            nombre: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error obteniendo entrega por id:", error);
    throw new Error("Error al obtener la entrega por id");
  }
};
const getVentaById = async (id) => {
  try {
    return await prisma.venta.findUnique({
      where: { id: parseInt(id) },
    });
  } catch (error) {
    console.error("Error obteniendo venta por id:", error);
    throw new Error("Error al obtener la venta por id");
  }
};
const getEntregasByNegocio = async (
  negocioId,
  limit,
  page,
  startDate,
  endDate,
  cajaId
) => {
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
      ...(filterStartDate && {
        fechaCreacion: { gte: filterStartDate.toISOString() },
      }),
      ...(filterEndDate && {
        fechaCreacion: { lte: filterEndDate.toISOString() },
      }),
      ...(cajaId && { cajaId: parseInt(cajaId) }),
    };

    const entregas = await prisma.entregas.findMany({
      where: whereClause,
      skip: offset,
      take: limit,
      include: {
        negocio: { select: { nombre: true } },
        metodoPago: { select: { nombre: true } },
      },
    });

    const totalEntregas = await prisma.entregas.count({ where: whereClause });

    return {
      entregas,
      total: totalEntregas,
      totalPages: Math.ceil(totalEntregas / limit),
      currentPage: page,
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
      data: { monto },
    });
  } catch (error) {
    console.error("Error actualizando entrega:", error);
    throw new Error("Error al actualizar la entrega");
  }
};

const dropEntrega = async (id) => {
  try {
    return await prisma.entregas.delete({
      where: { id: parseInt(id) },
    });
  } catch (error) {
    console.error("Error eliminando entrega:", error);
    throw new Error("Error al eliminar la entrega");
  }
};


const getUltimaEntregaDelDia = async () => {
  try {
    const hoy = new Date();
    const inicioDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const finDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59, 999);
    
    const ultimaEntrega = await prisma.entregas.findFirst({
      where: {
        fechaCreacion: {
          gte: inicioDelDia,
          lte: finDelDia
        }
      },
      orderBy: {
        id: 'desc'
      }
    });
    
    return ultimaEntrega;
  } catch (error) {
    console.error("Error al obtener la última entrega del día:", error);
    throw error;
  }
};

module.exports = {
  getAllEntregas,
  getEntregaById,
  getEntregasByNegocio,
  addEntrega,
  updateEntrega,
  dropEntrega,
  getVentaById,
  updateVenta,
  getUltimaEntregaDelDia,
};
