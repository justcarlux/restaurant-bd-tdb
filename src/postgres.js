const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL
});

async function pingPostgres() {
  const promise = new Promise(resolve => {
    pool.query("SELECT 1");
    pool.once("connect", client => {
      console.log(
        `Successfully connected to Postgres at ${client.host} (${client.database})`
      );
      resolve();
    });
  });
  return promise;
}

module.exports = { pool, pingPostgres };
