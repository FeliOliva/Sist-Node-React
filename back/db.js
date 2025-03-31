const { PrismaClient } = require("@prisma/client");
const redis = require("redis");
const prisma = new PrismaClient();

const redisClient = redis.createClient({
    socket: {
        host: "localhost", // Cambia a la IP de tu servidor si no es local
        port: 6379
    }
});

const getUserByUsername = async (usuario) => {
    try {
        return await prisma.usuario.findUnique({
            where: { usuario }
        });
    } catch (error) {
        console.error("Error consultando usuario:", error);
        throw error;
    }
};

// Manejar errores de Redis
redisClient.on("error", (err) => console.error("Redis Client Error", err));

// Conectar Redis
redisClient.connect().catch(console.error);
module.exports = { prisma, redisClient, getUserByUsername };
