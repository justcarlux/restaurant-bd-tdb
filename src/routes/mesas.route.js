const { Router } = require("express");
const { pool: postgresPool } = require("../postgres");
const { body, validationResult } = require("express-validator");

const router = Router();

router.get("/", async (req, res) => {
  const result = await postgresPool.query("SELECT * FROM mesa");
  res.send(result.rows);
});

router.get("/:id", async (req, res) => {
  const mesaId = parseInt(req.params.id);
  if (isNaN(mesaId)) {
    res.status(400).send({ message: "ID de mesa inválida" });
    return;
  }

  const result = await postgresPool.query("SELECT * FROM mesa WHERE id_mesa = $1", [
    mesaId
  ]);
  if (result.rows.length <= 0) {
    res.status(404).send({ message: "Mesa no encontrada" });
    return;
  }

  res.send(result.rows[0]);
});

router.post(
  "/",
  [
    body("capacidad")
      .isInt({ gt: 0 })
      .withMessage("Se debe proveer una capacidad para la mesa"),
    body("estado")
      .isIn(["disponible", "ocupada", "reservada", "fuera_de_servicio"])
      .withMessage("Se debe proveer un estado para la mesa"),
    body("ubicacion")
      .isString()
      .notEmpty()
      .withMessage("Se debe proveer una ubicación para el plato")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const result = await postgresPool.query(
        "INSERT INTO mesa (capacidad, estado, ubicacion) VALUES ($1, $2, $3) RETURNING *",
        [req.body.capacidad, req.body.estado, req.body.ubicacion]
      );
      res.send({
        message: "La mesa ha sido creada satisfactoriamente",
        data: result.rows[0]
      });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .send({
          message: "Ha ocurrido un error interno al crear la mesa",
          error: error.message
        });
    }
  }
);

module.exports = router;
