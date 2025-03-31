const express = require("express");
const router = express.Router();
const negocioController = require("../controllers/negocioController");
const { verifyToken } = require("../auth");

router.get("/negocio", verifyToken, negocioController.getNegocios);
router.get("/getAllNegociosByCliente/:id", verifyToken, negocioController.getAllNegociosByCliente);
router.get("/negocio/:id", verifyToken, negocioController.getNegocioById);
router.post("/negocio", verifyToken, negocioController.addNegocio);
router.put("/negocio/:id", verifyToken, negocioController.updateNegocio);
router.delete("/negocio/:id", verifyToken, negocioController.deleteNegocio);
router.post("/negocio/:id", verifyToken, negocioController.upNegocio);
module.exports = router;