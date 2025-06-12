const express = require("express");
const router = express.Router();
const cajaControllers = require("../controllers/cajaControllers");
const { verifyToken } = require("../auth");

router.get("/caja", verifyToken, cajaControllers.getCaja);
router.post("/cierre-caja", verifyToken, cajaControllers.crearCierreCaja);
router.get("/cierres-caja", cajaControllers.getCierresCaja);
router.patch("/cierre-caja/:id/cerrar", verifyToken, cajaControllers.cerrarCierreCajaPendiente);

module.exports = router;
