require("dotenv").config();

/**
 * @type { import("knex").Knex.Config }
 */
const { DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME } = process.env;

module.exports = {
  client: "pg",
  connection: {
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
  },
  pool: { min: 0, max: 10 },
  seeds: {
    directory: "./seeds",
  },
};
