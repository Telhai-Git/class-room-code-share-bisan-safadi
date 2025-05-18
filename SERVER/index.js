// SERVER/index.js
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/projects', (req, res) => {
    res.json([
        { id: 1, title: "פרויקט ראשון", description: "תיאור הפרויקט הראשון" },
        { id: 2, title: "פרויקט שני", description: "תיאור הפרויקט השני" }
    ]);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

