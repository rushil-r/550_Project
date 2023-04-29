import { useState, useEffect } from React;
import { Button, Checkbox, Container, FormControlLabel, Grid, Link, Slider, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const config = require('../config.json');

export default function CreatePage() {

  const [state, setState] = useState('');
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch(`http://${config.server_host}:${config.server_port}/create/${state}`)
      .then(res => res.json())
      .then(resJson => setData(resJson));
  }, []);

  

}