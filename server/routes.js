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
var dis1 = req.query.redistricting_1;
var dis2 = req.query.redistricting_2;
var data15;
var data17;
connection.query(`
SELECT a.year AS year, a.state AS state, a.district AS district, a.party AS party, a.votesA AS votesA, b.votesB AS votesB
FROM (SELECT a.district, a.state, p.party, SUM(p.votes) AS votesA, p.year
        FROM MAP_ELEMENT a JOIN PRECINCT_RESULT p ON a.precinct = p.precinct AND a.state = p.state AND a.county=p.county
        AND p.election_type = 'house' WHERE a.district_mapping = '${dis1}'
        GROUP BY a.state, a.district, p.year, p.party
     ) a
JOIN (
SELECT a.district, a.state, p.party, SUM(p.votes) AS votesB, p.year
        FROM MAP_ELEMENT a JOIN PRECINCT_RESULT p ON a.precinct = p.precinct AND a.state = p.state AND a.county=p.county
        AND p.election_type = 'house' WHERE a.district_mapping = '${dis2}'
        GROUP BY a.state, a.district, p.year, p.party
    ) b
ON a.state=b.state AND a.district = b.district AND a.year = b.year AND a.party = b.party;`,
(err, data) => {
  if (err || data.length === 0) {
    console.log(err);
    res.json({});
  } else  {
    data15 = data;
    connection.query(`
  SELECT a.year AS year, a.state AS state, a.district AS district, a.party AS party, ABS(a.votesA-b.votesB) as diffVotes
  FROM (
  SELECT a.district, a.state, p.party, SUM(p.votes) AS votesA, p.year
          FROM MAP_ELEMENT a JOIN PRECINCT_RESULT p ON a.precinct = p.precinct AND a.state = p.state AND a.county=p.county
          AND p.election_type = 'house' WHERE a.district_mapping = '${dis1}'
          GROUP BY  a.state, a.district, p.year, p.party
       ) a
  JOIN (
  SELECT a.district, a.state, p.party, SUM(p.votes) AS votesB, p.year
            FROM MAP_ELEMENT a JOIN PRECINCT_RESULT p ON a.precinct = p.precinct AND a.state = p.state AND a.county=p.county
            AND p.election_type = 'house' WHERE a.district_mapping = '${dis2}'
            GROUP BY a.state,  a.district, p.year, p.party
        ) b
    ON a.state=b.state AND a.district = b.district AND a.year = b.year AND a.party = b.party
    ORDER BY diffVotes DESC
    LIMIT 5
    `, 
    (err, data) => {
      if (err || data.length === 0) {
        console.log(err);
        res.json({});
      } else  {
        data17 = data;
        return res.json({data15, data17});
      }
    });
  }}
);}
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
  index,
  comparison,
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
