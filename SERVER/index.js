// SERVER/index.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;
const pool = require("./db");

app.use(cors());
app.use(express.json());

// Projects
app.get("/api/projects", async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM projects");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("DB error");
  }
});

// Contact
app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body || {};
  try {
    await pool.query(
      "INSERT INTO contact_messages (name, email, message) VALUES ($1, $2, $3)",
      [name, email, message]
    );
    res.status(201).send("Message received!");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// === Reviews: CREATE ===
app.post("/api/reviews", async (req, res) => {
  try {
    const { name = "Anonymous", email = "", rating, comment } = req.body || {};
    const r = Number(rating);

    if (!comment || !r) {
      return res.status(400).json({ message: "rating and comment are required." });
    }
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return res.status(400).json({ message: "rating must be an integer 1–5." });
    }

    const insert =
      "INSERT INTO reviews (name, email, rating, comment) VALUES ($1,$2,$3,$4) RETURNING id, created_at";
    const { rows } = await pool.query(insert, [name, email, r, comment.trim()]);
    return res.status(201).json({
      message: "Review saved successfully.",
      id: rows[0].id,
      created_at: rows[0].created_at,
    });
  } catch (err) {
    console.error("POST /api/reviews error:", err);
    return res.status(500).json({ message: "Server error while saving review." });
  }
});

// === Reviews: LIST (optional, for showing on page) ===
app.get("/api/reviews", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, rating, comment, created_at
       FROM reviews
       ORDER BY created_at DESC
       LIMIT 50`
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /api/reviews error:", err);
    res.status(500).json({ message: "Server error while reading reviews." });
  }
});

// Health
app.get("/", (_req, res) => res.send("API up"));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
