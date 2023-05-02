import { useState, useEffect } from 'react';
import { Container } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Dropdown } from 'react-dropdown-now';
import './ComparisonPage.css';

const config = require('../config.json');

export default function ComparisonPage() {
  const [pageSize, setPageSize] = useState(15);
  const [state, setState] = useState('Michigan');
  const [redistricting_1, setmapredistricting_1] = useState('Default');
  const [redistricting_2, setmapredistricting_2] = useState('Test');
  const [data15, setData15] = useState([]);
  const [data17, setData17] = useState([]);
  const [districtings, setDistrictings] = useState([]);
  const [states, setStates] = useState([]);

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
  
  useEffect(() => {
    fetch(`http://${config.server_host}:${config.server_port}/comparison?redistricting_1=${redistricting_1}&redistricting_2=${redistricting_2}&state=${state}`)
      .then(res => {return res.json()})
      .then(resJson => {
        const comp = resJson.map((outcome) => ({id: outcome.year + outcome.state + outcome.district + outcome.party, ...outcome }));
        setData15(comp);
      })
      .catch(err => console.log(err));  

    fetch(`http://${config.server_host}:${config.server_port}/comparisonA?redistricting_1=${redistricting_1}&redistricting_2=${redistricting_2}&state=${state}`)
    .then(res => {return res.json()})
      .then(resJson => {
        const comp2 = resJson.map((outcome) => ({id: outcome.year + outcome.state + outcome.district + outcome.party, ...outcome }));
        setData17(comp2);
      })
      .catch(err => console.log(err)); 
  }, [redistricting_1, redistricting_2, state]);




  const columnsA = [
    { field: 'year', headerName: 'Year', width: 200},
    { field: 'state', headerName: 'State', width: 200 },
    { field: 'district', headerName: 'District', width: 200},
    { field: 'party', headerName: 'Party' , width: 200},
    { field: 'votesA', headerName: 'Votes: Redistricting A', width: 200},
    { field: 'votesB', headerName: 'Votes: Redistricting B', width: 200}
  ];

    const columnsB = [
    { field: 'year', headerName: 'Year', width: 220},
    { field: 'state', headerName: 'State' , width: 220},
    { field: 'district', headerName: 'District', width: 220},
    { field: 'party', headerName: 'Party' , width: 220},
    { field: 'diffVotes', headerName: 'Vote Differential Between Redistrictings', width: 290}
  ];


  return (
    <Container>
      <Dropdown className = 'Dropdown' placeholder='Select Districting #1' options = {districtings} onChange={(value) => { setmapredistricting_1(value.value) }}/>
      <Dropdown className = 'Dropdown' placeholder='Select Districting #2' options = {districtings} onChange={(value) => { setmapredistricting_2(value.value) }}/>
      <Dropdown className = 'Dropdown' placeholder='Select State' options = {states} onChange={(value) => { setState(value.value) }}/>
      <h2>Comparison</h2>
      <h3>District Vote Differentials (House) by Party & Election</h3>
      <DataGrid
        pageSize={pageSize}
        rowsPerPageOptions={[5, 15, 30]}
        onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
        className="bg"
        rows={data15}
        columns={columnsA}
        autoHeight
        sx={{width: "1250px"}}
      />
      <h3>Who Switched the Most? Which Districts Had the Highest Vote Differentials Between the Redistrictings</h3>
      <DataGrid
        pageSize={pageSize}
        rowsPerPageOptions={[5, 15, 30]}
        onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
        className="bg"
        rows={data17}
        columns={columnsB}
        autoHeight
        sx={{width: "1250px"}}
      />
    </Container>
  )

  /*
      <DataGrid
        rows={data17}
        columns={columnsB}
        autoHeight
      />
      */

}
