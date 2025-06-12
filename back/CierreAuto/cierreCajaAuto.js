// filepath: d:\Programacion\Sist-Node-React\back\jobs\cierreCajaAuto.js
const cron = require("node-cron");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function cierreCajaAutomatico() {
  const hoy = new Date();
  const inicioDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const finDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59, 999);

  const cajas = await prisma.caja.findMany();

  for (const caja of cajas) {
    const cierreHoy = await prisma.cierreCaja.findFirst({
      where: {
        cajaId: caja.id,
        fecha: { gte: inicioDelDia, lte: finDelDia }
      }
    });
    if (!cierreHoy) {
      const entregas = await prisma.entregas.aggregate({
        where: {
          cajaId: caja.id,
          fechaCreacion: { gte: inicioDelDia, lte: finDelDia }
        },
        _sum: { monto: true }
      });
      await prisma.cierreCaja.create({
        data: {
          cajaId: caja.id,
          usuarioId: null,
          totalVentas: entregas._sum.monto || 0,
          totalPagado: 0,
          ingresoLimpio: 0,
          estado: "pendiente"
        }
      });
    }
  }
  console.log("Cierre automático ejecutado");
}

// Programa el cierre todos los días a las 23:59
cron.schedule("59 23 * * *", cierreCajaAutomatico);

// Si quieres probarlo manualmente, descomenta:
// cierreCajaAutomatico();