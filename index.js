const express = require('express');
  morgan = require('morgan');

const app = express();

//static

app.use(express.static('public'));

app.use(morgan('common'));



let topMovies = [
    
    {
        title: 'princess mononoke',
        director: 'Hayao Miyazaki'
    },
    {
        title: 'american mary',
        director: 'Jen & Sylvia Soska'
    },
    {
        title: 'deathproof',
        director: 'Quentin Tarantino'
    }

    //continue top ten


];

// GET requests

app.get('/', (req, res) => {
    res.send('welcome!')
});

app.get('/movies', (req, res) => {
    res.json(topMovies);
});
