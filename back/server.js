const express = require("express");
require("dotenv").config();
const { generateToken, verifyToken } = require("./auth");
const { prisma } = require("./db");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT;



//ROUTES
const clientsRoutes = require("./routes/clienteRoutes");
const negociosRoutes = require("./routes/negocioRoutes");
const productsRoutes = require("./routes/productsRoutes");
const ventaRoutes = require("./routes/ventasRoutes");
const precioLogRoutes = require("./routes/precioLogRoutes");
const entregaRoutes = require("./routes/entregasRoutes")
const notasCreditoRoutes = require("./routes/notasCreditoRoutes");
const tiposUnidadesRoutes = require("./routes/tiposUnidadesRoutes");
const chequesRoutes = require("./routes/chequeRoutes");


app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(express.json());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:5173");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
});


// Ruta de login para generar un token
app.post("/login", async (req, res) => {
    const { usuario, password } = req.body;  // <-- Asegúrate de que los nombres coincidan con Postman
    if (!usuario || !password) {
        return res.status(400).json({ error: "Faltan datos en la solicitud" });
    }

    try {
        const usuarios = await prisma.usuario.findMany();
        if (!usuarios) {
            return res.status(401).json({ error: "Usuario no encontrado" });
        }
        if (password !== usuarios[0].password) {  // <-- Comparación simple, solo si las contraseñas no están encriptadas
            return res.status(401).json({ error: "Credenciales incorrectas" });
        }

        const token = generateToken({ id: usuarios.id, usuario: usuarios.usuario });
        res.json({ token });
    } catch (error) {
        console.error("Error al autenticar:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});


app.use("/api", verifyToken, clientsRoutes, negociosRoutes, productsRoutes, ventaRoutes, precioLogRoutes, entregaRoutes, notasCreditoRoutes, tiposUnidadesRoutes, chequesRoutes);


app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
