import { useState, useEffect } from 'react';
import { Button, Checkbox, Container, FormControlLabel, Grid, Link, Slider, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Dropdown } from 'react-dropdown-now';
import './CreatePage.css';

const config = require('../config.json');

export default function CreatePage() {

  const [state, setState] = useState('PENNSYLVANIA');
  const [districting, setDistricting] = useState('Default');
  const [data, setData] = useState([]);
  const [states, setStates] = useState([]);
  const [districtings, setDistrictings] = useState([]);

  useEffect(() => {
    console.log("fetch initiated");
    fetch(`http://${config.server_host}:${config.server_port}/summary?state=${state}&districting=${districting}`)
      .then(res => {return res.json()})
      .then(resJson => {
        const votes = resJson.map((outcome) => ({id: outcome.precinct + outcome.county + outcome.state, ... outcome }));
        setData(votes);
      })
      .catch(err => console.log(err));
    console.log(data);
    console.log("fetch completed");
  }, [state, districting]);
  useEffect(() => {
    fetch(`http://${config.server_host}:${config.server_port}/get_states`)
      .then(res => {return res.json()})
      .then(resJson => {
        const states = resJson.map((outcome) => (outcome.state));
        setStates(states);
      })
      .catch(err => console.log(err));

    fetch(`http://${config.server_host}:${config.server_port}/get_districtings`)
    .then(res => {return res.json()})
    .then(resJson => {
      const districtings = resJson.map((outcome) => (outcome.name));
      setDistrictings(districtings);
    })
    .catch(err => console.log(err));
  }, []);

  const columns = state ? [
    { field: 'precinct', headerName: 'Precinct', width: 80 },
    { field: 'county', headerName: 'County', width: 80 },
    { field: 'district', headerName: 'District', width: 80 },
    { field: 'rep_vote', headerName: 'Republican Votes', width: 130 },
    { field: 'dem_vote', headerName: 'Democratic Votes', width: 130 },
    { field: 'lib_vote', headerName: 'Libertarian Votes', width: 130 },
    { field: 'gre_vote', headerName: 'Green Votes', width: 130 },
    { field: 'con_vote', headerName: 'Constitution Votes', width: 130 },
    { field: 'ind_vote', headerName: 'Independent Votes', width: 130 },
  ] : [
    { field: 'precinct', headerName: 'Precinct'},
    { field: 'county', headerName: 'County' },
    { field: 'state', headerName: 'State' },
    { field: 'district', headerName: 'District' },
    { field: 'rep_vote', headerName: 'Republican Votes' },
    { field: 'dem_vote', headerName: 'Democratic Votes' },
    { field: 'lib_vote', headerName: 'Libertarian Votes' },
    { field: 'gre_vote', headerName: 'Green Votes' },
    { field: 'con_vote', headerName: 'Constitution Votes' },
    { field: 'ind_vote', headerName: 'Independent Votes' },
  ];

  return (
    <Container >
      <Dropdown className = 'Dropdown' placeholder='Select a state' options = {states} onChange={(value) => { setState(value.value) }}/>
      <Dropdown className = 'Dropdown' placeholder='Select a districting' options = {districtings} onChange={(value) => { setDistricting(value.value) }}/>
      <h2>Summary:</h2>
      <DataGrid
        className="bg"
        rows={data}
        columns={columns}
        autoHeight
        sx={{width: "1050px"}}
      />
    </Container>
  )

  

}