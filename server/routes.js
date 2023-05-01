const mysql = require('mysql')
const config = require('./config.json')

// Creates MySQL connection using database credential provided in config.json
// Do not edit. If the connection fails, make sure to check that config.json is filled out correctly
const connection = mysql.createConnection({
  host: config.rds_host,
  user: config.rds_user,
  password: config.rds_password,
  port: config.rds_port,
  database: config.rds_db
});
connection.connect((err) => err && console.log(err));

// Route 1: GET /home:redistricting_id:type:year:state:district:precinct
// Route 1: GET /home/redistricting_id/election_type:year:state:district:precincts
const home = async function(req, res) {
  const redistricting_id = req.query.redistricting_id ?? null;
  console.log(`Redistricting ID:  ${redistricting_id}`);
  const election_type = req.query.election_type ?? null;
  console.log(`Election Type:  ${election_type}`)
  const year = req.query.year ?? null;
  console.log(`Year:  ${year}`);
  const state = req.query.state ?? null; 
  console.log(`State:  ${state}`);
  const district = req.query.district ?? null; 
  console.log(`District:  ${district}`);
  const precincts = req.query.precincts ?? null; 
  if ((redistricting_id === null) || (election_type === null) || (year === null)) {
    output = {}
    output['election_data'] = {} 
    output['election_summary'] = {} 
    res.json(output)
  } else {
    selection_params = `PR.year = ${year} AND PR.election_type = '${election_type}'`
    if (state !== null) {
      selection_params = `PR.year = ${year} AND PR.election_type = '${election_type}' AND PR.state = '${state}'`; 
      if (district !== null) {
        selection_params = `PR.year = ${year} AND PR.election_type = '${election_type}' AND PR.state = '${state}' AND DM.district = ${district}`; 
        if (precincts !== null) {
          selection_params = `PR.year = ${year} AND PR.election_type = '${election_type}' AND PR.state = '${state}' AND DM.district = ${district} AND PR.precinct IN ${precincts}`;
        }
      }
    } 
    if (state === null || state === 'All') {    
      if (election_type == 'presidential') {
        console.log('all presidential')
        connection.query(`  
          WITH state_winners AS
          (
            WITH state_votes AS
          (SELECT state, party, SUM(votes) AS total_votes
          FROM PRECINCT_RESULT PR
          WHERE PR.election_type = 'presidential' AND PR.year = ${year}
          GROUP BY state, party)
          SELECT state, party
          FROM state_votes sv
          WHERE (sv.state, total_votes) IN
            (SELECT sv2.state, MAX(total_votes)
              FROM state_votes sv2
              WHERE sv2.state = sv.state
              GROUP BY state)
              )
          SELECT SW.party, SUM(num_electoral_votes) AS electoral_votes
          FROM state_winners SW JOIN STATE S ON SW.state = S.state
          GROUP BY SW.party
        `,
        (err, data) => { 
          if (err || data.length === 0) {
            console.log('line 69')
            console.log(err); 
            election_results = {}; 
          } else  { 
            console.log('line 73')
            election_results = data;
            connection.query(` 
            SELECT PR.state, PR.county, PR.precinct, DM.district,
            SUM(CASE WHEN PR.party = 'Republican' THEN votes ELSE 0 END) AS republican_votes,
            SUM(CASE WHEN PR.party = 'Democrat' THEN votes ELSE 0 END) AS democratic_votes,
            SUM(CASE WHEN PR.party = 'Libertarian' THEN votes ELSE 0 END) AS libertarian_votes,
            SUM(CASE WHEN PR.party = 'Green' THEN votes ELSE 0 END) AS green_votes,
            SUM(CASE WHEN PR.party = 'Constitution' THEN votes ELSE 0 END) AS constitution_votes, 
            SUM(CASE WHEN PR.party = 'Independent' THEN votes ELSE 0 END) AS independent_votes
            FROM (PRECINCT_RESULT PR JOIN (SELECT * FROM MAP_ELEMENT WHERE district_mapping = '${redistricting_id}') DM ON
            PR.state = DM.state AND PR.county = DM.county AND PR.precinct = DM.precinct)
            WHERE ${selection_params}
            GROUP BY state, county, precinct, district
            ORDER BY state, county, precinct ASC
          `,
          (err, data) => {
            if (err || data.length === 0) {
              console.log('line 91')
              console.log(err);
              election_data = {}; 
            } else {
              console.log('line 92')
              election_data = data;
              // console.log(election_data)
              output = {} 
              output['election_data'] = election_data 
              console.log('line 97')
              output['election_summary'] = election_results
              // console.log(output)
              res.json(output)
            }
          }) 
          }
        })
    } else {
        connection.query(` 
        WITH district_results AS
        (WITH precincts AS (SELECT PR.state, PR.party, DM.district, PR.votes, PR.precinct FROM PRECINCT_RESULT PR JOIN (SELECT * FROM MAP_ELEMENT WHERE district_mapping = '${redistricting_id}') DM ON
        PR.state = DM.state AND PR.county = DM.county AND PR.precinct = DM.precinct
        WHERE PR.year = ${year} AND PR.election_type = 'house')
        SELECT precincts.state, precincts.party, precincts.district, SUM(precincts.votes) AS num_votes
        FROM precincts
        GROUP BY state, district, party)
        SELECT DR1.party, COUNT(*) AS num_seats
        FROM district_results DR1
        WHERE (DR1.state, DR1.district, DR1.num_votes) = (SELECT DR2.state, DR2.district, MAX(DR2.num_votes)
        FROM district_results DR2 WHERE DR1.state = DR2.state
        AND DR1.district = DR2.district
        GROUP BY DR2.state, DR2.district)
        GROUP BY party
        `,
        (err, data) => {
          if (err || data.length === 0) {
            console.log(err);
            election_results = {}; 
            res.json({});
          } else  {
            election_results = data;
            connection.query(` 
            SELECT PR.state, PR.county, PR.precinct, DM.district, PR.party,
            SUM(CASE WHEN PR.party = 'Republican' THEN votes ELSE 0 END) AS republican_votes,
            SUM(CASE WHEN PR.party = 'Democratic' THEN votes ELSE 0 END) AS democratic_votes,
            SUM(CASE WHEN PR.party = 'Libertarian' THEN votes ELSE 0 END) AS libertarian_votes,
            SUM(CASE WHEN PR.party = 'Green' THEN votes ELSE 0 END) AS green_votes,
            SUM(CASE WHEN PR.party = 'Constitution' THEN votes ELSE 0 END) AS constitution_votes, 
            SUM(CASE WHEN PR.party = 'Independent' THEN votes ELSE 0 END) AS independent_votes
            FROM (PRECINCT_RESULT PR JOIN (SELECT * FROM MAP_ELEMENT WHERE district_mapping = '${redistricting_id}') DM ON
            PR.state = DM.state AND PR.county = DM.county AND PR.precinct = DM.precinct)
            WHERE ${selection_params}
            GROUP BY state, county, precinct, district
            ORDER BY state, county, precinct ASC
          `,
          (err, data) => {
            if (err || data.length === 0) {
              console.log(err);
              election_data = {}; 
            } else {
              election_data = data;
              output = {} 
              output['election_data'] = election_data 
          
              output['election_summary'] = election_results
              res.json(output)
            }
          }) 
  
  
          }
        }) 
      } 
    } else if (district === null || district === 'All') {  
      console.log('State Provided')
      if (election_type == 'presidential') {
        connection.query(` 
        SELECT party, SUM(votes) AS num_votes
        FROM PRECINCT_RESULT PR
        WHERE PR.election_type = 'presidential' AND PR.year = 2016 AND PR.state = '${state}'
        GROUP BY PR.party
        `,
        (err, data) => {
          if (err || data.length === 0) {
            console.log(err);
            election_results = {};
          } else  {
            console.log('line 179')
            election_results = data;
            connection.query(` 
            SELECT PR.state, PR.county, PR.precinct, DM.district, PR.party,
            SUM(CASE WHEN PR.party = 'Republican' THEN votes ELSE 0 END) AS republican_votes,
            SUM(CASE WHEN PR.party = 'Democratic' THEN votes ELSE 0 END) AS democratic_votes,
            SUM(CASE WHEN PR.party = 'Libertarian' THEN votes ELSE 0 END) AS libertarian_votes,
            SUM(CASE WHEN PR.party = 'Green' THEN votes ELSE 0 END) AS green_votes,
            SUM(CASE WHEN PR.party = 'Constitution' THEN votes ELSE 0 END) AS constitution_votes, 
            SUM(CASE WHEN PR.party = 'Independent' THEN votes ELSE 0 END) AS independent_votes
            FROM (PRECINCT_RESULT PR JOIN (SELECT * FROM MAP_ELEMENT WHERE district_mapping = '${redistricting_id}') DM ON
            PR.state = DM.state AND PR.county = DM.county AND PR.precinct = DM.precinct)
            WHERE ${selection_params}
            GROUP BY state, county, precinct, district
            ORDER BY state, county, precinct ASC
          `,
          (err, data) => {
            if (err || data.length === 0) {
              console.log(err);
              election_data = {}; 
            } else {
              election_data = data;
              output = {} 
              output['election_data'] = election_data 
              // console.log(output) 
              console.log('line 202')
              console.log(election_results)
              output['election_summary'] = election_results
              res.json(output)
            }
          }) 
  
  
          }
        })
      } else { 
        connection.query(` 
        WITH district_results AS
        (WITH precincts AS (SELECT PR.state, PR.party, DM.district, PR.votes, PR.precinct FROM PRECINCT_RESULT PR JOIN (SELECT * FROM MAP_ELEMENT WHERE district_mapping = '${redistricting_id}') DM ON
        PR.state = DM.state AND PR.county = DM.county AND PR.precinct = DM.precinct
        WHERE PR.year = ${year} AND PR.election_type = 'house' AND PR.state = '${state}')
        SELECT precincts.state, precincts.party, precincts.district, SUM(precincts.votes) AS num_votes
        FROM precincts
        GROUP BY state, district, party)
        SELECT DR1.party, COUNT(*) AS num_seats
        FROM district_results DR1
        WHERE (DR1.state, DR1.district, DR1.num_votes) = (SELECT DR2.state, DR2.district, MAX(DR2.num_votes)
        FROM district_results DR2 WHERE DR1.state = DR2.state
        AND DR1.district = DR2.district
        GROUP BY DR2.state, DR2.district)
        GROUP BY party
        `,
        (err, data) => {
          if (err || data.length === 0) {
            console.log(err);
            election_results = {};
          } else  {
            election_results = data;
            connection.query(` 
            SELECT PR.state, PR.county, PR.precinct, DM.district, PR.party,
            SUM(CASE WHEN PR.party = 'Republican' THEN votes ELSE 0 END) AS republican_votes,
            SUM(CASE WHEN PR.party = 'Democratic' THEN votes ELSE 0 END) AS democratic_votes,
            SUM(CASE WHEN PR.party = 'Libertarian' THEN votes ELSE 0 END) AS libertarian_votes,
            SUM(CASE WHEN PR.party = 'Green' THEN votes ELSE 0 END) AS green_votes,
            SUM(CASE WHEN PR.party = 'Constitution' THEN votes ELSE 0 END) AS constitution_votes, 
            SUM(CASE WHEN PR.party = 'Independent' THEN votes ELSE 0 END) AS independent_votes
            FROM (PRECINCT_RESULT PR JOIN (SELECT * FROM MAP_ELEMENT WHERE district_mapping = '${redistricting_id}') DM ON
            PR.state = DM.state AND PR.county = DM.county AND PR.precinct = DM.precinct)
            WHERE ${selection_params}
            GROUP BY state, county, precinct, district
            ORDER BY state, county, precinct ASC
          `,
          (err, data) => {
            if (err || data.length === 0) {
              console.log(err);
              election_data = {}; 
            } else {
              election_data = data;
              output = {} 
              output['election_data'] = election_data 
          
              output['election_summary'] = election_results
              res.json(output)
            }
          }) 
  
  
          }
        })
      } 
    } else if (precincts === null) { 
      if (election_type == 'presidential') {
        connection.query(` 
        SELECT party, SUM(votes) AS num_votes
        FROM  (PRECINCT_RESULT PR JOIN (SELECT * FROM MAP_ELEMENT WHERE district_mapping = '${redistricting_id}') DM ON
        PR.state = DM.state AND PR.county = DM.county AND PR.precinct = DM.precinct)
        WHERE PR.election_type = 'presidential' AND PR.year = ${year} AND DM.district = '${district}'
        GROUP BY PR.party
        `,
        (err, data) => {
          if (err || data.length === 0) {
            console.log(err);
            election_results = {};
          } else  {
            election_results = data;
            connection.query(` 
            SELECT PR.state, PR.county, PR.precinct, DM.district, PR.party,
            SUM(CASE WHEN PR.party = 'Republican' THEN votes ELSE 0 END) AS republican_votes,
            SUM(CASE WHEN PR.party = 'Democratic' THEN votes ELSE 0 END) AS democratic_votes,
            SUM(CASE WHEN PR.party = 'Libertarian' THEN votes ELSE 0 END) AS libertarian_votes,
            SUM(CASE WHEN PR.party = 'Green' THEN votes ELSE 0 END) AS green_votes,
            SUM(CASE WHEN PR.party = 'Constitution' THEN votes ELSE 0 END) AS constitution_votes, 
            SUM(CASE WHEN PR.party = 'Independent' THEN votes ELSE 0 END) AS independent_votes
            FROM (PRECINCT_RESULT PR JOIN (SELECT * FROM MAP_ELEMENT WHERE district_mapping = '${redistricting_id}') DM ON
            PR.state = DM.state AND PR.county = DM.county AND PR.precinct = DM.precinct)
            WHERE ${selection_params}
            GROUP BY state, county, precinct, district
            ORDER BY state, county, precinct ASC
          `,
          (err, data) => {
            if (err || data.length === 0) {
              console.log(err);
              election_data = {}; 
            } else {
              election_data = data;
              output = {} 
              output['election_data'] = election_data 
          
              output['election_summary'] = election_results
              // console.log('line 289')
              // console.log(output)
              res.json(output)
            }
          }) 
  
  
          }
        })
      } else {
        connection.query(`  
        SELECT party, SUM(votes) AS num_votes
        FROM  (PRECINCT_RESULT PR JOIN (SELECT * FROM MAP_ELEMENT WHERE district_mapping = '${redistricting_id}') DM ON
        PR.state = DM.state AND PR.county = DM.county AND PR.precinct = DM.precinct)
        WHERE PR.election_type = 'house' AND PR.year = ${year} AND PR.state = '${state}' AND DM.district = ${district}
        GROUP BY PR.party   
        `,
        (err, data) => {
          if (err || data.length === 0) {
            console.log(err);
            election_results = {};
          } else  {
            election_results = data;
            connection.query(` 
            SELECT PR.state, PR.county, PR.precinct, DM.district, PR.party,
            SUM(CASE WHEN PR.party = 'Republican' THEN votes ELSE 0 END) AS republican_votes,
            SUM(CASE WHEN PR.party = 'Democratic' THEN votes ELSE 0 END) AS democratic_votes,
            SUM(CASE WHEN PR.party = 'Libertarian' THEN votes ELSE 0 END) AS libertarian_votes,
            SUM(CASE WHEN PR.party = 'Green' THEN votes ELSE 0 END) AS green_votes,
            SUM(CASE WHEN PR.party = 'Constitution' THEN votes ELSE 0 END) AS constitution_votes, 
            SUM(CASE WHEN PR.party = 'Independent' THEN votes ELSE 0 END) AS independent_votes
            FROM (PRECINCT_RESULT PR JOIN (SELECT * FROM MAP_ELEMENT WHERE district_mapping = '${redistricting_id}') DM ON
            PR.state = DM.state AND PR.county = DM.county AND PR.precinct = DM.precinct)
            WHERE ${selection_params}
            GROUP BY state, county, precinct, district
            ORDER BY state, county, precinct ASC
          `,
          (err, data) => {
            if (err || data.length === 0) {
              console.log(err);
              election_data = {}; 
            } else {
              election_data = data;
              output = {} 
              output['election_data'] = election_data 
          
              output['election_summary'] = election_results
              res.json(output)
            }
          }) 
  
  
          }
        })
      }
    } else { 
      if (election_type == 'presidential') {
        connection.query(` 
        SELECT party, SUM(votes) AS num_votes
        FROM (PRECINCT_RESULT PR JOIN (SELECT * FROM MAP_ELEMENT WHERE district_mapping = '${redistricting_id}') DM ON
        PR.state = DM.state AND PR.county = DM.county AND PR.precinct = DM.precinct)
        WHERE PR.election_type = 'presidential' AND PR.year = ${year} AND DM.district = ${district}
        AND PR.precinct IN ${precincts}
        GROUP BY PR.party
        `,
        (err, data) => {
          if (err || data.length === 0) {
            console.log(err);
            election_results = {};
          } else  {
            election_results = data;
            connection.query(` 
            SELECT PR.state, PR.county, PR.precinct, DM.district, PR.party,
            SUM(CASE WHEN PR.party = 'Republican' THEN votes ELSE 0 END) AS republican_votes,
            SUM(CASE WHEN PR.party = 'Democratic' THEN votes ELSE 0 END) AS democratic_votes,
            SUM(CASE WHEN PR.party = 'Libertarian' THEN votes ELSE 0 END) AS libertarian_votes,
            SUM(CASE WHEN PR.party = 'Green' THEN votes ELSE 0 END) AS green_votes,
            SUM(CASE WHEN PR.party = 'Constitution' THEN votes ELSE 0 END) AS constitution_votes, 
            SUM(CASE WHEN PR.party = 'Independent' THEN votes ELSE 0 END) AS independent_votes
            FROM (PRECINCT_RESULT PR JOIN (SELECT * FROM MAP_ELEMENT WHERE district_mapping = '${redistricting_id}') DM ON
            PR.state = DM.state AND PR.county = DM.county AND PR.precinct = DM.precinct)
            WHERE ${selection_params}
            GROUP BY state, county, precinct, district
            ORDER BY state, county, precinct ASC
          `,
          (err, data) => {
            if (err || data.length === 0) {
              console.log(err);
              election_data = {}; 
            } else {
              election_data = data;
              output = {} 
              output['election_data'] = election_data 
              output['election_summary'] = election_results
              res.json(output) 
            }
          }) 
          }
        })
      } else {
        connection.query(`  
        SELECT party, SUM(votes) AS num_votes
        FROM (PRECINCT_RESULT PR JOIN (SELECT * FROM MAP_ELEMENT WHERE district_mapping = '${redistricting_id}') DM ON
        PR.state = DM.state AND PR.county = DM.county AND PR.precinct = DM.precinct)
        WHERE PR.election_type = 'house' AND PR.year = ${year} AND PR.state = '${state}'
        AND DM.district = ${district} AND PR.precinct IN ${precincts}
        GROUP BY PR.party   
        `,
        (err, data) => {
          if (err || data.length === 0) {
            console.log(err);
            election_results = {};
          } else {
            election_results = data;
            connection.query(` 
            SELECT PR.state, PR.county, PR.precinct, DM.district, PR.party,
            SUM(CASE WHEN PR.party = 'Republican' THEN votes ELSE 0 END) AS republican_votes,
            SUM(CASE WHEN PR.party = 'Democratic' THEN votes ELSE 0 END) AS democratic_votes,
            SUM(CASE WHEN PR.party = 'Libertarian' THEN votes ELSE 0 END) AS libertarian_votes,
            SUM(CASE WHEN PR.party = 'Green' THEN votes ELSE 0 END) AS green_votes,
            SUM(CASE WHEN PR.party = 'Constitution' THEN votes ELSE 0 END) AS constitution_votes, 
            SUM(CASE WHEN PR.party = 'Independent' THEN votes ELSE 0 END) AS independent_votes
            FROM (PRECINCT_RESULT PR JOIN (SELECT * FROM MAP_ELEMENT WHERE district_mapping = '${redistricting_id}') DM ON
            PR.state = DM.state AND PR.county = DM.county AND PR.precinct = DM.precinct)
            WHERE ${selection_params}
            GROUP BY state, county, precinct, district
            ORDER BY state, county, precinct ASC
          `,
          (err, data) => {
            if (err || data.length === 0) {
              console.log(err);
              election_data = {}; 
            } else {
              election_data = data;
              output = {} 
              output['election_data'] = election_data 
          
              output['election_summary'] = election_results
              res.json(output)
            }
          }) 
  
  
          }
        })
      }
    }

  }
}

// Route 2: GET /comparison/:redistricting_1/:redistricting_2
// Route 2: GET /comparison/:redistricting_1/:redistricting_2
const comparison = async function(req, res) {
var dis1 = req.query.redistricting_1;
var dis2 = req.query.redistricting_2;
var state = req.query.state;
connection.query(`SELECT mapA.year AS year, mapA.state AS state, mapA.district AS district, mapA.party AS party, mapA.votesA AS votesA, mapB.votesB AS votesB
FROM (
    SELECT m.district, m.state, p.party, SUM(p.votes) AS votesA, p.year
    FROM MAP_ELEMENT m JOIN PRECINCT_RESULT p ON m.precinct = p.precinct AND m.state = p.state AND m.county=p.county
    AND p.election_type = 'house' WHERE m.district_mapping = '${dis1}' AND m.state = '${state}'
    GROUP BY  m.state, m.district, p.year, p.party
    ) mapA
INNER JOIN (
    SELECT m.district, m.state, p.party, SUM(p.votes) AS votesB, p.year
    FROM MAP_ELEMENT m JOIN PRECINCT_RESULT p ON m.precinct = p.precinct AND m.state = p.state AND m.county=p.county
    AND p.election_type = 'house' WHERE m.district_mapping = '${dis2}' AND m.state = '${state}'
    GROUP BY m.state,  m.district, p.year, p.party
    ) mapB
ON mapA.state=mapB.state AND mapA.district = mapB.district AND mapA.year = mapB.year AND mapA.party = mapB.party;`,
(err, data) => {
  if (err || data.length === 0) {
    console.log(err);
    res.json({});
  } else  {
    console.log('comp1 success')
    res.json(data);
  }});
}

const comparisonA = async function(req, res) {
  var d1 = req.query.redistricting_1;
  var d2 = req.query.redistricting_2;
  var sta = req.query.state;
    connection.query(`
  SELECT mapA.year AS year, mapA.state AS state, mapA.district AS district, mapA.party AS party, ABS(mapA.votesA-mapB.votesB) as diffVotes
FROM (
    SELECT m.district, m.state, p.party, SUM(p.votes) AS votesA, p.year
    FROM MAP_ELEMENT m JOIN PRECINCT_RESULT p ON m.precinct = p.precinct AND m.state = p.state AND m.county=p.county
    AND p.election_type = 'house' WHERE m.district_mapping = '${d1}' AND m.state = '${sta}'
    GROUP BY  m.state, m.district, p.year, p.party
    ) mapA
INNER JOIN (
    SELECT m.district, m.state, p.party, SUM(p.votes) AS votesB, p.year
    FROM MAP_ELEMENT m JOIN PRECINCT_RESULT p ON m.precinct = p.precinct AND m.state = p.state AND m.county=p.county
    AND p.election_type = 'house' WHERE m.district_mapping = '${d2}' AND m.state = '${sta}'
    GROUP BY m.state,  m.district, p.year, p.party
    ) mapB
ON mapA.state=mapB.state AND mapA.district = mapB.district AND mapA.year = mapB.year AND mapA.party = mapB.party
    ORDER BY diffVotes DESC
    LIMIT 5;`, 
    (err, data) => {
      if (err || data.length === 0) {
        console.log(err);
        res.json({});
      } else  {
        console.log('comp2 success')
        res.json(data);
      }});
  }


  // GET /analytics7/
const analytics7 = async function(req, res) {
  console.log('analytics7 initiated')
  if (req.query.year != 2016) {
    console.log('analytics7 query case')
    // Which precincts voted for different parties in different elections in year X?
    connection.query(`
      SELECT DISTINCT p.precinct, p.county, p.state
      FROM PRECINCT_RESULT p JOIN PRECINCT_RESULT q ON (p.precinct = q.precinct)
      WHERE p.election_type <> q.election_type AND p.party <> q.party AND p.year = ${req.query.year} AND q.year = ${req.query.year} AND p.votes >= (SELECT MAX(r.votes)
        FROM PRECINCT_RESULT r
        WHERE r.year = p.year AND r.precinct = p.precinct AND r.election_type = p.election_type) AND q.votes >= (SELECT MAX(s.votes)
          FROM PRECINCT_RESULT s
          WHERE s.year = q.year AND s.precinct = q.precinct AND s.election_type = q.election_type)`,
      (err, data) => {
      if (err || data.length === 0) {
        if(data) {
          console.log('data7 length:')
          console.log(data.length)
        }
        console.log(err);
        res.json({});
      } else {
        console.log('data7 success')
        res.json(data);
      }
    });
  } else {
    console.log('analytics7 default case')
    connection.query(`
      SELECT *
      FROM def7`,
      (err, data) => {
      if (err || data.length === 0) {
        if(data) {
          console.log('data7 length:')
          console.log(data.length)
        }
        console.log(err);
        res.json({});
      } else {
        console.log('data7 success')
        res.json(data);
      }
    });
  }
}

// GET /analytics11/
const analytics11 = async function(req, res) {
  console.log('analytics11 initiated')
  // Which precincts voted for different parties in different elections in year X?
  if (req.query.year1 != 2016) {
    connection.query(`
      WITH H_VOTE_TOTAL AS (
        SELECT p.precinct, p.county, p.state, p.votes, p.party, p.election_type, p.votes / SUM(p.votes) AS v_rate
        FROM PRECINCT_RESULT p
        WHERE p.year = ${req.query.year1} AND p.election_type = 'house'
        GROUP BY p.precinct
      ), P_VOTE_TOTAL AS (
        SELECT p.precinct, p.county, p.state, p.votes, p.party, p.election_type, p.votes / SUM(p.votes) AS v_rate
        FROM PRECINCT_RESULT p
        WHERE p.year = ${req.query.year1} AND p.election_type = 'presidential'
        GROUP BY p.precinct
      )
      SELECT DISTINCT pv.precinct, pv.county, pv.state, ABS(pv.v_rate - qv.v_rate)  as diff
      FROM H_VOTE_TOTAL pv JOIN P_VOTE_TOTAL qv ON (pv.precinct = qv.precinct AND pv.county = qv.county AND pv.state = qv.state AND pv.party = qv.party AND pv.election_type <> qv.election_type)
      ORDER BY diff DESC
      LIMIT 25;`,
      (err, data) => {
      if (err || data.length === 0) {
        if(data) {
          console.log('data11 length:')
          console.log(data.length)
        }
        console.log(err);
        res.json({});
      } else {
        console.log('data11 success')
        res.json(data);
      }
    });
  } else {
    console.log('analytics11 default case')
    connection.query(`
      SELECT *
      FROM def11`,
      (err, data) => {
      if (err || data.length === 0) {
        if(data) {
          console.log('data11 length:')
          console.log(data.length)
        }
        console.log(err);
        res.json({});
      } else {
        console.log('data11 success')
        res.json(data);
      }
    });
  }
}

// GET /analytics13/
const analytics13 = async function(req, res) {
  console.log('analytics13 initiated')
  if (req.query.year1 != 2016 || req.query.year2 != 2018) {
    // Which precincts exhibited the largest difference in votes between years X and Y of any election type??
    connection.query(`
      SELECT DISTINCT p.precinct, p.county, p.state, p.party, p.election_type AS type, ABS(p.votes - q.votes) / v.vote_total AS diff
      FROM PRECINCT_RESULT p JOIN PRECINCT_RESULT q ON (p.precinct = q.precinct AND p.county = q.county AND p.state = q.state)
        JOIN VOTE_TOTAL v ON (p.precinct = v.precinct AND p.county = v.county AND p.state = v.state)
      WHERE p.election_type = q.election_type AND p.party = q.party AND p.year = ${req.query.year1} AND q.year = ${req.query.year2}
      ORDER BY diff DESC
      LIMIT 25;`,
      (err, data) => {
      if (err || data.length === 0) {
        if(data) {
          console.log('data13 length:')
          console.log(data.length)
        }
        console.log(err);
        res.json({});
      } else {
        console.log('data13 success')
        res.json(data);
      }
    });
  } else {
    console.log('analytics13 default case')
    connection.query(`
      SELECT *
      FROM def13`,
      (err, data) => {
      if (err || data.length === 0) {
        if(data) {
          console.log('data13 length:')
          console.log(data.length)
        }
        console.log(err);
        res.json({});
      } else {
        console.log('data13 success')
        res.json(data);
      }
    });
  }
}

// Route 4: GET /create
const summary = async function(req, res) {
  const state = req.query.state;
  const districting = req.query.districting;
  console.log('summary query begin');
  if (!state) {
    console.log('no state');
    connection.query(`
      SELECT *
      FROM AVERAGE_VOTES;
    `,
    (err, data) => {
      console.log("intermediate query completed")
      if (err || data.length === 0) {
        console.log(err);
        res.json({});
      } else {
        res.json(data);
      }
    });
    console.log('no state query done');
  } else if (districting == 'Default') {
    connection.query(`
      SELECT *
      FROM AVERAGE_VOTES
      WHERE state = ${state}
    `,
    (err, data) => {
      if (err || data.length === 0) {
        console.log(err);
        res.json({});
      } else {
        res.json(data);
      }
    });
  } else {
    connection.query(`
    WITH AVG_VOTES AS (
        SELECT p.precinct, p.county, AVG(p.votes) AS avg_votes, p.party
        FROM PRECINCT_RESULT p
        WHERE state = ${state}
        GROUP BY p.precinct, p.county, p.party
      )
    SELECT m.precinct, m.county, m.district,
        a.rep_vote,
        a.dem_vote,
        a.lib_vote,
        a.gre_vote,
        a.con_vote,
        a.ind_vote
    FROM (SELECT precinct, county, district, district_mapping FROM MAP_ELEMENT WHERE state = ${state}) m JOIN (SELECT precinct, county,
        SUM(CASE party WHEN 'Republican' THEN avg_votes END) AS rep_vote,
        SUM(CASE party WHEN 'Democratic' THEN avg_votes END) AS dem_vote,
        SUM(CASE party WHEN 'Libertarian' THEN avg_votes END) AS lib_vote,
        SUM(CASE party WHEN 'Green' THEN avg_votes END) AS gre_vote,
        SUM(CASE party WHEN 'Constitution' THEN avg_votes END) AS con_vote,
        SUM(CASE party WHEN 'Independent' THEN avg_votes END) AS ind_vote FROM AVG_VOTES GROUP BY precinct, county) a ON (m.precinct = a.precinct AND m.county = a.county)
    WHERE m.district_mapping=${districting}
    GROUP BY m.precinct, m.county, m.district;
    `,
    (err, data) => {
      if (err || data.length === 0) {
        console.log(err);
        res.json({});
      } else {
        res.json(data);
      }
    });
  }
}

// Route 5: add new redistricting
const add = async function(req, res) {
  var new_redistricting_name = req.body.name;
  var new_redistricting_creator = req.body.creator;
  var new_redistricting = req.body.elements;
  connection.query(`
    INSERT INTO DISTRICT_MAPPING(name, creator)
    VALUES('${new_redistricting_name}', ${new_redistricting_creator})
  `, function(err, result) {
    if (err) {
      console.log(err);
      res.status(400).send("Redistricting failed to be added");
      return;
    }
  });
  for (i = 0; i < new_redistricting.length; i++) {
    connection.query(`
      INSERT INTO MAP_ELEMENT(precinct, state, county, district, district_mapping)
      VALUES(${new_redistricting[i][0]}, ${new_redistricting[i][1]}, ${new_redistricting[i][2]}, ${new_redistricting[i][3]}, ${new_redistricting_name})
    `, function(err, result) {
      if (err) {
        console.log(err);
        res.status(400).send("Map element adding failed");
      }
    })
  }
}

//Route 6: Gets the number of districts in a state
const get_districts = async function(req, res) {
  var state = req.query.state;
  connection.query(`
    SELECT num_districts
    FROM STATE
    WHERE state = '${state}'
  `, (err, data) => {
    if (err || data.length === 0) {
      console.log(err);
      res.json({});
    } else {
      console.log(data);
      res.json(data);
    }
  }
  )
}

//Route 7: Gets the list of states
const get_states = async function(req, res) {
  connection.query(`
    SELECT state
    FROM STATE
  `, (err, data) => {
    if (err || data.length === 0) {
      console.log(err);
      res.json({});
    } else {
      console.log(data);
      res.json(data);
    }
  }
  )
}

//Route 8: Gets districting names
const get_districtings = async function(req, res) {
  connection.query(`
    SELECT name
    FROM DISTRICT_MAPPING
  `, (err, data) => {
    if (err || data.length === 0) {
      console.log(err);
      res.json({});
    } else {
      console.log(data);
      res.json(data);
    }
  }
  )
}

/*

// Route 1: GET /author/:type
const author = async function(req, res) {
  // TODO (TASK 1): replace the values of name and pennKey with your own
  const name = 'Daniel Sun';
  const pennKey = 'dansun7';

  // checks the value of type the request parameters
  // note that parameters are required and are specified in server.js in the endpoint by a colon (e.g. /author/:type)
  if (req.params.type === 'name') {
    // res.send returns data back to the requester via an HTTP response
    res.send(`Created by ${name}`);
  } else if (req.params.type === 'pennkey') {
    res.send(`Created by ${pennKey}`);
  } else {
    // we can also send back an HTTP status code to indicate an improper request
    res.status(400).send(`'${req.params.type}' is not a valid author type. Valid types are 'name' and 'pennkey'.`);
  }
}

// Route 2: GET /random
const random = async function(req, res) {
  // you can use a ternary operator to check the value of request query values
  // which can be particularly useful for setting the default value of queries
  // note if users do not provide a value for the query it will be undefined, which is falsey
  const explicit = req.query.explicit === 'true' ? 1 : 0;

  // Here is a complete example of how to query the database in JavaScript.
  // Only a small change (unrelated to querying) is required for TASK 3 in this route.
  connection.query(`
    SELECT *
    FROM Songs
    WHERE explicit <= ${explicit}
    ORDER BY RAND()
    LIMIT 1
  `, (err, data) => {
    if (err || data.length === 0) {
      // if there is an error for some reason, or if the query is empty (this should not be possible)
      // print the error message and return an empty object instead
      console.log(err);
      res.json({});
    } else {
      // Here, we return results of the query as an object, keeping only relevant data
      // being song_id and title which you will add. In this case, there is only one song
      // so we just directly access the first element of the query results array (data)
      // TODO (TASK 3): also return the song title in the response
      res.json({
        song_id: data[0].song_id,
        title: data[0].title,
      });
    }
  });
}

// Route 3: GET /song/:song_id
const song = async function(req, res) {
  // TODO (TASK 4): implement a route that given a song_id, returns all information about the song
  // Most of the code is already written for you, you just need to fill in the query
  connection.query(`
    SELECT *
    FROM Songs
    WHERE song_id = '${req.params.song_id}'`,
    (err, data) => {
    if (err || data.length === 0) {
      console.log(err);
      res.json({});
    } else {
      res.json(data[0]);
    }
  });
}

// Route 4: GET /album/:album_id
const album = async function(req, res) {
  // TODO (TASK 5): implement a route that given a album_id, returns all information about the album
  connection.query(`
    SELECT *
    FROM Albums
    WHERE album_id = '${req.params.album_id}'`,
    (err, data) => {
    if (err || data.length === 0) {
      console.log(err);
      res.json({});
    } else {
      res.json(data[0]);
    }
  });
}

// Route 5: GET /albums
const albums = async function(req, res) {
  // TODO (TASK 6): implement a route that returns all albums ordered by release date (descending)
  // Note that in this case you will need to return multiple albums, so you will need to return an array of objects
  connection.query(`
    SELECT *
    FROM Albums
    ORDER BY release_date DESC`,
    (err, data) => {
      if (err || data.length === 0) {
        console.log(err);
        res.json({});
      } else {
        res.json(data);
      }
    })
}

// Route 6: GET /album_songs/:album_id
const album_songs = async function(req, res) {
  // TODO (TASK 7): implement a route that given an album_id, returns all songs on that album ordered by track number (ascending)
  connection.query(`
    SELECT song_id, title, number, duration, plays
    FROM Songs
    WHERE album_id = '${req.params.album_id}'
    ORDER BY number`,
    (err, data) => {
      if (err || data.length === 0) {
        console.log(err);
        res.json({});
      } else {
        res.json(data);
      }
    });
}

// Route 7: GET /top_songs
const top_songs = async function(req, res) {
  const page = req.query.page;
  // TODO (TASK 8): use the ternary (or nullish) operator to set the pageSize based on the query or default to 10
  const pageSize = req.query.page_size ?? 10;

  if (!page) {
    // TODO (TASK 9)): query the database and return all songs ordered by number of plays (descending)
    // Hint: you will need to use a JOIN to get the album title as well
    connection.query(`
    SELECT s.song_id, s.title, a.album_id, a.title AS album, s.plays
    FROM Songs s JOIN Albums a ON s.album_id = a.album_id
    ORDER BY plays DESC`,
    (err, data) => {
      if (err || data.length === 0) {
        console.log(err);
        res.json({});
      } else {
        res.json(data);
      }
    });
  } else {
    // TODO (TASK 10): reimplement TASK 9 with pagination
    // Hint: use LIMIT and OFFSET (see https://www.w3schools.com/php/php_mysql_select_limit.asp)
    connection.query(`
    SELECT s.song_id, s.title, a.album_id, a.title AS album, s.plays
    FROM Songs s JOIN Albums a ON s.album_id = a.album_id
    ORDER BY plays DESC
    LIMIT ${pageSize}
    OFFSET ${(page - 1) * pageSize}`,
    (err, data) => {
      if (err || data.length === 0) {
        console.log(err);
        res.json({});
      } else {
        res.json(data);
      }
    });
  }
}

// Route 8: GET /top_albums
const top_albums = async function(req, res) {
  // TODO (TASK 11): return the top albums ordered by aggregate number of plays of all songs on the album (descending), with optional pagination (as in route 7)
  // Hint: you will need to use a JOIN and aggregation to get the total plays of songs in an album
  const page = req.query.page;
  // TODO (TASK 8): use the ternary (or nullish) operator to set the pageSize based on the query or default to 10
  const pageSize = req.query.page_size ?? 10;

  if (!page) {
    // TODO (TASK 9)): query the database and return all songs ordered by number of plays (descending)
    // Hint: you will need to use a JOIN to get the album title as well
    connection.query(`
    SELECT a.album_id, a.title, SUM(s.plays) as plays
    FROM Songs s JOIN Albums a ON s.album_id = a.album_id
    GROUP BY a.album_id, a.title
    ORDER BY plays DESC`,
    (err, data) => {
      if (err || data.length === 0) {
        console.log(err);
        res.json({});
      } else {
        res.json(data);
      }
    });
  } else {
    // TODO (TASK 10): reimplement TASK 9 with pagination
    // Hint: use LIMIT and OFFSET (see https://www.w3schools.com/php/php_mysql_select_limit.asp)
    connection.query(`
    SELECT a.album_id, a.title, SUM(s.plays) as plays
    FROM Songs s JOIN Albums a ON s.album_id = a.album_id
    GROUP BY a.album_id, a.title
    ORDER BY plays DESC
    LIMIT ${pageSize}
    OFFSET ${(page - 1) * pageSize}`,
    (err, data) => {
      if (err || data.length === 0) {
        console.log(err);
        res.json({});
      } else {
        res.json(data);
      }
    });
  }
}

// Route 9: GET /search_albums
const search_songs = async function(req, res) {
  // TODO (TASK 12): return all songs that match the given search query with parameters defaulted to those specified in API spec ordered by title (ascending)
  // Some default parameters have been provided for you, but you will need to fill in the rest
  const title = req.query.title ?? '';
  const explicit = req.query.explicit ? 1 : 0;
  const durationLow = req.query.duration_low ?? 60;
  const durationHigh = req.query.duration_high ?? 660;
  const playsLow = req.query.plays_low ?? 0;
  const playsHigh = req.query.plays_high ?? 1100000000;
  const danceabilityLow = req.query.danceability_low ?? 0;
  const danceabilityHigh = req.query.danceability_high ?? 1;
  const energyLow = req.query.energy_low ?? 0;
  const energyHigh = req.query.energy_high ?? 1;
  const valenceLow = req.query.valence_low ?? 0;
  const valenceHigh = req.query.valence_high ?? 1;

  connection.query(`
    SELECT *
    FROM Songs
    WHERE (title LIKE '%${title}%') AND
      (explicit <= ${explicit}) AND
      (duration >= ${durationLow}) AND
      (duration <= ${durationHigh}) AND
      (plays >= ${playsLow}) AND
      (plays <= ${playsHigh}) AND
      (danceability >= ${danceabilityLow}) AND
      (danceability <= ${danceabilityHigh}) AND
      (energy >= ${energyLow}) AND
      (energy <= ${energyHigh}) AND
      (valence >= ${valenceLow}) AND
      (valence <= ${valenceHigh})
    ORDER BY title`,
    (err, data) => {
      if (err || data.length === 0) {
        console.log(err);
        res.json({});
      } else {
        res.json(data);
      }
    });
}
*/

module.exports = {
  home,
  comparison,
  comparisonA,
  analytics7,
  analytics11,
  analytics13,
  summary,
  add,
  get_districts,
  get_states,
  get_districtings
  /*
  author,
  random,
  song,
  album,
  albums,
  album_songs,
  top_songs,
  */
}
