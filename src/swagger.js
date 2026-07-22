const swaggerJsdoc = require("swagger-jsdoc");
const path = require("node:path");
const { version } = require("./app");

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de Restaurante - Sistemas de Bases de Datos",
      version: "1.0.0",
      description:
        "Servicio de Backend para el proyecto final de la materia de Sistemas de Bases de Datos"
    },
    servers: [
      {
        url: `/api/v1`
      }
    ],
    tags: [
      { name: "Metadatos", description: "Información general de la API" },
      { name: "Mesas", description: "Gestión de las mesas del restaurante" },
      { name: "Platos", description: "Gestión del menú de platos del restaurante" },
      { name: "Pedidos", description: "Gestión de pedidos y sus platos asociados" }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key"
        }
      },
      responses: {
        UnauthorizedError: {
          description: "No se proporcionó una API key válida",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    example: "No autorizado. Necesitas la llave de la API"
                  }
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        ApiKeyAuth: []
      }
    ]
  },
  apis: ["src/routes/*.js"]
});

module.exports = swaggerSpec;
