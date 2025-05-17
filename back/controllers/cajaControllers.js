const cajaModel = require("../models/cajaModel");

const getCaja = async (req, res) => {
  try {
    const cajas = await cajaModel.getCajas();
    res.status(200).json(cajas);
  } catch (error) {
    console.error("Error al obtener las cajas:", error);
    res.status(500).json({ error: "Error al obtener las cajas" });
  }
};

const crearCierreCaja = async (req, res) => {
  try {
    const cierre = await cajaModel.crearCierreCaja(req.body);
    res.status(201).json(cierre);
  } catch (error) {
    res.status(500).json({ error: "Error al crear cierre de caja" });
  }
};

const getCierresCaja = async (req, res) => {
  try {
    const cierres = await cajaModel.getCierresCaja();
    res.status(200).json(cierres);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener cierres de caja" });
  }
};

module.exports = {
  getCaja,
  crearCierreCaja,
  getCierresCaja,
};