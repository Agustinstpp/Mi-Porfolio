const { pool, ensureSchema } = require("./_db");

exports.handler = async (event) => {
  await ensureSchema();
  const slug = event.queryStringParameters?.slug;
  if (!slug) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    };
  }

  const result = await pool.query("SELECT * FROM posts WHERE slug = $1", [slug]);
  if (!result.rows.length) {
    return {
      statusCode: 404,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result.rows[0]),
  };
};
