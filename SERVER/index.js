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
