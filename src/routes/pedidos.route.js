const { Router } = require("express");
const { pool: postgresPool } = require("../postgres");
const { body, validationResult } = require("express-validator");

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     DetallePedido:
 *       type: object
 *       properties:
 *         id_plato:
 *           type: integer
 *           example: 3
 *         cantidad:
 *           type: integer
 *           example: 2
 *         subtotal:
 *           type: number
 *           format: float
 *           example: 25.00
 *     Pedido:
 *       type: object
 *       properties:
 *         num_ticket:
 *           type: integer
 *           example: 1
 *         tipo_pedido:
 *           type: string
 *           enum: [mesa, pickup, delivery]
 *           example: mesa
 *         estado_orden:
 *           type: string
 *           enum: [recibido, preparando, listo, entregado]
 *           example: recibido
 *         id_mesa:
 *           type: integer
 *           nullable: true
 *           description: Solo aplica si el pedido es de tipo "mesa"
 *           example: 4
 *         cedula_cliente:
 *           type: string
 *           example: "1234567890"
 *         direccion_envio:
 *           type: string
 *           nullable: true
 *           description: Obligatoria únicamente si el pedido es de tipo "delivery"
 *           example: null
 */

/**
 * @swagger
 * /pedidos:
 *   get:
 *     summary: Listar todos los pedidos
 *     description: Devuelve todos los pedidos registrados, sin sus detalles (platos asociados).
 *     tags: [Pedidos]
 *     responses:
 *       200:
 *         description: Listado de pedidos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pedido'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/", async (req, res) => {
  const result = await postgresPool.query("SELECT * FROM pedido");
  res.send(result.rows);
});

/**
 * @swagger
 * /pedidos/{ticket}:
 *   get:
 *     summary: Obtener un pedido por número de ticket
 *     description: >
 *       Devuelve la información del pedido junto con el detalle de los platos
 *       que lo componen (cantidad y subtotal de cada uno). Si el pedido no
 *       tiene platos asociados aún, "detalles" se devuelve como un arreglo vacío.
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: ticket
 *         required: true
 *         schema:
 *           type: integer
 *         description: Número de ticket del pedido
 *     responses:
 *       200:
 *         description: Pedido encontrado, incluyendo sus detalles
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Pedido'
 *                 - type: object
 *                   properties:
 *                     detalles:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/DetallePedido'
 *       400:
 *         description: El número de ticket proporcionado no es válido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Número de ticket inválido
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: No existe un pedido con ese número de ticket
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Pedido no encontrado
 */
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

/**
 * @swagger
 * /pedidos:
 *   post:
 *     summary: Crear un nuevo pedido
 *     description: >
 *       Crea un pedido nuevo con estado inicial "recibido" (asignado automáticamente,
 *       no es necesario enviarlo). Las reglas varían según el tipo de pedido:
 *       si es de tipo "mesa" se espera un "id_mesa" válido; si es "delivery" es
 *       obligatorio incluir "direccion_envio"; para "pickup" ninguno de los dos
 *       campos es estrictamente necesario.
 *     tags: [Pedidos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo_pedido
 *               - cedula_cliente
 *             properties:
 *               tipo_pedido:
 *                 type: string
 *                 enum: [mesa, pickup, delivery]
 *                 example: mesa
 *               id_mesa:
 *                 type: integer
 *                 nullable: true
 *                 description: Requerido (numérico) si tipo_pedido es "mesa"
 *                 example: 4
 *               cedula_cliente:
 *                 type: string
 *                 maxLength: 20
 *                 example: "1234567890"
 *               direccion_envio:
 *                 type: string
 *                 nullable: true
 *                 description: Obligatoria si tipo_pedido es "delivery"
 *                 example: "Av. Siempre Viva 123"
 *     responses:
 *       200:
 *         description: Pedido creado satisfactoriamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: El pedido ha sido creado satisfactoriamente
 *                 data:
 *                   $ref: '#/components/schemas/Pedido'
 *       400:
 *         description: >
 *           Error de validación (tipo de pedido inválido, cédula inválida,
 *           falta dirección de envío en un pedido delivery, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       msg:
 *                         type: string
 *                         example: Se debe proveer un tipo de pedido válido
 *                       path:
 *                         type: string
 *                         example: tipo_pedido
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Error interno al intentar crear el pedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Ha ocurrido un error interno al crear el pedido
 *                 error:
 *                   type: string
 */
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

/**
 * @swagger
 * /pedidos/{ticket}:
 *   post:
 *     summary: Añadir un plato a un pedido existente
 *     description: >
 *       Agrega una línea de detalle a un pedido ya creado. El subtotal se
 *       calcula automáticamente en el servidor (precio del plato × cantidad),
 *       no se envía en el body.
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: ticket
 *         required: true
 *         schema:
 *           type: integer
 *         description: Número de ticket del pedido al que se le añadirá el plato
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_plato
 *               - cantidad
 *             properties:
 *               id_plato:
 *                 type: integer
 *                 example: 3
 *               cantidad:
 *                 type: integer
 *                 description: Debe ser un entero mayor a 0
 *                 example: 2
 *     responses:
 *       200:
 *         description: Plato añadido satisfactoriamente al pedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: El plato ha sido añadido al pedido satisfactoriamente
 *                 data:
 *                   $ref: '#/components/schemas/DetallePedido'
 *       400:
 *         description: Número de ticket inválido, o error de validación en id_plato/cantidad
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Número de ticket inválido
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: No existe el pedido o el plato indicado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Plato no encontrado
 *       500:
 *         description: Error interno al intentar añadir el plato al pedido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Ha ocurrido un error interno al crear la mesa
 *                 error:
 *                   type: string
 */
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
