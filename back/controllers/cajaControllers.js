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

module.exports = {
  getCaja,
};
