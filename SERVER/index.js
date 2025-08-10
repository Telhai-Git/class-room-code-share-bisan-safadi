// SERVER/index.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;
const pool = require("./db");

console.log("[BOOT] Server starting", new Date().toISOString());

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
    console.log("Incoming /api/contact body:", req.body); // <--- NEW

    const body = req.body ?? {};
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    // Accept rating even if it's a string, coerce safely:
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
    const { rows } = await pool.query(sql, [name, email, message, r]);

    return res.status(201).json({
      message: "Message received!",
      id: rows[0].id,
      created_at: rows[0].created_at,
      rating: rows[0].rating, // <--- NEW (echo it back)
    });
  } catch (err) {
    console.error("POST /api/contact error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});



// -------- Health --------
app.get("/", (_req, res) => res.send("API up"));

// -------- Start server (always last) --------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
