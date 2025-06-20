// SERVER/index.js
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3001;
require("dotenv").config();

app.use(cors());
app.use(express.json());

app.get("/api/projects", (req, res) => {
    res.json([
        { id: 1, title: "Weather App", description: "React app using OpenWeatherMap API" },
        { id: 2, title: "Task Manager", description: "To-do app with MongoDB" },
        { id: 3, title: "Portfolio", description: "This portfolio website!" }
    ]);
});


app.get("/", (req, res) => {
    res.send("Server is running. Use /api/projects to get data.");
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
