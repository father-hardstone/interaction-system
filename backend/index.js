const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const accessControlRoutes = require('./src/routes/accessControlRoutes');
const entityRoutes = require('./src/routes/entityRoutes');
const officerRoutes = require('./src/routes/officerRoutes');
const receptionistRoutes = require('./src/routes/receptionistRoutes');
const visitorRoutes = require('./src/routes/visitorRoutes');
const interactionRoutes = require('./src/routes/interactionRoutes');

app.use(cors());
app.use(express.json());

app.use('/api/auth', accessControlRoutes);
app.use('/api/entities', entityRoutes);
app.use('/api/officers', officerRoutes);
app.use('/api/receptionists', receptionistRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/interactions', interactionRoutes);

app.get('/', (req, res) => {
    res.send('Backend is running!');
});

app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from the backend!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
