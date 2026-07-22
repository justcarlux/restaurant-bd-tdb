const express = require("express");

const { pool: postgresPool, pingPostgres } = require("./postgres");

const indexRouter = require("./routes/index.route");
const platosRouter = require("./routes/platos.route");
const mesasRouter = require("./routes/mesas.route");
const pedidosRouter = require("./routes/pedidos.route");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

function route(segment) {
  return `/api/v1${segment}`;
}

class App {
  constructor() {
    this.app = express();
  }

  loggerMiddleware(req, res, next) {
    const start = Date.now();

    res.once("finish", () => {
      const duration = Date.now() - start;
      console.log(
        `${req.method} request at ${req.originalUrl} returned ${res.statusCode} - Processed in ${duration}ms`
      );
    });
    next();
  }

  authorizationMiddleware(req, res, next) {
    const providedKey = req.header("x-api-key");
    if (providedKey != process.env.API_KEY) {
      res.status(401).json({ message: "No autorizado. Necesitas la llave de la API" });
    } else {
      next();
    }
  }

  registerMiddlewares() {
    this.app.use(this.loggerMiddleware).use(express.json());
  }

  registerRoutes() {
    this.app
      .use("/swagger/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))
      .use(route("/"), this.authorizationMiddleware, indexRouter)
      .use(route("/platos"), this.authorizationMiddleware, platosRouter)
      .use(route("/mesas"), this.authorizationMiddleware, mesasRouter)
      .use(route("/pedidos"), this.authorizationMiddleware, pedidosRouter);
  }

  async bootstrap() {
    await pingPostgres();
    this.registerMiddlewares();
    this.registerRoutes();

    this.app.listen(process.env.PORT, () => {
      console.log(`App listening in port: ${process.env.PORT}`);
    });
  }
}

module.exports = App;
