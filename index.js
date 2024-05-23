const express = require('express');
  morgan = require('morgan');

const app = express();

//static

app.use(express.static('public'));
