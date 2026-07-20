const { Router } = require("express");
const { pool: postgresPool } = require("../postgres");
const { body, validationResult } = require("express-validator");

const router = Router();

router.get("/", async (req, res) => {
  const result = await postgresPool.query("SELECT * FROM pedido");
  res.send(result.rows);
});

router.get("/:ticket", async (req, res) => {
  const ticketNumber = parseInt(req.params.ticket);
  if (isNaN(ticketNumber)) {
    res.status(400).send({ message: "Número de ticket inválido" });
    return;
  }

  const result = await postgresPool.query(
    `SELECT
        pedido.num_ticket,
        pedido.tipo_pedido,
        pedido.estado_orden,
        pedido.id_mesa,
        pedido.cedula_cliente,
        pedido.direccion_envio,
        detalle_pedido.id_plato,
        detalle_pedido.cantidad,
        detalle_pedido.subtotal
     FROM pedido
     LEFT JOIN detalle_pedido ON pedido.num_ticket = detalle_pedido.num_ticket
     WHERE pedido.num_ticket = $1`,
    [ticketNumber]
  );

  if (result.rows.length <= 0) {
    res.status(404).send({ message: "Pedido no encontrado" });
    return;
  }

  const {
    num_ticket,
    tipo_pedido,
    estado_orden,
    id_mesa,
    cedula_cliente,
    direccion_envio
  } = result.rows[0];

  const pedido = {
    num_ticket,
    tipo_pedido,
    estado_orden,
    id_mesa,
    cedula_cliente,
    direccion_envio,
    detalles: result.rows
      .filter(row => row.id_plato !== null)
      .map(row => ({
        id_plato: row.id_plato,
        cantidad: row.cantidad,
        subtotal: row.subtotal
      }))
  };

  res.send(pedido);
});

router.post(
  "/",
  [
    body("tipo_pedido")
      .isIn(["mesa", "pickup", "delivery"])
      .withMessage("Se debe proveer un tipo de pedido válido"),
    body("id_mesa").custom((value, { req }) => {
      if (
        ["pickup", "delivery"].includes(req.body.tipo_pedido) &&
        (value === null || value === undefined)
      ) {
        return true;
      }
      const parsed = parseInt(value);
      if (isNaN(parsed)) {
        throw new Error("Se debe proveer un ID de mesa válido para el tipo de");
      }
      return true;
    }),
    body("cedula_cliente")
      .isString()
      .isLength({ max: 20 })
      .withMessage("Se debe proveer una cédula válida del cliente"),
    body("direccion_envio").custom((value, { req }) => {
      if (req.body.tipo_pedido === "delivery" && !value) {
        throw new Error("Se debe proveer una dirección de envío para pedidos delivery");
      }
      if (req.body.tipo_pedido !== "delivery") {
        if (value !== null && value !== undefined && typeof value !== "string") {
          throw new Error("La dirección de envío debe de ser una cadena");
        }
      }
      return true;
    })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const result = await postgresPool.query(
        "INSERT INTO pedido (tipo_pedido, estado_orden, id_mesa, cedula_cliente, direccion_envio) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [
          req.body.tipo_pedido,
          "recibido",
          req.body.id_mesa,
          req.body.cedula_cliente,
          req.body.direccion_envio
        ]
      );
      res.send({
        message: "El pedido ha sido creado satisfactoriamente",
        data: result.rows[0]
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Ha ocurrido un error interno al crear el pedido",
        error: error.message
      });
    }
  }
);

router.post(
  "/:ticket",
  [body("id_plato").isInt(), body("cantidad").isInt({ gt: 0 })],
  async (req, res) => {
    const ticketNumber = parseInt(req.params.ticket);
    if (isNaN(ticketNumber)) {
      res.status(400).send({ message: "Número de ticket inválido" });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const ticketResult = await postgresPool.query(
      "SELECT * FROM pedido WHERE num_ticket = $1",
      [ticketNumber]
    );
    if (ticketResult.rows.length <= 0) {
      res.status(404).send({ message: "Pedido no encontrado" });
      return;
    }

    const platoResult = await postgresPool.query(
      "SELECT * FROM plato WHERE id_plato = $1",
      [req.body.id_plato]
    );
    if (platoResult.rows.length <= 0) {
      res.status(404).send({ message: "Plato no encontrado" });
      return;
    }

    const platoPrice = platoResult.rows[0].precio;

    try {
      const result = await postgresPool.query(
        "INSERT INTO detalle_pedido (num_ticket, id_plato, cantidad, subtotal) VALUES ($1, $2, $3, $4) RETURNING *",
        [
          ticketNumber,
          req.body.id_plato,
          req.body.cantidad,
          platoPrice * req.body.cantidad
        ]
      );
      res.send({
        message: "El plato ha sido añadido al pedido satisfactoriamente",
        data: result.rows[0]
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Ha ocurrido un error interno al crear la mesa",
        error: error.message
      });
    }
  }
);

module.exports = router;
