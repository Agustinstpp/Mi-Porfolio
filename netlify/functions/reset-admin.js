const bcrypt = require("bcryptjs");
const { pool, ensureSchema } = require("./_db");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, message: "Method not allowed" }),
    };
  }

  const secret = event.headers["x-reset-secret"] || event.headers["X-Reset-Secret"];
  if (!process.env.RESET_SECRET || secret !== process.env.RESET_SECRET) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, message: "Unauthorized" }),
    };
  }

  const username = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, message: "Missing ADMIN_USER or ADMIN_PASSWORD" }),
    };
  }

  await ensureSchema();
  const hash = bcrypt.hashSync(password, 10);

  await pool.query("DELETE FROM users");
  await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [
    username,
    hash,
  ]);

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true, username }),
  };
};
