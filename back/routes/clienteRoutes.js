const express = require("express");
const router = express.Router();
const clientControllers = require("../controllers/clientControllers");
const { verifyToken } = require("../auth");

router.get("/clientes", verifyToken, clientControllers.getClients);
router.get("/getAllClientes", verifyToken, clientControllers.getAllClients);
router.get("/clientes/:id", verifyToken, clientControllers.getClientById);
router.post("/clientes", verifyToken, clientControllers.addClient);
router.put("/clientes/:id", verifyToken, clientControllers.updateClient);
router.delete("/clientes/:id", verifyToken, clientControllers.deleteClient);
router.post("/clientes/:id", verifyToken, clientControllers.upClient)

module.exports = router;
