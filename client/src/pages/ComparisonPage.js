import { useState, useEffect } from 'react';
import { Button, Checkbox, Container, FormControlLabel, Grid, Link, Slider, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const config = require('../config.json');

export default function ComparisonPage() {

  const [mapID1, setmapID1] = useState(['Default']);
  const [mapID2, setmapID2] = useState(['Test']);
  const [data15, setData15] = useState([]);
  const [data17, setData17] = useState([]);

  useEffect(() => {
    console.log("fetch initiated");
    fetch(`http://${config.server_host}:${config.server_port}/comparison?redistricting_1=${mapID1}&redistricting_2=${mapID2}`)
      .then(res => {return res.json()})
      .then(resJson => {
        const dist = resJson.map((outcome) => ({id: outcome.year + outcome.state + outcome.district, ... outcome }));
        setData15(dist)}
      )
      .catch(err => console.log(err));
    console.log("fetch completed");
  }, [mapID1, mapID2]);

  const columnsA = [
    { field: 'year', headerName: 'Year'},
    { field: 'state', headerName: 'State' },
    { field: 'district', headerName: 'District'},
    { field: 'party', headerName: 'Party' },
    { field: 'votesDistA', headerName: 'Votes: Redistricting A'},
    { field: 'votesDistB', headerName: 'Votes: Redistricting B'}
  ];

  return (
    <Container>
      <h2>Comparison</h2>
      <h3>ABCD TEST?</h3>
      <DataGrid
        rows={data15}
        columns={columnsA}
        autoHeight
      />
    </Container>
  )

  

}
