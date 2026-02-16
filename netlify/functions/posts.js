const jwt = require("jsonwebtoken");
const { pool, ensureSchema } = require("./_db");

const slugify = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const getToken = (event) => {
  const header = event.headers?.authorization || event.headers?.Authorization;
  if (!header) return null;
  const [type, token] = header.split(" ");
  if (type !== "Bearer") return null;
  return token;
};

const verifyToken = (event) => {
  const token = getToken(event);
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
  } catch (err) {
    return null;
  }
};

exports.handler = async (event) => {
  await ensureSchema();

  if (event.httpMethod === "GET") {
    const result = await pool.query(
      "SELECT id, title, date, location, excerpt, cover, slug FROM posts ORDER BY id DESC"
    );
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.rows),
    };
  }

  if (event.httpMethod === "POST") {
    const user = verifyToken(event);
    if (!user) {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: false }),
      };
    }

    const payload = JSON.parse(event.body || "{}");
    const { title, date, location, excerpt, cover, content, slug } = payload;
    if (!title || !content) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: false }),
      };
    }

    let finalSlug = slug ? slugify(slug) : slugify(title);
    const existing = await pool.query("SELECT id FROM posts WHERE slug = $1", [
      finalSlug,
    ]);
    if (existing.rows.length) {
      finalSlug = `${finalSlug}-${Date.now()}`;
    }

    await pool.query(
      "INSERT INTO posts (title, date, location, excerpt, cover, content, slug) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [title, date, location, excerpt, cover, content, finalSlug]
    );

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, slug: finalSlug }),
    };
  }

  return {
    statusCode: 405,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: false }),
  };
};
