const express = require('express');
const router = express.Router();
const { verifyToken } = require('../auth');
const resumenCuentaControllers = require('../controllers/resumenCuentaControllers');

router.get('/resumenCuenta/negocio/:id', verifyToken, resumenCuentaControllers.getResumenCuentaByNegocio);

module.exports = router;