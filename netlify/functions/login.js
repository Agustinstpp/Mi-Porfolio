const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool, ensureSchema } = require("./_db");

exports.handler = async (event) => {
  await ensureSchema();

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false }),
    };
  }

  const payload = JSON.parse(event.body || "{}");
  const { username, password } = payload;

  const result = await pool.query("SELECT * FROM users WHERE username = $1", [
    username,
  ]);
  const user = result.rows[0];
  if (!user) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false }),
    };
  }

  const ok = bcrypt.compareSync(password || "", user.password);
  if (!ok) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false }),
    };
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: "7d" }
  );

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true, token }),
  };
};
