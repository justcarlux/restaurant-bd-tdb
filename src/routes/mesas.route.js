const { Router } = require("express");
const { pool: postgresPool } = require("../postgres");
const { body, validationResult } = require("express-validator");

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Mesa:
 *       type: object
 *       properties:
 *         id_mesa:
 *           type: integer
 *           example: 1
 *         capacidad:
 *           type: integer
 *           example: 4
 *         estado:
 *           type: string
 *           enum: [disponible, ocupada, reservada, fuera_de_servicio]
 *           example: disponible
 *         ubicacion:
 *           type: string
 *           example: Terraza
 */

/**
 * @swagger
 * /mesas:
 *   get:
 *     summary: Listar todas las mesas
 *     description: Devuelve todas las mesas registradas, sin filtrar por estado ni ubicación.
 *     tags: [Mesas]
 *     responses:
 *       200:
 *         description: Listado de mesas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Mesa'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/", async (req, res) => {
  const result = await postgresPool.query("SELECT * FROM mesa");
  res.send(result.rows);
});

/**
 * @swagger
 * /mesas/{id}:
 *   get:
 *     summary: Obtener una mesa por ID
 *     description: Busca una mesa específica según su ID numérico.
 *     tags: [Mesas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la mesa a consultar
 *     responses:
 *       200:
 *         description: Mesa encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Mesa'
 *       400:
 *         description: El ID proporcionado no es un número válido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ID de mesa inválida
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: No existe una mesa con ese ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Mesa no encontrada
 */
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

/**
 * @swagger
 * /mesas:
 *   post:
 *     summary: Crear una nueva mesa
 *     description: >
 *       Registra una nueva mesa en el sistema. Requiere capacidad (número entero
 *       mayor a 0), un estado válido y una ubicación.
 *     tags: [Mesas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - capacidad
 *               - estado
 *               - ubicacion
 *             properties:
 *               capacidad:
 *                 type: integer
 *                 example: 4
 *                 description: Debe ser un entero mayor a 0
 *               estado:
 *                 type: string
 *                 enum: [disponible, ocupada, reservada, fuera_de_servicio]
 *                 example: disponible
 *               ubicacion:
 *                 type: string
 *                 example: Terraza
 *     responses:
 *       200:
 *         description: Mesa creada satisfactoriamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: La mesa ha sido creada satisfactoriamente
 *                 data:
 *                   $ref: '#/components/schemas/Mesa'
 *       400:
 *         description: Error de validación en alguno de los campos enviados
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
 *                         example: Se debe proveer una capacidad para la mesa
 *                       path:
 *                         type: string
 *                         example: capacidad
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Error interno al intentar crear la mesa
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
      res.status(500).send({
        message: "Ha ocurrido un error interno al crear la mesa",
        error: error.message
      });
    }
  }
);

module.exports = router;
