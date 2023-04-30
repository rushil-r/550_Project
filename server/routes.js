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
const index = async function(req, res) {

}

// Route 2: GET /comparison/:redistricting_1/:redistricting_2
const comparison = async function(req, res) {
  //For two distinct user-generated redistricting plans, this route displays how the number of 
  //seats for all political parties would change across House elections in each year such an election 
  //takes place. Below that, another query is used to generate the top 5 districts (and their precincts)
  //which had the biggest changes in number of seats retained by each party between the two redistricting 
  //plans. If the two redistrictings are identical, an error is thrown and the user is asked to ensure they
  //are comparing two distinct redistrictings. If less than two or more than two redistricting IDs are provided, an error is thrown and the user is asked to ensure they are comparing two redistrictings.
  if (req.params.redistricting_1 === req.params.redistricting_2) {
    res.json({error: "Please ensure you are comparing two distinct redistrictings."});
  } else if (req.params.redistricting_1 === undefined || req.params.redistricting_2 === undefined) {
    res.json({error: "Please ensure you are comparing two redistrictings."});
  } else {
    connection.query(`
    WITH DR AS
(WITH PD AS
  (WITH Precinct_Mapping AS
    (SELECT d.precinct, d.state, d.district, d.county, d.district_mapping, p.year, p.election_type, p.votes, p.party FROM MAP_ELEMENT d JOIN PRECINCT_RESULT p ON p.precinct = d.precinct WHERE p.election_type = 'house')
  SELECT *
  FROM Precinct_Mapping PM JOIN DISTRICT_MAPPING DM ON PM.district_mapping=DM.name
  #WHERE DM.name = '${req.params.redistricting_1}'
  )
SELECT state, district, precinct, party, SUM(votes) AS numVotes
FROM PD
GROUP BY state, district, precinct, party),
DR2 AS
(WITH PD AS
  (WITH Precinct_Mapping AS
      (SELECT d.precinct, d.state, d.district, d.county, d.district_mapping, p.year, p.election_type, p.votes, p.party FROM MAP_ELEMENT d JOIN PRECINCT_RESULT p ON p.precinct = d.precinct WHERE p.election_type = 'house')
  SELECT *
  FROM Precinct_Mapping PM JOIN DISTRICT_MAPPING DM ON PM.district_mapping=DM.name
  WHERE DM.name = '${req.params.redistricting_2}'
  )
SELECT state, district, precinct, party, SUM(votes) AS numVotes
FROM PD
GROUP BY state, district, precinct, party)
SELECT DR.state, DR.precinct, DR.party, DR.numVotes, DR2.party, DR2.numVotes
FROM DR JOIN DR2 ON DR.precinct = DR2.precinct`),
    (err, data) => {
      if (err || data.length === 0) {
        console.log(err);
        res.json({});
      } else  {
        res.json(data);
        connection.query(`
    WITH DR AS
(WITH PD AS
  (WITH Precinct_Mapping AS
    (SELECT d.precinct, d.state, d.district, d.county, d.district_mapping, p.year, p.election_type, p.votes, p.party FROM MAP_ELEMENT d JOIN PRECINCT_RESULT p ON p.precinct = d.precinct WHERE p.election_type = 'house')
  SELECT *
  FROM Precinct_Mapping PM JOIN DISTRICT_MAPPING DM ON PM.district_mapping=DM.name
  #WHERE DM.name = '${req.params.redistricting_1}'
  )
SELECT state, district, party, SUM(votes) AS numVotes
FROM PD
GROUP BY state, district, party),
DR2 AS
(WITH PD AS
  (WITH Precinct_Mapping AS
      (SELECT d.precinct, d.state, d.district, d.county, d.district_mapping, p.year, p.election_type, p.votes, p.party FROM MAP_ELEMENT d JOIN PRECINCT_RESULT p ON p.precinct = d.precinct WHERE p.election_type = 'house')
  SELECT *
  FROM Precinct_Mapping PM JOIN DISTRICT_MAPPING DM ON PM.district_mapping=DM.name
  WHERE DM.name = '${req.params.redistricting_2}'
  )
SELECT state, district, party, SUM(votes) AS numVotes
FROM PD
GROUP BY state, district, party)
          SELECT DR.state, DR.district, DR.party ABS(DR.numVotes-DR2.numVotes) AS diffVotes
          FROM DR JOIN DR2 ON DR.district
          WHERE DR.district = DR2.district 
          ORDER BY diffVotes DESC
          LIMIT 5
        `), 
        (err, data) => {
          if (err || data.length === 0) {
            console.log(err);
            res.json({});
          } else  {
            res.json(data);
          }
        }
      }
    }
  }
}

// Route 4: GET /analytics/
const analytics = async function(req, res) {
  // Which precincts voted for different parties in different elections in year X?
  connection.query(`
    SELECT DISTINCT p.precinct, p.county, p.state
    FROM PRECINCT_RESULT p JOIN PRECINCT_RESULT q ON (p.precinct = q.precinct, p.precinct = q.precinct)
    WHERE p.election_type <> q.election_type AND p.party <> q.party AND p.year = '${req.params.year}' AND q.year = '${req.params.year}'  AND p.votes >= (SELECT MAX(r.votes)
      FROM PRECINCT_RESULT r
      WHERE r.year = p.year AND r.precinct = p.precinct AND r.election_type = p.election_type) AND q.votes >= (SELECT MAX(s.votes)
        FROM PRECINCT_RESULT s
        WHERE s.year = q.year AND s.precinct = q.precinct AND s.election_type = q.election_type)`,
    (err, data) => {
    if (err || data.length === 0) {
      console.log(err);
      res.json({});
    } else {
      data7 = data;
      // which precincts exhibited the largest difference in votes between elections of a given year
      connection.query(`
        WITH VOTE_TOTAL AS (
          SELECT precinct, county, state, SUM(votes) AS vote_total
          FROM PRECINCT_RESULT
          GROUP BY precinct
        )
        SELECT DISTINCT p.precinct, p.county, p.state, p.party, p.election_type AS type, ABS(p.votes - q.votes) / v.vote_total AS diff
        FROM PRECINCT_RESULT p JOIN PRECINCT_RESULT q ON (p.precinct = q.precinct AND p.county = q.county AND p.state = q.state)
          JOIN VOTE_TOTAL v ON (p.precinct = v.precinct AND p.county = v.county AND p.state = v.state)
        WHERE p.election_type <> q.election_type AND p.party = q.party AND p.year = '${req.params.year}' AND q.year = '${req.params.year}'
        ORDER BY diff DESC
        LIMIT 25`,
        (err, data) => {
        if (err || data.length === 0) {
          console.log(err);
          res.json({});
        } else {
          data11 = data;
          // which precincts exhibited the largest difference in votes between years of any election type
          connection.query(`
          WITH VOTE_TOTAL AS (
            SELECT precinct, county, state, SUM(votes) AS vote_total
            FROM PRECINCT_RESULT
            GROUP BY precinct
          )
          SELECT DISTINCT p.precinct, p.county, p.state, p.party, p.election_type AS type, ABS(p.votes - q.votes) / v.vote_total AS diff
          FROM PRECINCT_RESULT p JOIN PRECINCT_RESULT q ON (p.precinct = q.precinct AND p.county = q.county AND p.state = q.state)
            JOIN VOTE_TOTAL v ON (p.precinct = v.precinct AND p.county = v.county AND p.state = v.state)
          WHERE p.election_type = q.election_type AND p.party = q.party AND p.year = 2018 AND q.year = 2020
          ORDER BY diff DESC
          LIMIT 25;`,
            (err, data) => {
            if (err || data.length === 0) {
              console.log(err);
              res.json({});
            } else {
              data13 = data;
              res.json( {"data7": data7, "data11": data11, "data13": data13} );
            }
          });
        }
      });
    }
  });
}

// Route 4: GET /create
const create = async function(req, res) {
  console.log("create initiated");
  const state = req.query.state;
  if (!state) {
    connection.query(`
      WITH AVG_VOTES AS (
          SELECT p.precinct, p.county, p.state, AVG(p.votes) AS avg_votes, p.party
          FROM PRECINCT_RESULT p
          GROUP BY p.precinct, p.county, p.state, p.party
        )
      SELECT m.precinct, m.county, m.state, m.district,
          a.rep_vote,
          a.dem_vote,
          a.lib_vote,
          a.gre_vote,
          a.con_vote,
          a.ind_vote,
          m.district AS new_dist
      FROM MAP_ELEMENT m JOIN (SELECT precinct, county, state,
          SUM(CASE party WHEN 'Republican' THEN avg_votes END) AS rep_vote,
          SUM(CASE party WHEN 'Democratic' THEN avg_votes END) AS dem_vote,
          SUM(CASE party WHEN 'Libertarian' THEN avg_votes END) AS lib_vote,
          SUM(CASE party WHEN 'Green' THEN avg_votes END) AS gre_vote,
          SUM(CASE party WHEN 'Constitution' THEN avg_votes END) AS con_vote,
          SUM(CASE party WHEN 'Independent' THEN avg_votes END) AS ind_vote FROM AVG_VOTES GROUP BY precinct, county, state) a ON (m.precinct = a.precinct AND m.state = a.state AND m.county = a.county)
      WHERE m.district_mapping='Default'
      GROUP BY m.precinct, m.county, m.state, m.district;
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
        WHERE state = '${state}'
        GROUP BY p.precinct, p.county, p.party
      )
    SELECT m.precinct, m.county, m.district,
        a.rep_vote,
        a.dem_vote,
        a.lib_vote,
        a.gre_vote,
        a.con_vote,
        a.ind_vote,
        m.district AS new_dist
    FROM (SELECT precinct, county, district, district_mapping FROM MAP_ELEMENT WHERE state = '${state}') m JOIN (SELECT precinct, county,
        SUM(CASE party WHEN 'Republican' THEN avg_votes END) AS rep_vote,
        SUM(CASE party WHEN 'Democratic' THEN avg_votes END) AS dem_vote,
        SUM(CASE party WHEN 'Libertarian' THEN avg_votes END) AS lib_vote,
        SUM(CASE party WHEN 'Green' THEN avg_votes END) AS gre_vote,
        SUM(CASE party WHEN 'Constitution' THEN avg_votes END) AS con_vote,
        SUM(CASE party WHEN 'Independent' THEN avg_votes END) AS ind_vote FROM AVG_VOTES GROUP BY precinct, county) a ON (m.precinct = a.precinct AND m.county = a.county)
    WHERE m.district_mapping='Default'
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
  index,
  comparison,
  analytics,
  create,
  add,
  get_districts,
  get_states
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
