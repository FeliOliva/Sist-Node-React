// websocket.js
const { WebSocketServer } = require("ws");
const url = require("url");

// Almacenar conexiones activas por cajaId
const connections = {};
// Mantener un registro de ventas por cajaId
const ventasPorCaja = {};

function setupWebSocket(server, prisma) {
  const wss = new WebSocketServer({ server });

  const cargarVentasDelDia = async (cajaId) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mañana = new Date(hoy);
    mañana.setDate(hoy.getDate() + 1);

    // Filtrar ventas por cajaId específico usando fechaCreacion en lugar de fecha
    const ventas = await prisma.venta.findMany({
      where: {
        fechaCreacion: {
          gte: hoy,
          lt: mañana,
        },
        cajaId: parseInt(cajaId), // Asegurarse de que cajaId sea un número
      },
      include: {
        detalles: true,
        negocio: true,
      },
    });

    // Almacenar las ventas para esta caja
    ventasPorCaja[cajaId] = ventas;
    return ventas;
  };

  wss.on("connection", async (ws, req) => {
    // Obtener el cajaId de la URL de la conexión
    const parameters = url.parse(req.url, true);
    const cajaId = parameters.query.cajaId;

    if (!cajaId) {
      console.log("Conexión rechazada: No se proporcionó cajaId");
      ws.close();
      return;
    }

    console.log(`Nueva conexión establecida para caja ID: ${cajaId}`);

    // Almacenar la conexión asociada al cajaId
    if (!connections[cajaId]) {
      connections[cajaId] = [];
    }
    connections[cajaId].push(ws);

    // Cargar ventas del día para esta caja específica
    let ventasCaja;
    try {
      if (!ventasPorCaja[cajaId]) {
        ventasCaja = await cargarVentasDelDia(cajaId);
      } else {
        ventasCaja = ventasPorCaja[cajaId];
      }

      // Enviar datos iniciales
      ws.send(
        JSON.stringify({
          tipo: "ventas-iniciales",
          data: ventasCaja,
        })
      );
    } catch (error) {
      console.error("Error al cargar ventas:", error);
      // Enviar array vacío en caso de error
      ws.send(
        JSON.stringify({
          tipo: "ventas-iniciales",
          data: [],
        })
      );
    }

    // Manejar cierre de conexión
    ws.on("close", () => {
      console.log(`Conexión cerrada para caja ID: ${cajaId}`);
      connections[cajaId] = connections[cajaId].filter((conn) => conn !== ws);
      if (connections[cajaId].length === 0) {
        delete connections[cajaId];
      }
    });
  });
}

// Nueva función para enviar venta solo a los clientes de una caja específica
function enviarNuevaVenta(cajaId, venta) {
  if (!connections[cajaId]) {
    console.log(`No hay conexiones activas para la caja ID: ${cajaId}`);
    return;
  }

  // Añadir la venta al historial de esa caja
  if (!ventasPorCaja[cajaId]) {
    ventasPorCaja[cajaId] = [];
  }
  ventasPorCaja[cajaId].push(venta);

  const mensaje = {
    tipo: "nueva-venta",
    data: venta,
  };

  connections[cajaId].forEach((ws) => {
    if (ws.readyState === 1) {
      // 1 = WebSocket.OPEN
      try {
        ws.send(JSON.stringify(mensaje));
      } catch (error) {
        console.error(
          `Error al enviar mensaje a cliente de caja ${cajaId}:`,
          error
        );
      }
    }
  });
}

function broadcastNuevaVenta(venta) {
  if (venta && venta.cajaId) {
    enviarNuevaVenta(venta.cajaId, venta);
  } else {
    Object.keys(connections).forEach((cajaId) => {
      connections[cajaId].forEach((client) => {
        if (client.readyState === 1) {
          try {
            client.send(JSON.stringify({ tipo: "nueva-venta", data: venta }));
          } catch (error) {
            console.error(`Error al enviar mensaje a cliente:`, error);
          }
        }
      });
    });
  }
}

function eliminarVenta(cajaId, ventaId) {
  if (!ventasPorCaja[cajaId]) return;
  // Eliminar del array en memoria
  ventasPorCaja[cajaId] = ventasPorCaja[cajaId].filter(
    (venta) => venta.id !== Number(ventaId)
  );

  // Notificar a todos los clientes conectados a esa caja
  const mensaje = {
    tipo: "venta-eliminada",
    data: { id: ventaId },
  };

  if (connections[cajaId]) {
    connections[cajaId].forEach((ws) => {
      if (ws.readyState === 1) {
        try {
          ws.send(JSON.stringify(mensaje));
        } catch (error) {
          console.error(
            `Error al enviar eliminación a cliente de caja ${cajaId}:`,
            error
          );
        }
      }
    });
  }
}

function actualizarVenta(cajaId, ventaActualizada, tipo = "venta-actualizada") {
  if (!ventasPorCaja[cajaId]) return;

  ventasPorCaja[cajaId] = ventasPorCaja[cajaId].map((venta) =>
    venta.id === ventaActualizada.id ? ventaActualizada : venta
  );

  const mensaje = {
    tipo,
    data: ventaActualizada, // <- CORREGIDO AQUÍ
  };

  if (connections[cajaId]) {
    connections[cajaId].forEach((ws) => {
      if (ws.readyState === 1) {
        try {
          ws.send(JSON.stringify(mensaje));
        } catch (error) {
          console.error(
            `Error al enviar actualización a cliente de caja ${cajaId}:`,
            error
          );
        }
      }
    });
  }
}

module.exports = {
  setupWebSocket,
  broadcastNuevaVenta,
  enviarNuevaVenta,
  eliminarVenta,
  actualizarVenta,
};
