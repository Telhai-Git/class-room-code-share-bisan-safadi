// SERVER/index.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3001;
const pool = require("./db");

console.log("[BOOT] Server starting", new Date().toISOString());
console.log("[BOOT] Reviews route mounted");


app.use(cors());
app.use(express.json());

// -------- Projects --------
app.get("/api/projects", async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM projects");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("DB error");
  }
});

// -------- Contact --------
app.post("/api/contact", async (req, res) => {
  try {
    console.log("Incoming /api/contact body:", req.body);

    const body = req.body ?? {};
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    // Accept rating even if it's a string; coerce safely
    const r = Number.isFinite(Number(body.rating)) ? parseInt(body.rating, 10) : NaN;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "name, email, and message are required." });
    }
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return res.status(400).json({ message: "rating must be an integer 1–5." });
    }

    const sql = `
      INSERT INTO contact_messages (name, email, message, rating)
      VALUES ($1, $2, $3, $4)
      RETURNING id, created_at, rating
    `;
    // Use r here (NOT rating)
    const { rows } = await pool.query(sql, [name, email, message, r]);

    return res.status(201).json({
      message: "Message received!",
      id: rows[0].id,
      created_at: rows[0].created_at,
      rating: rows[0].rating
    });
  } catch (err) {
    console.error("POST /api/contact error:", err);
    // Optional: add detail during dev to see exact stack
    return res.status(500).json({
      message: "Server error",
      // detail: String(err.stack || err),
    });
  }
});


// -------- Public Reviews (read-only) --------
app.get("/api/reviews", async (req, res) => {
  try {
    const minRating = Math.max(1, Math.min(5, parseInt(req.query.minRating || "1", 10)));
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
    const offset = parseInt(req.query.offset || "0", 10);

    const { rows } = await pool.query(
      `SELECT id, name, message, rating, created_at
       FROM contact_messages
       WHERE rating >= $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [minRating, limit, offset]
    );

    res.json(rows);
  } catch (err) {
    console.error("GET /api/reviews error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



async function ensureAdmins() {
  const admins = [
    { username: "awsam", password: "1601" },
    { username: "bisan", password: "1601" },
  ];

  for (const a of admins) {
    const { rows } = await pool.query(
      "SELECT id FROM admin_users WHERE username=$1",
      [a.username]
    );
    if (!rows.length) {
      const hash = await bcrypt.hash(a.password, 12);
      await pool.query(
        "INSERT INTO admin_users (username, password_hash) VALUES ($1,$2)",
        [a.username, hash]
      );
      console.log(`[SEED] Created admin ${a.username}`);
    }
  }
}
ensureAdmins().catch((e) => console.error("[SEED ERROR]", e));

const JWT_SECRET = process.env.JWT_SECRET || "dev-change-me";

// middleware
function adminAuth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { sub, username, role }
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

// login
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: "username and password are required" });
  }

  const { rows } = await pool.query(
    "SELECT id, username, password_hash, role FROM admin_users WHERE username=$1",
    [username]
  );
  if (!rows.length) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, rows[0].password_hash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { sub: rows[0].id, username: rows[0].username, role: rows[0].role },
    JWT_SECRET,
    { expiresIn: "12h" }
  );
  await pool.query("UPDATE admin_users SET last_login = now() WHERE id=$1", [rows[0].id]);

  return res.json({
    token,
    user: { id: rows[0].id, username: rows[0].username, role: rows[0].role },
  });
});

// example protected route (you’ll add your admin APIs here)
app.get("/api/admin/me", adminAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});


// -------- Health --------
app.get("/", (_req, res) => res.send("API up"));

// ---- DEBUG: list all mounted routes on boot ----
function logRoutes() {
  try {
    console.log("[BOOT] Listing routes:");
    app._router.stack
      .filter((l) => l.route && l.route.path)
      .forEach((l) => {
        const methods = Object.keys(l.route.methods).join(",").toUpperCase();
        console.log(`  ${methods.padEnd(10)} ${l.route.path}`);
      });
  } catch (e) {
    console.log("[BOOT] Could not list routes:", e);
  }
}

// quick debug endpoint to view routes from the browser
app.get("/__routes", (_req, res) => {
  const routes = [];
  (app._router.stack || []).forEach((l) => {
    if (l.route && l.route.path) {
      routes.push({
        path: l.route.path,
        methods: Object.keys(l.route.methods),
      });
    }
  });
  res.json({ ok: true, routes });
});

// -------- Start server (always last) --------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  logRoutes(); // <-- must print all routes including /api/reviews
});
