const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "blog.db");
const db = new sqlite3.Database(dbPath);

const seedPosts = [
  {
    title: "Agencia de Maketing, Diseño Grafico y Desarrollo de Sofware",
    date: "December 7, 2020",
    location: "Corrientes, Argentina",
    excerpt: "Proyecto integral de marketing, identidad visual y desarrollo web.",
    cover: "imag/Portada%20Smart%20Techs%20PC.jpg",
    slug: "smart-techs",
    content: `
      <p>Desarrollo de identidad visual y plataforma web para Smart Techs, con un enfoque integral en marketing digital.</p>
      <p>Se trabajó en diseño UX/UI, implementación y estrategia de contenidos para mejorar la conversión.</p>
      <img src="imag/foto%20cafe.JPG" alt="Proceso creativo" />
      <h4>ESTRATEGIAS</h4>
      <p>Comunicación clara, landing optimizada y material gráfico para redes.</p>
      <img src="imag/estrategias%20st.jpg" alt="Estrategias" />
      <p>Resultados: mayor alcance, mejor posicionamiento y un flujo de leads más constante.</p>
    `,
  },
  {
    title: "LlegaRapido: Rediseño de plataforma y pagina web",
    date: "May 8, 2025",
    location: "Buenos Aires, Argentina",
    excerpt: "Rediseño completo del producto digital con enfoque en usabilidad.",
    cover: "imag/Portada%20LlegaRapido%20PC.jpg",
    slug: "llegarapido",
    content: `
      <p>Rediseño de la plataforma LlegaRapido con mejoras en el flujo de compra y diseño visual.</p>
      <img src="imag/Portada%20LlegaRapido%20Iphone.jpg" alt="Mobile" />
      <p>Se optimizó la performance y la claridad de la propuesta de valor.</p>
    `,
  },
  {
    title: "Puerto Pirayu",
    date: "August 5, 2024",
    location: "Misiones, Argentina",
    excerpt: "Identidad de marca y piezas gráficas para turismo local.",
    cover: "imag/Portada%20puerto%20del%20pirayu.jpg",
    slug: "puerto-pirayu",
    content: `
      <p>Diseño de branding y material promocional para Puerto Pirayu.</p>
      <p>Se trabajó en la estética general y la comunicación visual del destino.</p>
    `,
  },
  {
    title: "Suhka | Salon de Belleza",
    date: "March 14, 2024",
    location: "Corrientes, Argentina",
    excerpt: "Branding y presencia digital para salón de belleza.",
    cover: "imag/Portada%20Sukha.jpg",
    slug: "suhka",
    content: `
      <p>Creación de identidad visual y piezas gráficas para Suhka.</p>
      <p>Enfoque en elegancia y experiencia de marca consistente.</p>
    `,
  },
];

const init = () => {
  db.serialize(() => {
    db.run(
      `CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        date TEXT,
        location TEXT,
        excerpt TEXT,
        cover TEXT,
        content TEXT,
        slug TEXT UNIQUE
      )`
    );

    db.run(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
      )`
    );

    db.get("SELECT COUNT(*) as count FROM posts", (err, row) => {
      if (err) return;
      if (row.count === 0) {
        const stmt = db.prepare(
          "INSERT INTO posts (title, date, location, excerpt, cover, content, slug) VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        seedPosts.forEach((post) => {
          stmt.run(
            post.title,
            post.date,
            post.location,
            post.excerpt,
            post.cover,
            post.content,
            post.slug
          );
        });
        stmt.finalize();
      }
    });

    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
      if (err) return;
      if (row.count === 0) {
        const hash = bcrypt.hashSync("admin123", 10);
        db.run("INSERT INTO users (username, password) VALUES (?, ?)", ["admin", hash]);
      }
    });
  });
};

module.exports = { db, init };
