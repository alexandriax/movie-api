const express = require('express');
  morgan = require('morgan');
  bodyParser = require('body-parser'),
  uuid = require('uuid');

const app = express();


//static

app.use(express.static('public'));

app.use(morgan('common'));
app.use(bodyParser.json());

let users = [
    {
        name: 'ashley',
        id: 1,
        favoriteMovies: []
    },
    {
        name: 'joe',
        id: 2,
        favoriteMovies: []
    },

];

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

// READ
app.get('/movies', (req, res) => {
    res.status(200).json(movies);
});

app.get('/movies:title', (req, res) => {
    const { title } = req.params;
    const movie = movies.find(movie => movie.title === title );

    if (movie) {
        res.status(200).json(movie);
    } else {
        res.status(400).send('movie not found')
    }
});

app.get('/movies/genre/:genreName', (req, res) => {
    const { genreName } = req.params;
    const moviegenre = movies.find(movie => movie.genre.name === genreName).genre;

    if (genre) {
        res.status(200).json(genre);
    } else {
        res.status(400).send('genre not found')
    }
});

app.get('/movies/director/:directorName', (req, res) => {
    const { directorName } = req.params;
    const movie = movies.find(movie => movie.director.name === directorName).director;

    if (movie) {
        res.status(200).json(movie);
    } else {
        res.status(400).send('movie not found')
    }
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