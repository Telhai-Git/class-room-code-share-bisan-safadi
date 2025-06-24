// SERVER/index.js
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3001;
require("dotenv").config();
const pool = require("./db");

app.use(cors());
app.use(express.json());

// קריאה מה-DB לטבלת projects
app.get("/api/projects", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM projects");
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("DB error");
    }
});

// שליחת הודעת צור קשר
app.post("/api/contact", async (req, res) => {
    const { name, email, message } = req.body;
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

app.get("/", (req, res) => {
    res.send("Server is running. Use /api/projects to get data.");
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
