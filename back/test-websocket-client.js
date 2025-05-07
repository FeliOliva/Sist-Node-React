// test-websocket-client.js
const WebSocket = require("ws");

const cajaId = 1; // Cambia por un cajaId válido
const ws = new WebSocket(`ws://localhost:3001?cajaId=${cajaId}`);

ws.on("open", () => {
  console.log("Conectado al servidor WebSocket");
});

ws.on("message", (data) => {
  console.log("Mensaje recibido:", JSON.parse(data));
});

ws.on("close", () => {
  console.log("Desconectado del servidor WebSocket");
});

ws.on("error", (error) => {
  console.error("Error en WebSocket:", error);
});
