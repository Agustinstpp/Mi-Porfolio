const path = require("path");
const express = require("express");
const session = require("express-session");
const { db, init } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

init();

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "portfolio-secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(express.static(__dirname));

const slugify = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const requireAuth = (req, res, next) => {
  if (req.session?.user) return next();
  return res.status(401).json({ ok: false });
};

app.get("/api/posts", (req, res) => {
  db.all(
    "SELECT id, title, date, location, excerpt, cover, slug FROM posts ORDER BY id DESC",
    (err, rows) => {
      if (err) return res.status(500).json([]);
      res.json(rows);
    }
  );
});

app.get("/api/posts/:slug", (req, res) => {
  db.get("SELECT * FROM posts WHERE slug = ?", [req.params.slug], (err, row) => {
    if (err || !row) return res.status(404).json({});
    res.json(row);
  });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err || !user) return res.json({ ok: false });
    const bcrypt = require("bcryptjs");
    const ok = bcrypt.compareSync(password, user.password);
    if (!ok) return res.json({ ok: false });
    req.session.user = { id: user.id, username: user.username };
    res.json({ ok: true });
  });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/session", (req, res) => {
  res.json({ authenticated: !!req.session?.user });
});

app.post("/api/posts", requireAuth, (req, res) => {
  const { title, date, location, excerpt, cover, content, slug } = req.body;
  if (!title || !content) return res.status(400).json({ ok: false });
  let finalSlug = slug ? slugify(slug) : slugify(title);
  const ensureUnique = () => {
    db.get("SELECT id FROM posts WHERE slug = ?", [finalSlug], (err, row) => {
      if (row) {
        finalSlug = `${finalSlug}-${Date.now()}`;
      }
      db.run(
        "INSERT INTO posts (title, date, location, excerpt, cover, content, slug) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [title, date, location, excerpt, cover, content, finalSlug],
        function (insertErr) {
          if (insertErr) return res.status(500).json({ ok: false });
          res.json({ ok: true, id: this.lastID, slug: finalSlug });
        }
      );
    });
  };
  ensureUnique();
});

app.listen(PORT, () => {
  console.log(`Servidor activo en http://localhost:${PORT}`);
});
