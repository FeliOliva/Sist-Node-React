// test-websocket-client.js
const WebSocket = require("ws");

// ID de la caja que queremos monitorear
const cajaId = 2; // Cambia por un cajaId válido

// Tomar el puerto del entorno o usar el valor predeterminado
const PORT = process.env.PORT || 3000;

// Conexión al WebSocket con el cajaId como parámetro de consulta
const ws = new WebSocket(`ws://localhost:${PORT}?cajaId=${cajaId}`);

ws.on("open", () => {
  console.log(`Conectado al servidor WebSocket para la caja ID: ${cajaId}`);
});

ws.on("message", (data) => {
  try {
    const mensaje = JSON.parse(data);
    console.log(`Tipo de mensaje: ${mensaje.tipo}`);
    
    if (mensaje.tipo === "ventas-iniciales") {
      console.log(`Recibidas ${mensaje.data.length} ventas iniciales para la caja ${cajaId}`);
    } else if (mensaje.tipo === "nueva-venta") {
      console.log("Nueva venta recibida:", mensaje.data);
    }
  } catch (error) {
    console.error("Error al procesar mensaje:", error);
  }
});

ws.on("close", () => {
  console.log(`Desconectado del servidor WebSocket para la caja ${cajaId}`);
});

ws.on("error", (error) => {
  console.error("Error en WebSocket:", error);
});