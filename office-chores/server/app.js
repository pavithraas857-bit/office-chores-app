const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const teamRoutes = require('./routes/team');
const choresRoutes = require('./routes/chores');
const calendarRoutes = require('./routes/calendar');
const instancesRoutes = require('./routes/instances');

const app = express();

// SSE client management
const sseClients = new Set();

function broadcast(event) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of sseClients) {
    res.write(payload);
  }
}

app.set('broadcast', broadcast);

app.use(cors());
app.use(express.json());

// SSE endpoint — clients subscribe here for real-time updates
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

app.use('/api/team', teamRoutes);
app.use('/api/chores', choresRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/instances', instancesRoutes);

app.use(errorHandler);

module.exports = app;
