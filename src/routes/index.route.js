const { Router } = require("express");
const packageJson = require("../../package.json");

const router = Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Obtener los metadatos de la API
 *     description: Devuelve el nombre y la versión actual de la API
 *     tags: [Metadatos]
 *     responses:
 *       200:
 *         description: Metadatos de la API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: restaurant-bd-tdb
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/", async (req, res) => {
  res.send({ name: packageJson.name, version: packageJson.version });
});

module.exports = router;
