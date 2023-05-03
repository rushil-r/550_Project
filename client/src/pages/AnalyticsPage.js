import { useState, useEffect } from 'react';
import { Container} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Dropdown } from 'react-dropdown-now';

const config = require('../config.json');

export default function AnalyticsPage() {
  /* Query params */
  const [year_7, setYear_7] = useState(2016);
  const [year1_11, setYear1_11] = useState(2016);
  const [year1_13, setYear1_13] = useState(2016);
  const [year2_13, setYear2_13] = useState(2018);

  /* Query data */
  const [data7, setData7] = useState([]);
  const [data11, setData11] = useState([]);
  const [data13, setData13] = useState([]);

  /* Query calls */
  // Which precincts voted for different parties in different elections in year X?
  useEffect(() => {
    console.log("fetch7 initiated");
    fetch(`http://${config.server_host}:${config.server_port}/analytics7?year=${year_7}`)
      .then(res => {return res.json()})
      .then(resJson => {
        // map query data to fit data grid
        const table7 = resJson.map((outcome) => ({id: outcome.precinct + outcome.county + outcome.state + outcome.party, ...outcome}));
        setData7(table7);
        console.log("the data7 is ")
        console.log(data7)
      })
      .catch(err => console.log(err));
    console.log("fetch7 completed");
  });

  // Which precincts exhibited the largest difference in votes between election types in year X?
  useEffect(() => {
    console.log("fetch11 initiated");
    fetch(`http://${config.server_host}:${config.server_port}/analytics11?year1=${year1_11}`)
      .then(res => {return res.json()})
      .then(resJson => {
        // map query data to fit data grid
        const table11 = resJson.map((outcome) => ({id: outcome.precinct + outcome.county + outcome.state + outcome.party, ...outcome}));
        setData11(table11);
        console.log("the data7 is ");
        console.log(data11);
      })
      .catch(err => console.log(err));
    console.log("fetch11 completed");
  });

  // Which precincts exhibited the largest difference in votes between years X and Y of any election type?
  useEffect(() => {
    console.log("fetch13 initiated");
    fetch(`http://${config.server_host}:${config.server_port}/analytics13?year1=${year1_13}&year2=${year2_13}`)
      .then(res => {return res.json()})
      .then(resJson => {
        // map query data to fit data grid
        const table13 = resJson.map((outcome) => ({id: outcome.precinct + outcome.county + outcome.state + outcome.party, ...outcome}));
        setData13(table13);
        console.log("the data13 is ")
        console.log(data13)
      })
      .catch(err => console.log(err));
    console.log("fetch13 completed");
  });

  /* datagrid columns */
  const columns7 = [
    { field: 'precinct', headerName: 'Precinct', width: 300},
    { field: 'county', headerName: 'County', width: 300},
    { field: 'state', headerName: 'State', width: 300},
  ];

  // data 7 uses these columns too
  const columns11 = [
    { field: 'precinct', headerName: 'Precinct', width: 250},
    { field: 'county', headerName: 'County', width: 250},
    { field: 'state', headerName: 'State', width: 250},
    { field: 'diff', headerName: 'Difference', width: 250},
  ];

  return (
    <Container>
      <h2>Analytics</h2>
      <h3>Which precincts voted for different parties in different elections in year X?</h3>
      <Dropdown className = 'Dropdown' placeholder='2016' options = {[2016, 2020]} onChange={(value) => { setYear_7(value.value) }}/>
      <DataGrid
        rows={data7}
        columns={columns7}
        autoHeight
        className="bg"
        pageSize={25}
        rowsPerPageOptions={[5, 10, 25]}
      />
      <h3>Which precincts exhibited the largest difference in votes between elections in year X?</h3>
      <Dropdown className = 'Dropdown' placeholder='2016' options = {[2016, 2018, 2020]} onChange={(value) => { setYear1_11(value.value) }}/>
      <DataGrid
        rows={data11}
        columns={columns11}
        autoHeight
        className="bg"
        pageSize={25}
        rowsPerPageOptions={[5, 10, 25]}
      />
      <h3>Which precincts exhibited the largest difference in votes between years X and Y of any election type?</h3>
      <Dropdown className = 'Dropdown' placeholder='2016' options = {[2016, 2018, 2020]} onChange={(value) => { setYear1_13(value.value) }}/>
      <Dropdown className = 'Dropdown' placeholder='2018' options = {[2016, 2018, 2020]} onChange={(value) => { setYear2_13(value.value) }}/>
      <DataGrid
        rows={data13}
        columns={columns11}
        autoHeight
        className="bg"
        pageSize={25}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </Container>
  )
}