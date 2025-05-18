<<<<<<< HEAD
const express = require('express');
const cors = require('cors');
const projectRoutes = require('./routes/projectRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Connect your route
app.use('/api/projects', projectRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
=======
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

>>>>>>> 1bce97720aa53120127e8130c5f933778ee7bcc2
