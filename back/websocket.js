// websocket.js
const { WebSocketServer } = require("ws");
let wsClients = new Set();
let ventasDelDia = [];

function setupWebSocket(server, prisma) {
  const wss = new WebSocketServer({ server });

  const cargarVentasDelDia = async () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mañana = new Date(hoy);
    mañana.setDate(hoy.getDate() + 1);

    ventasDelDia = await prisma.venta.findMany({
      where: {
        fecha: {
          gte: hoy,
          lt: mañana,
        },
      },
      include: {
        detalles: true,
      },
    });
  };

  wss.on("connection", async (ws) => {
    console.log("Cliente conectado por WS");
    wsClients.add(ws);

    if (ventasDelDia.length === 0) await cargarVentasDelDia();

    ws.send(JSON.stringify({ tipo: "ventas-iniciales", data: ventasDelDia }));

    ws.on("close", () => {
      console.log("Cliente desconectado");
      wsClients.delete(ws);
    });
  });
}

function broadcastNuevaVenta(venta) {
  ventasDelDia.push(venta);
  wsClients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ tipo: "nueva-venta", data: venta }));
    }
  });
}

module.exports = {
  setupWebSocket,
  broadcastNuevaVenta,
};
