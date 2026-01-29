const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./src/config/database');
// const ServiceService = require('./src/services/ServiceService');
// const DiagnosticService = require('./src/services/DiagnosticService');
// const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Seed initial services and diagnostics once MongoDB is connected
// We only seed when needed (e.g. via POST /api/services/seed, POST /api/diagnostics/seed)
// mongoose.connection.once('connected', async () => {
//     try {
//         await ServiceService.seedInitialServices();
//         await DiagnosticService.seedInitialDiagnostics();
//     } catch (error) {
//         console.error('Error seeding data:', error);
//     }
// });

const accessControlRoutes = require('./src/routes/accessControlRoutes');
// NOTE: Admin workflows are separated into admin-panel/backend.
// Main backend only exposes entity/officer/receptionist/user workflows.
const entityAuthRoutes = require('./src/routes/entityAuthRoutes');
const entitySettingsRoutes = require('./src/routes/entitySettingsRoutes');
const officerRoutes = require('./src/routes/officerRoutes');
const receptionistRoutes = require('./src/routes/receptionistRoutes');
const visitorRoutes = require('./src/routes/visitorRoutes');
const interactionRoutes = require('./src/routes/interactionRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes');
const diagnosticRoutes = require('./src/routes/diagnosticRoutes');
const imageRoutes = require('./src/routes/imageRoutes');
const reportRoutes = require('./src/routes/reportRoutes');

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for image uploads

// Serve static files from uploads directory
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Admin auth removed from main backend
// app.use('/api/auth', accessControlRoutes);

// Entity auth only (register/login/verify-otp)
app.use('/api/entities', entityAuthRoutes);
// Entity settings (protected routes)
app.use('/api/entities', entitySettingsRoutes);
app.use('/api/officers', officerRoutes);
app.use('/api/receptionists', receptionistRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/diagnostics', diagnosticRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', (req, res) => {
    res.send('Backend is running!');
});

app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from the backend!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
