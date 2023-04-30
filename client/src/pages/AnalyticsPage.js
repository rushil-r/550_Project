import { useState, useEffect } from 'react';
import { Button, Checkbox, Container, FormControlLabel, Grid, Link, Slider, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const config = require('../config.json');

export default function AnalyticsPage() {

  const [state, setState] = useState('Pennsylvania');
  const [type, setType] = useState('Presidential');
  const [year, setYear] = useState('2018');
  const [data7, setData7] = useState([]);
  const [data11, setData2] = useState([]);
  const [data13, setData3] = useState([]);

  useEffect(() => {
    console.log("fetch initiated");
    fetch(`http://${config.server_host}:${config.server_port}/analytics?redistricting=${state}&type=${type}&year=${year}`)
      .then(res => {return res.json()})
      .then(resJson => setData7(resJson))
      .catch(err => console.log(err));
    console.log(data7);
    console.log("fetch completed");
  }, [state]);

  const columns7 = [
    { field: 'precinct', headerName: 'Precinct'},
    { field: 'diff', headerName: 'Difference'},
  ];

  return (
    <Container>
      <h2>Analytics</h2>
      <h3>Which precincts voted for different parties in different elections in year X?</h3>
      <DataGrid
        rows={data7}
        columns={columns7}
        autoHeight
      />
    </Container>
  )

  

}