const express = require('express');
  morgan = require('morgan');
  bodyParser = require('body-parser'),
  uuid = require('uuid');

const app = express();


//static

app.use(express.static('public'));

app.use(morgan('common'));
app.use(bodyParser.json());


let movies = [
    
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

//listen
app.listen(8080, () => {
    console.log('your app is listening on port 8080')
})

//error

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('something is broken!');
});