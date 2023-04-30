import { useState, useEffect } from 'react';
import { Container } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const config = require('../config.json');

export default function ComparisonPage() {

  const [mapID1, setmapID1] = useState(['Default']);
  const [mapID2, setmapID2] = useState(['Test']);
  const [data15, setData15] = useState([]);
  const [data17, setData17] = useState([]);

  useEffect(() => {
    console.log(`${mapID1}`);
    console.log(`${mapID2}`);
    console.log("fetch initiated");
    fetch(`http://${config.server_host}:${config.server_port}/comparison?redistricting_1=${mapID1}&redistricting_2=${mapID2}`)
      .then(res => {return res.json()})
      .then(resJson => {
        console.log(resJson.length)
        setData15(resJson[0]);
        setData17(resJson[1]);
      })
      .catch(err => console.log(err));
      console.log(data15);
      console.log(data17);
    console.log("fetch completed");
  }, [mapID1, mapID2]);


  const columnsA = [
    { field: 'year', headerName: 'Year'},
    { field: 'state', headerName: 'State' },
    { field: 'district', headerName: 'District'},
    { field: 'party', headerName: 'Party' },
    { field: 'votesA', headerName: 'Votes: Redistricting A'},
    { field: 'votesB', headerName: 'Votes: Redistricting B'}
  ];

    const columnsB = [
    { field: 'year', headerName: 'Year'},
    { field: 'state', headerName: 'State' },
    { field: 'district', headerName: 'District'},
    { field: 'party', headerName: 'Party' },
    { field: 'diffVotes', headerName: 'Vote Differential Between Redistrictings'}
  ];


  return (
    <Container>
      <h2>Comparison</h2>
      <h3>District Vote Differentials (House) by Party & Election</h3>
      <DataGrid
        rows={data15}
        columns={columnsA}
        autoHeight
      />
      <h3>Who Switched the Most? Which Districts Had the Highest Vote Differentials Between the Redistrictings</h3>
      <DataGrid
        rows={data17}
        columns={columnsB}
        autoHeight
      />
    </Container>
  )

  

}