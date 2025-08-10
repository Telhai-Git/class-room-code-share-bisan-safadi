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
        // 1) Inspect what arrived
        console.log("Incoming /api/contact body:", req.body);

        // 2) Pull + sanitize
        const body = req.body ?? {};
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const email = typeof body.email === "string" ? body.email.trim() : "";
        const message = typeof body.message === "string" ? body.message.trim() : "";
        const r = Number.isFinite(Number(body.rating)) ? parseInt(body.rating, 10) : NaN;

        // 3) Validate BEFORE hitting SQL
        if (!name || !email || !message) {
            return res.status(400).json({ message: "name, email, and message are required." });
        }
        if (!Number.isInteger(r) || r < 1 || r > 5) {
            return res.status(400).json({ message: "rating must be an integer 1–5." });
        }

        console.log("Parsed rating r:", r, typeof r);

        // 4) Insert (force int cast just in case)
        const sql = `
      INSERT INTO contact_messages (name, email, message, rating)
      VALUES ($1, $2, $3, $4::int)
      RETURNING id, created_at, rating
    `;
        const { rows } = await pool.query(sql, [name, email, message, r]);
        console.log("Inserted row:", rows[0]);

        return res.status(201).json({
            message: "Message received!",
            route_version: "contact-v3",
            id: rows[0].id,
            created_at: rows[0].created_at,
            rating: rows[0].rating,
        });
    } catch (err) {
        console.error("POST /api/contact error:", err);
        // TEMP: expose details so we can see *why* it 500s
        return res.status(500).json({
            message: "Server error",
            code: err.code || null,
            detail: err.detail || err.message || null,
        });
    }
});



// -------- Health --------
app.get("/", (_req, res) => res.send("API up"));

// -------- Start server (always last) --------
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
