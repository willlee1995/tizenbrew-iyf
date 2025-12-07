// Service file for IYF TV Mod
// This runs as a Node.js service alongside the module

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8086;

const corsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'iyf-tv-mod' });
});

// Start server
app.listen(PORT, () => {
    console.log(`IYF TV Mod service running on port ${PORT}`);
});

