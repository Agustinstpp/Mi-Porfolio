const jwt = require("jsonwebtoken");

const getToken = (event) => {
  const header = event.headers?.authorization || event.headers?.Authorization;
  if (!header) return null;
  const [type, token] = header.split(" ");
  if (type !== "Bearer") return null;
  return token;
};

exports.handler = async (event) => {
  const token = getToken(event);
  if (!token) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authenticated: false }),
    };
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authenticated: true }),
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authenticated: false }),
    };
  }
};
