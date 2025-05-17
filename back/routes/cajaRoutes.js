const express = require("express");
const router = express.Router();
const cajaControllers = require("../controllers/cajaControllers");
const { verifyToken } = require("../auth");

router.get("/caja", verifyToken, cajaControllers.getCaja);
router.post("/cierre-caja", cajaControllers.crearCierreCaja);
router.get("/cierres-caja", cajaControllers.getCierresCaja);

module.exports = router;
