const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');

const app = express();
app.use(cors({
  origin: '*',
}));

// We use express to define our various API endpoints and
// provide their handlers that we implemented in routes.js

//app.get('/home/:redistricting_id/:type/:year', routes.home);
app.get('/analytics7', routes.analytics7);
app.get('/analytics11', routes.analytics11);
app.get('/analytics13', routes.analytics13);
app.get('/comparison', routes.comparison);
app.get('/comparisonA', routes.comparisonA);
app.get('/summary', routes.summary);
app.get('/get_districts', routes.get_districts);
app.get('/get_states', routes.get_states)
app.get('/get_districtings', routes.get_districtings)
app.post('/create/add', routes.add);
app.get('/', routes.home);

app.listen(config.server_port, () => {
  console.log(`Server running at http://${config.server_host}:${config.server_port}/`)
});

module.exports = app;
