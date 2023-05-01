import { useState, useEffect } from 'react';
import { Container} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Dropdown } from 'react-dropdown-now';

const config = require('../config.json');

export default function AnalyticsPage() {

  const [year_7, setYear_7] = useState(2016);
  const [year1_11, setYear1_11] = useState(2016);
  const [year1_13, setYear1_13] = useState(2016);
  const [year2_13, setYear2_13] = useState(2018);
  const [data7, setData7] = useState([
    {
      "precinct": "(02) 21GAL 02",
      "county": "CLAY",
      "state": "MISSOURI"
    },
    {
      "precinct": "(18) 21CHOU18",
      "county": "CLAY",
      "state": "MISSOURI"
    },
    {
      "precinct": "(19) 21CHOU19",
      "county": "CLAY",
      "state": "MISSOURI"
    },
    {
      "precinct": "(21) 21CHOU21",
      "county": "CLAY",
      "state": "MISSOURI"
    },
    {
      "precinct": "(22) 21CHOU22",
      "county": "CLAY",
      "state": "MISSOURI"
    },
    {
      "precinct": "(B11) CITY OF BETTENDORF",
      "county": "SCOTT",
      "state": "IOWA"
    },
    {
      "precinct": "(B12) CITY OF BETTENDORF",
      "county": "SCOTT",
      "state": "IOWA"
    },
    {
      "precinct": "(D23) CITY OF DAVENPORT",
      "county": "SCOTT",
      "state": "IOWA"
    },
    {
      "precinct": "(DH) CITY OF DONAHUE",
      "county": "SCOTT",
      "state": "IOWA"
    },
    {
      "precinct": "(LG) CITY OF LONG GROVE",
      "county": "SCOTT",
      "state": "IOWA"
    },
    {
      "precinct": "[Unknown]",
      "county": "LARIMER",
      "state": "COLORADO"
    },
    {
      "precinct": "0-23, WARD 3",
      "county": "EATON",
      "state": "MICHIGAN"
    },
    {
      "precinct": "00 009",
      "county": "LAFAYETTE",
      "state": "LOUISIANA"
    },
    {
      "precinct": "00 01A",
      "county": "WEST BATON ROUGE",
      "state": "LOUISIANA"
    },
    {
      "precinct": "00 020",
      "county": "CADDO",
      "state": "LOUISIANA"
    },
    {
      "precinct": "00 020",
      "county": "LAFAYETTE",
      "state": "LOUISIANA"
    },
    {
      "precinct": "00 021",
      "county": "CADDO",
      "state": "LOUISIANA"
    },
    {
      "precinct": "00 021",
      "county": "LAFAYETTE",
      "state": "LOUISIANA"
    },
    {
      "precinct": "00 025",
      "county": "CADDO",
      "state": "LOUISIANA"
    },
    {
      "precinct": "00 025",
      "county": "JEFFERSON",
      "state": "LOUISIANA"
    },
    {
      "precinct": "00 026",
      "county": "JEFFERSON",
      "state": "LOUISIANA"
    },
    {
      "precinct": "00 026",
      "county": "LAFAYETTE",
      "state": "LOUISIANA"
    },
    {
      "precinct": "00 027",
      "county": "JEFFERSON",
      "state": "LOUISIANA"
    },
    {
      "precinct": "00 029",
      "county": "CADDO",
      "state": "LOUISIANA"
    },
    {
      "precinct": "00 029",
      "county": "LAFAYETTE",
      "state": "LOUISIANA"
    }
  ].map((outcome) => ({id: outcome.precinct + outcome.county + outcome.state + outcome.party, ...outcome})));
  const [data11, setData11] = useState([
    {
      "precinct": "Ramapo 45",
      "county": "ROCKLAND",
      "state": "NEW YORK",
      "diff": 0.9737
    },
    {
      "precinct": "Ramapo 102",
      "county": "ROCKLAND",
      "state": "NEW YORK",
      "diff": 0.9574
    },
    {
      "precinct": "109R",
      "county": "UMATILLA",
      "state": "OREGON",
      "diff": 0.9348
    },
    {
      "precinct": "Ramapo 41",
      "county": "ROCKLAND",
      "state": "NEW YORK",
      "diff": 0.9276
    },
    {
      "precinct": "Ramapo 85",
      "county": "ROCKLAND",
      "state": "NEW YORK",
      "diff": 0.9221
    },
    {
      "precinct": "Ramapo 28",
      "county": "ROCKLAND",
      "state": "NEW YORK",
      "diff": 0.9128
    },
    {
      "precinct": "060670072804_001007006009",
      "county": "SACRAMENTO",
      "state": "CALIFORNIA",
      "diff": 0.9091
    },
    {
      "precinct": "Ramapo 97",
      "county": "ROCKLAND",
      "state": "NEW YORK",
      "diff": 0.9065
    },
    {
      "precinct": "Ramapo 35",
      "county": "ROCKLAND",
      "state": "NEW YORK",
      "diff": 0.8981
    },
    {
      "precinct": "96U20264",
      "county": "EL DORADO",
      "state": "CALIFORNIA",
      "diff": 0.8889
    },
    {
      "precinct": "Ramapo 40",
      "county": "ROCKLAND",
      "state": "NEW YORK",
      "diff": 0.8886
    },
    {
      "precinct": "00 11B",
      "county": "WEST BATON ROUGE",
      "state": "LOUISIANA",
      "diff": 0.8857
    },
    {
      "precinct": "DU PAGE PCT 036",
      "county": "WILL",
      "state": "ILLINOIS",
      "diff": 0.8786
    },
    {
      "precinct": "00 W001",
      "county": "JEFFERSON",
      "state": "LOUISIANA",
      "diff": 0.8769
    },
    {
      "precinct": "Ramapo 103",
      "county": "ROCKLAND",
      "state": "NEW YORK",
      "diff": 0.8750
    },
    {
      "precinct": "Ramapo 20",
      "county": "ROCKLAND",
      "state": "NEW YORK",
      "diff": 0.8728
    },
    {
      "precinct": "00 G001",
      "county": "JEFFERSON",
      "state": "LOUISIANA",
      "diff": 0.8724
    },
    {
      "precinct": "TOWN OF LEOLA Ward 1",
      "county": "ADAMS",
      "state": "WISCONSIN",
      "diff": 0.8696
    },
    {
      "precinct": "Ramapo 18",
      "county": "ROCKLAND",
      "state": "NEW YORK",
      "diff": 0.8667
    },
    {
      "precinct": "Ramapo 56",
      "county": "ROCKLAND",
      "state": "NEW YORK",
      "diff": 0.8638
    },
    {
      "precinct": "124R",
      "county": "UMATILLA",
      "state": "OREGON",
      "diff": 0.8627
    },
    {
      "precinct": "SB41172",
      "county": "SAN BERNARDINO",
      "state": "CALIFORNIA",
      "diff": 0.8571
    },
    {
      "precinct": "UNI0048",
      "county": "SAN BERNARDINO",
      "state": "CALIFORNIA",
      "diff": 0.8542
    },
    {
      "precinct": "Ramapo 84",
      "county": "ROCKLAND",
      "state": "NEW YORK",
      "diff": 0.8540
    },
    {
      "precinct": "Ramapo 30",
      "county": "ROCKLAND",
      "state": "NEW YORK",
      "diff": 0.8532
    }
  ].map((outcome) => ({id: outcome.precinct + outcome.county + outcome.state + outcome.party, ...outcome})));
  const [data13, setData13] = useState([
    {
      "precinct": "TOWN OF BUENA VISTA WARDS 1-3",
      "county": "RICHLAND",
      "state": "WISCONSIN",
      "party": "Democratic",
      "type": "house",
      "diff": 0.9772
    },
    {
      "precinct": "CITY OF MADISON Ward 138",
      "county": "DANE",
      "state": "WISCONSIN",
      "party": "Democratic",
      "type": "house",
      "diff": 0.9729
    },
    {
      "precinct": "CITY OF EAU CLAIRE Ward 6",
      "county": "EAU CLAIRE",
      "state": "WISCONSIN",
      "party": "Democratic",
      "type": "house",
      "diff": 0.9651
    },
    {
      "precinct": "1133600_2516",
      "county": "DALLAS",
      "state": "TEXAS",
      "party": "Democratic",
      "type": "house",
      "diff": 0.9243
    },
    {
      "precinct": "2150145_5341",
      "county": "HIDALGO",
      "state": "TEXAS",
      "party": "Democratic",
      "type": "house",
      "diff": 0.9233
    },
    {
      "precinct": "4530125",
      "county": "TRAVIS",
      "state": "TEXAS",
      "party": "Democratic",
      "type": "house",
      "diff": 0.9199
    },
    {
      "precinct": "1133099_2456",
      "county": "DALLAS",
      "state": "TEXAS",
      "party": "Democratic",
      "type": "house",
      "diff": 0.9154
    },
    {
      "precinct": "M102",
      "county": "JEFFERSON",
      "state": "KENTUCKY",
      "party": "Democratic",
      "type": "house",
      "diff": 0.9102
    },
    {
      "precinct": "0608723660_002020017030",
      "county": "SANTA CRUZ",
      "state": "CALIFORNIA",
      "party": "Democratic",
      "type": "house",
      "diff": 0.8819
    },
    {
      "precinct": "01 04D",
      "county": "VERNON",
      "state": "LOUISIANA",
      "party": "Republican",
      "type": "house",
      "diff": 0.8674
    },
    {
      "precinct": "0608720096_002020017029",
      "county": "SANTA CRUZ",
      "state": "CALIFORNIA",
      "party": "Democratic",
      "type": "house",
      "diff": 0.8626
    },
    {
      "precinct": "2150090_5286",
      "county": "HIDALGO",
      "state": "TEXAS",
      "party": "Democratic",
      "type": "house",
      "diff": 0.8594
    },
    {
      "precinct": "1134032_2593",
      "county": "DALLAS",
      "state": "TEXAS",
      "party": "Democratic",
      "type": "house",
      "diff": 0.8560
    },
    {
      "precinct": "1133202_2474",
      "county": "DALLAS",
      "state": "TEXAS",
      "party": "Democratic",
      "type": "house",
      "diff": 0.8498
    },
    {
      "precinct": "UNI0692",
      "county": "SAN BERNARDINO",
      "state": "CALIFORNIA",
      "party": "Republican",
      "type": "house",
      "diff": 0.8417
    },
    {
      "precinct": "27-043",
      "county": "BALTIMORE CITY",
      "state": "MARYLAND",
      "party": "Democratic",
      "type": "house",
      "diff": 0.8313
    },
    {
      "precinct": "VILLAGE OF LAKE DELTON WARDS 4-10",
      "county": "SAUK",
      "state": "WISCONSIN",
      "party": "Democratic",
      "type": "house",
      "diff": 0.8261
    },
    {
      "precinct": "999129",
      "county": "MENDOCINO",
      "state": "CALIFORNIA",
      "party": "Democratic",
      "type": "house",
      "diff": 0.8258
    },
    {
      "precinct": "27-039",
      "county": "BALTIMORE CITY",
      "state": "MARYLAND",
      "party": "Democratic",
      "type": "house",
      "diff": 0.8227
    },
    {
      "precinct": "Lawrence Precinct 41 S2 H46",
      "county": "DOUGLAS",
      "state": "KANSAS",
      "party": "Democratic",
      "type": "house",
      "diff": 0.8223
    },
    {
      "precinct": "HAYDEN HEIGHTS",
      "county": "MARIES",
      "state": "MISSOURI",
      "party": "Republican",
      "type": "house",
      "diff": 0.8185
    },
    {
      "precinct": "L158",
      "county": "JEFFERSON",
      "state": "KENTUCKY",
      "party": "Democratic",
      "type": "house",
      "diff": 0.8156
    },
    {
      "precinct": "1133092_2449",
      "county": "DALLAS",
      "state": "TEXAS",
      "party": "Democratic",
      "type": "house",
      "diff": 0.8155
    },
    {
      "precinct": "999138",
      "county": "MENDOCINO",
      "state": "CALIFORNIA",
      "party": "Democratic",
      "type": "house",
      "diff": 0.8145
    },
    {
      "precinct": "4391586",
      "county": "TARRANT",
      "state": "TEXAS",
      "party": "Democratic",
      "type": "house",
      "diff": 0.8118
    }
  ].map((outcome) => ({id: outcome.precinct + outcome.county + outcome.state + outcome.party, ...outcome})));

  useEffect(() => {
    console.log("fetch7 initiated");
    fetch(`http://${config.server_host}:${config.server_port}/analytics7?year=${year_7}`)
      .then(res => {return res.json()})
      .then(resJson => {
        const table7 = resJson.map((outcome) => ({id: outcome.precinct + outcome.county + outcome.state + outcome.party, ...outcome}));
        setData7(table7);
        console.log("the data7 is ")
        console.log(data7)
      })
      .catch(err => console.log(err));
    console.log("fetch7 completed");
  });

  useEffect(() => {
    console.log("fetch11 initiated");
    fetch(`http://${config.server_host}:${config.server_port}/analytics11?year1=${year1_11}`)
      .then(res => {return res.json()})
      .then(resJson => {
        const table11 = resJson.map((outcome) => ({id: outcome.precinct + outcome.county + outcome.state + outcome.party, ...outcome}));
        setData11(table11);
        console.log("the data7 is ");
        console.log(data11);
      })
      .catch(err => console.log(err));
    console.log("fetch11 completed");
  });

  useEffect(() => {
    console.log("fetch13 initiated");
    fetch(`http://${config.server_host}:${config.server_port}/analytics13?year1=${year1_13}&year2=${year2_13}`)
      .then(res => {return res.json()})
      .then(resJson => {
        const table13 = resJson.map((outcome) => ({id: outcome.precinct + outcome.county + outcome.state + outcome.party, ...outcome}));
        setData13(table13);
        console.log("the data13 is ")
        console.log(data13)
      })
      .catch(err => console.log(err));
    console.log("fetch13 completed");
  });

  const columns7 = [
    { field: 'precinct', headerName: 'Precinct', width: 300},
    { field: 'county', headerName: 'County', width: 300},
    { field: 'state', headerName: 'State', width: 300},
  ];

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