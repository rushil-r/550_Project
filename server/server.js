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
app.get('/analytics', routes.analytics);
app.get('/comparison/:redistricting_id_1/:redistricting_id_2', routes.comparison);
app.get('/create', routes.create);
app.get('/get_districts', routes.get_districts);
app.get('/get_states', routes.get_states)
app.get('/get_districtings', routes.get_districtings)
app.post('/create/add', routes.add);


app.listen(config.server_port, () => {
  console.log(`Server running at http://${config.server_host}:${config.server_port}/`)
});

module.exports = app;
