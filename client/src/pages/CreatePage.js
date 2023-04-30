import { useState, useEffect } from 'react';
import { Container} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Dropdown } from 'react-dropdown-now';
import './CreatePage.css';

const config = require('../config.json');

export default function CreatePage() {

  const [state, setState] = useState('PENNSYLVANIA');
  const [data, setData] = useState([]);
  const [states, setStates] = useState([]);

  useEffect(() => {
    console.log(`${state}`);
    fetch(`http://${config.server_host}:${config.server_port}/create?state=${state}`)
      .then(res => {return res.json()})
      .then(resJson => {
        const votes = resJson.map((outcome) => ({id: outcome.precinct + outcome.county + outcome.state, ...outcome }));
        setData(votes);
      })
      .catch(err => console.log(err));
      console.log("fetch completed");
  }, [state]);

  useEffect(() => {
    fetch(`http://${config.server_host}:${config.server_port}/get_states`)
      .then(res => {return res.json()})
      .then(resJson => {
        const states = resJson.map((outcome) => (outcome.state));
        setStates(states);
        console.log(states);
      })
  }, []);

  const columns = state ? [
    { field: 'precinct', headerName: 'Precinct'},
    { field: 'county', headerName: 'County' },
    { field: 'district', headerName: 'Original District' },
    { field: 'rep_vote', headerName: 'Republican Votes' },
    { field: 'dem_vote', headerName: 'Democratic Votes' },
    { field: 'lib_vote', headerName: 'Libertarian Votes' },
    { field: 'gre_vote', headerName: 'Green Votes' },
    { field: 'con_vote', headerName: 'Constitution Votes' },
    { field: 'ind_vote', headerName: 'Independent Votes' },
    { field: 'new_dist', headerName: 'New District', editable: true }
  ] : [
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
    { field: 'new_dist', headerName: 'New District', editable: true }
  ];

  return (
    <Container >
      <Dropdown
      className = 'DropDown'
      placeholder="Select a state"
      options={states}
      value="one"
      onChange={(value) => setState(value.value)}
    />
      <h2>Set the districts here:</h2>
      <DataGrid
        className="bg"
        rows={data}
        columns={columns}
        autoHeight
        sx={{width: "1100px"}}
      />
    </Container>
  )

  

}