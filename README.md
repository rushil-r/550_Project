# 550_Project: Redistricting Simulator

<b>Project Description:</b>

<div>
</div>
Our app allows users to simulate the 2016, 2020 presidential elections and the 2016, 2018, 2020 House elections under customizable district lines, view and compare actual election results, and access a public repository of redistricting configurations. The main motivation is to visualize how gerrymandering/redistricting can affect election results, and to draw meaningful analytics about precinct political preferences across multiple years. For example, campaigners will be able to create voting districts by state to analyze the importance of a given precinct on the elections results, as well as determine which precincts historically vote for which party. Our two datasets on House and presidential elections will be used to identify party discrepancies on the state/federal level. Although the distribution of precincts has no material impact on the outcome of a federal presidential election, we still think an analysis of how districts change from being associated with one party to another would provide insight into where presidential candidates should focus their campaigning effort.

Setup Instructions
Run npm install in both the client and server files
In one terminal, from the project directory run ‘cd server’ then ‘npm start’, server should be running on port 8080
In another terminal, from the project directory run ‘cd client’ then ‘npm start’, client should run on port 3000
Routes:
/ - home page route (query parameters: redistricting_id, election_type, year, state, district, precincts)
/summary - summary page route (query parameters: state, districting)
/analytics - analytics page route
/comparison - comparison page route (query parameters: redistricting_1, redistricting_2, state)
/comparisonA - comparison page second query route (query parameters: redistricting_1, redistricting_2, state)
/analytics7 - auxiliary route for analytics page (query parameters: year1)
/analytics11 - auxiliary route for analytics page (query parameters: year1)
/analytics13 - auxiliary routes for analytics page (query parameters: year1, year2)
/get_districts - retrieves number of districts in a state
/get_states - retrieves the list of states
/get_districtings - retrieves the names of all district mappings
Directories and selected files
Server: contains controller implementation
config.json: url and credentials for database
server.js: accepts app requests on localhost and invokes appropriate route
routes.js: executes app requests by forwarding queries to the database, returns Json object(s) to request
App.js: handles navigation of web application
Client Files (under src)
Pages
HomePage.js, HomePage.css: CSS and JS to define structure for the home route. This code illustrates a table with raw election results at the precinct level. There is also a dynamic text that displays summary statements about the chosen election. We have dropdowns that appear to pick selection parameters.
CreatePage.js, CreatePage.css: frontend code and styling for summary page of the web application. This includes a table of average votes for each party in all precincts, which can be queried by state and district mapping.
AnalyticsPage.js: define structure and content of the Analytics page, displays which precincts exhibited large changes in voting behavior by various metrics
ComparisonPage.js, ComparsionPage.css: CSS and JS files to define the front-end of comparison page. This includes the 3 drop-down menus for user-selected parameters and the display of the results of 2 separate SQL queries in 2 datagrids
