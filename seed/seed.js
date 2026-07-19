require("dotenv").config();

const { pool: postgresPool, pingPostgres } = require("../src/postgres");
const format = require("pg-format");

const platos = require("./platos.json");
const mesas = require("./mesas.json");
const clientes = require("./clientes.json");
const pedidos = require("./pedidos.json");

async function populateTable(table, parameters, values) {
  try {
    const result = await postgresPool.query(
      format(`INSERT INTO ${table} ${parameters} VALUES %L`, values)
    );
    console.log(`Successfully populated table "${table}" with ${result.rowCount} rows`);
  } catch (error) {
    console.log(
      `Couldn't populate table "${table}" due to an error (might already be populated): ${error.message}. Skipping table`
    );
  }
}

(async () => {
  await pingPostgres();

  await populateTable(
    "cliente",
    "(cedula_cliente, nombre, telefono, email, direccion_habitual)",
    clientes.map(e => [
      e.cedula_cliente,
      e.nombre,
      e.telefono,
      e.email,
      e.direccion_habitual
    ])
  );

  await populateTable(
    "plato",
    "(nombre, descripcion, precio, categoria)",
    platos.map(e => [e.nombre, e.descripcion, e.precio, e.categoria])
  );

  await populateTable(
    "mesa",
    "(capacidad, estado, ubicacion)",
    mesas.map(e => [e.capacidad, e.estado, e.ubicacion])
  );

  await populateTable(
    "pedido",
    "(tipo_pedido, estado_orden, id_mesa, cedula_cliente, direccion_envio)",
    pedidos.map(e => [
      e.tipo_pedido,
      e.estado_orden,
      e.id_mesa,
      e.cedula_cliente,
      e.direccion_envio
    ])
  );

  postgresPool.end();
})();
