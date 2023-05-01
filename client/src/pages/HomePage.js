import { useState, useEffect } from 'react';
import { useParams, useLocation} from 'react-router-dom';
import { Button, Checkbox, Container, FormControlLabel, Grid, Link, Slider, TextField, makeStyles} from '@mui/material';
import { Dropdown } from 'react-dropdown-now';
import { DataGrid, gridColumnsTotalWidthSelector } from '@mui/x-data-grid';
import './HomePage.css';

const config = require('../config.json');

export default function HomePage() {

  
  const {search} = useLocation()  
  const queryParams = new URLSearchParams(search)  
  const [states, setStates] = useState([]) 
  const [districts, setDistricts] = useState([])
  const [districtings, setDistrictings] = useState([])
  const [state, setState] = useState(queryParams.get('state'))  
  const [district, setDistrict] = useState(queryParams.get('district')) 
  const [year, setYear]  = useState(queryParams.get('year')) 
  const [redistricting_id, setRedistrictingId] = useState(queryParams.get('redistricting')) 
  const [election_type, setElectionType] = useState(queryParams.get('election_type')) 

  // const [year, setYear] = useState(2016);   
  // const [redistricting_id, setRedistrictingId] = useState('Default'); 
  // const [election_type, setElectionType] = useState('presidential'); 
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState([]); 
  const [summary_text, setSummaryText]= useState(``); 
  const [result, setResult] = useState('')
  console.log(`State: ${state}`) 
  console.log(`District: ${district}`) 
  console.log(`Election Type: ${election_type}`)
   

  useEffect(() => {
    fetch(`http://${config.server_host}:${config.server_port}/get_states`)
      .then(res => {return res.json()})
      .then(resJson => { 
        const states = resJson.map((outcome) => (outcome.state));
        states.push('All')
        setStates(states);
      })
      .catch(err => console.log(err));
  }, []);

  useEffect(() => {
    fetch(`http://${config.server_host}:${config.server_port}/get_districtings`)
    .then(res => {return res.json()})
    .then(resJson => {
      const districtings = resJson.map((outcome) => (outcome.name));
      setDistrictings(districtings);
    })
    .catch(err => console.log(err));
  }, [state, year, election_type]);

  useEffect(() => {
    if (state !== 'All' && state !== null) {
      fetch(`http://${config.server_host}:${config.server_port}/get_districts/?state=${state}`)
      .then(res => {return res.json()})
      .then(resJson => {
        const districts = resJson.map((outcome) => (outcome.num_districts));
        const array = Array.from({ length: districts }, (_, index) => index + 1)
        array.push('All')
        setDistricts(array);
        
      })
      .catch(err => console.log(err));
    } else {
      setDistricts([])
    }
  }, [state]);

  
  useEffect(() => {
    let url = `http://${config.server_host}:${config.server_port}/?redistricting_id=${redistricting_id}&election_type=${election_type}&year=${year}`
    if (state !== 'All' && state !== null) {
      url += `&state=${state}`;
      if (district !== 'All' && district !== null) {
        url += `&district=${district}`; 
      }
    } 
  console.log(`Fetch URL: ${url}`);
    fetch(url)
      .then(res => {return res.json()})
      .then(resJson => {     
        console.log(resJson['election_data']) 
        console.log(resJson['election_summary'])
        const votes = resJson['election_data'].map((outcome) => ({id: outcome.state + outcome.county + outcome.precinct + outcome.district, ... outcome}));
        setData(votes); 
        setSummary(resJson['election_summary'])
      })
      .catch(err => console.log(err));
  }, [redistricting_id, election_type, year,
  state, district]);

  useEffect(() => {
    if ((district != 'All' && district != null) || ((election_type == 'presidential') && (state != 'All') && (state != null))) {
      let tempSummaryText = ``;
      for (let i = 0; i < summary.length; i++) { 
        console.log('line 60')
        console.log(summary[i])
        const result = `<strong>${summary[i]['party']}</strong>: ${summary[i]['num_votes'].toLocaleString()} Votes `;
        tempSummaryText += result
      } 
      setSummaryText(tempSummaryText);
    } else {
      if (election_type == 'presidential') {
        console.log(summary)
        let tempSummaryText = ``;
        for (let i = 0; i < summary.length; i++) {  
          console.log('line 69') 
          const result = `<strong>${summary[i]['party']}</strong>: ${summary[i]['electoral_votes'].toLocaleString()} Electoral Votes `;
          tempSummaryText += result;
        }
        setSummaryText(tempSummaryText)
      } else {
        console.log('line 67')
        let tempSummaryText = ``;
        for (let i = 0; i < summary.length; i++) { 
          const result = `<strong>${summary[i]['party']}</strong>: ${summary[i]['num_seats'].toLocaleString()} Seats `;
          tempSummaryText = tempSummaryText + result
        }
        setSummaryText(tempSummaryText)
      }
    }
  }, [summary]);

  const columns = [
    { field: 'state', headerName: 'State'},
    { field: 'county', headerName: 'County' },
    { field: 'precinct', headerName: 'Precinct' },
    { field: 'district', headerName: 'District' },
    { field: 'republican_votes', headerName: 'Republican' },
    { field: 'democratic_votes', headerName: 'Democrat' },
    { field: 'independent_votes', headerName: 'Independent' },
    { field: 'green_votes', headerName: 'Green Votes' },
    { field: 'libertarian_votes', headerName: 'Libertarian' },
    { field: 'constitution_votes', headerName: 'Constitution' },
  ];


  return (
    <Container>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <Dropdown className='Dropdown' placeholder='Select a districting' options={districtings} onChange={(value) => {
          setRedistrictingId(value.value);
          setSummaryText(``);
        }} value={redistricting_id}/>
  
        <Dropdown className='Dropdown' placeholder='Select a Year' options={[2016, 2018, 2020]} onChange={(value) => {
          setYear(value.value);
          // setSummaryText(``);
        }} value={year}/>
  
        <Dropdown className='Dropdown' placeholder='Select an Election Type' options={['house', 'presidential']} onChange={(value) => {
          setElectionType(value.value);
          // setSummaryText(``);
        }} value={election_type}/>
  
        <Dropdown className='Dropdown' placeholder='Select a state' options={states} onChange={(value) => {
          console.log(value)
          setState(value.value);
          setDistrict(null);
          // setSummaryText(``);
        }} value={state}/>
  
        {(state !== null && state !== 'All') && (
          <Dropdown className='Dropdown' placeholder='Select a district' options={districts} onChange={(value) => {
            setDistrict(value.value);
            // setSummaryText(``);
          }} value={district}/>
        )}
      </div>
  
      {(year !== null && redistricting_id !== null && election_type !== null) && (<h2>Election Results for {year} {election_type.charAt(0).toUpperCase() + election_type.slice(1)} Election with District Mapping '{redistricting_id}'</h2>)
      }
  
      <p dangerouslySetInnerHTML={{__html: summary_text}}></p>
  
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <DataGrid
          rows={data}
          columns={columns}
          autoHeight
          className="bg"
        />
      </div>
  
    </Container>
  );
      }
//   return (
//     <Container>

//   <Dropdown className='Dropdown' style={{ display: 'inline-block', width: '25%' }} placeholder='Select a districting' options={districtings} onChange={(value) => {
//     setRedistrictingId(value.value);
//     setSummaryText(``);
//   }} value={redistricting_id}/>


//   <Dropdown className='Dropdown' style={{ display: 'inline-block', width: '25%' }} placeholder='Select a Year' options={[2016, 2018, 2020]} onChange={(value) => {
//     setYear(value.value);
//     // setSummaryText(``);
//   }} value={year}/>


//   <Dropdown className='Dropdown' style={{ display: 'inline-block', width: '25%' }} placeholder='Select an Election Type' options={['house', 'presidential']} onChange={(value) => {
//     setElectionType(value.value);
//     // setSummaryText(``);
//   }} value={election_type}/>


//   <Dropdown className='Dropdown' style={{ display: 'inline-block', width: '25%' }} placeholder='Select a state' options={states} onChange={(value) => {
//     console.log(value)
//     setState(value.value);
//     setDistrict(null);
//     // setSummaryText(``);
//   }} value={state}/>

// {(state !== null && state !== 'All') && (
//   <Dropdown className='Dropdown' style={{ display: 'inline-block', width: '25%' }} placeholder='Select a district' options={districts} onChange={(value) => {
//     setDistrict(value.value);
//     // setSummaryText(``);
//   }} value={district}/>
// )
//       }
//       {(year !== null && redistricting_id !== null && election_type !== null) && (<h2>Election Results for {year} {election_type.charAt(0).toUpperCase() + election_type.slice(1)} Election with District Mapping '{redistricting_id}'</h2>)
//       }
//       <p dangerouslySetInnerHTML={{__html: summary_text}}></p>
//       <div>
//         <DataGrid
//           rows={data}
//           columns={columns}
//           autoHeight
//         />
//       </div>
      
//     </Container>
//   )
// }
