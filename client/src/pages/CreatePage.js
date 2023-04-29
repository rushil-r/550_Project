import { useState, useEffect } from 'react';
import { Button, Checkbox, Container, FormControlLabel, Grid, Link, Slider, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const config = require('../config.json');

export default function CreatePage() {

  const [state, setState] = useState('');
  const [data, setData] = useState([]);

  useEffect(() => {
    console.log("fetch initiated");
    fetch(`http://${config.server_host}:${config.server_port}/create?state=${state}`)
      .then(res => res.json())
      .then(resJson => {
        const votes = resJson.map((outcome) => ({ outcome }));
        setData(votes);
      });
    console.log(data);
    console.log("fetch completed");
  }, []);

  const columns = [
    { field: 'precinct', headerName: 'Precinct'},
    { field: 'county', headerName: 'County' },
    { field: 'state', headerName: 'State' },
    { field: 'district', headerName: 'Original District' },
    { field: 'rep_vote', headerName: 'Republican Votes' },
    { field: 'dem_vote', headerName: 'Democratic Votes' },
    { field: 'lib_vote', headerName: 'Libertarian Votes' },
    { field: 'gre_vote', headerName: 'Green Votes' },
    { field: 'con_vote', headerName: 'Constitution Votes' },
    { field: 'ind_vote', headerName: 'Independent Votes' },
  ];

  return (
    <Container>
      <h2>Set the districts here:</h2>
      <DataGrid
        rows={data}
        columns={columns}
        autoHeight
      />
    </Container>
  )

  

}