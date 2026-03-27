const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const teamRoutes = require('./routes/team');
const choresRoutes = require('./routes/chores');
const calendarRoutes = require('./routes/calendar');
const instancesRoutes = require('./routes/instances');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/team', teamRoutes);
app.use('/api/chores', choresRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/instances', instancesRoutes);

app.use(errorHandler);

module.exports = app;
