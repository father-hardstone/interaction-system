const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./src/config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

const accessControlRoutes = require('./src/routes/accessControlRoutes');
const entityRoutes = require('./src/routes/entityRoutes');
const { authenticateToken, requireRoles } = require('./src/middleware/auth');

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for image uploads

// Serve static files from uploads directory
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', accessControlRoutes);

// Admin-only API surface
app.use('/api/entities', authenticateToken, requireRoles(['admin']), entityRoutes);

app.get('/', (req, res) => {
    res.send('Backend is running!');
});

app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from the backend!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
