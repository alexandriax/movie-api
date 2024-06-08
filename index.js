const express = require('express');
  morgan = require('morgan');
  bodyParser = require('body-parser'),
  uuid = require('uuid');

const app = express();

const mongoose = require('mongoose');
const models = require('./models.js');

const Movies = models.Movie;
const Users = models.User;

// connects mongoose to database
mongoose.connect('mongodb://localhost:27017/mooviesDB', { 
    useNewUrlParser: true, useUnifiedTopology: true   
});


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
        description: '1997; shows the struggle between humans and the forest gods',
        director: {
            name:'Hayao Miyazaki',
            description: 'an internationally acclaimed anime director who also founded studio ghibli'
        },
        genre: {
            name: 'animation',
            description: 'A film technique to make still images move'
        },
    },
    {
        title: 'american mary',
        description: 'a medical student resorts to offering body modification services to ease financial troubles, seeks revenge on those who wronged her',
        director: {
            name: 'Jen & Sylvia Soska',
            description: 'also known as the soska sisters or the twins; they are twin sisters who collaborate in directing horror-focused films',
        },
        genre: {
            name: 'horror',
            description: 'A category of film meant to scare the viewer'
        },
    },
    {
        title: 'deathproof',
        description: '2007; inspired by low-budge grindhouse films, shows the story of a stuntman who uses his modified car to murder women',
        director: {
            name: 'Quentin Tarantino',
            description: 'film director focused on stylized violence',
        },
        genre: {
            name: 'slasher',
            description: 'A subgenre of horror known for consistent tropes'
        },
    }

    //continue top ten


];

// GET requests

app.get('/', (req, res) => {
    res.send('welcome!')
});


// CREATE

// add a movie to a user's list of favorites
app.post('/users/:username/movies/:MovieID', async (req, res) => {
    await Users.findOneAndUpdate({username: req.params.username}, {
        $push: { favoriteMovies: req.params.MovieID}
    },
{ new: true })
.then((updatedUser) => {
    res.json(updatedUser);
})
.catch((err) => {
    console.error(err);
    res.status(500).send('error: ' + err);
});
});

app.post('/users/:id/:movieTitle', (req, res) => {
    const { id, movieTitle } = req.params;
    const updatedUser = req.body;

    let user = users.find(user => user.id == id);

    if (user) {
        user.favoriteMovies.push(movieTitle);
        res.status(200).send(`${movieTitle} has been added to user ${id}'s array`);;
    } else {
        res.status(400).send('user not found')
    }
})
//add a user
/* expect JSON like:
{
    ID: integer,
    username: string,
    password: string,
    email: string,
    birthday: date
}*/
app.post('/users', async (req, res) => {
    await Users.findOne({username: req.body.username })
      .then((user) => {
        if (user) {
            return res.status(400).send(req.body.username + 'already exists');
        } else {
            Users
              .create({
                username: req.body.username,
                password: req.body.password,
                email: req.body.email,
                birthday: req.body.birthday
            })
              .then((user) =>{res.status(201).json(user) })
              .catch((error) => {
                console.error(error);
                res.status(500).send('error:' + error);
              })
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('error:' + error);
      });
});

// UPDATE

// update a user's info by username
app.put('/users/:username', async (req, res) => {
    await Users.findOneAndUpdate({username: req.params.username}, {$set:
        {
            username: req.body.username,
            password: req.body.password,
            email: req.body.email,
            birthday: req.body.birthday
        }
    },
{ new: true }) // makes sure updated document is returned
.then((updatedUser) => {
    res.json(updatedUser);
})
.catch((err) => {
    console.error(err);
    res.status(500).send('error: ' + err);
  })
});


// READ
app.get('/movies', (req, res) => {
    res.status(200).json(movies);
});

app.get('/movies/:title', (req, res) => {
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
    const genre = movies.find(movie => movie.genre.name === genreName).genre;

    if (genre) {
        res.status(200).json(genre);
    } else {
        res.status(400).send('genre not found')
    }
})

app.get('/movies/director/:directorName', (req, res) => {
    const { directorName } = req.params;
  
   const movie = movies.find(movie => movie.director.name === directorName);
    if (movie) {
        res.status(200).json(movie);
    } else {
        res.status(400).send('director not found')
    }
}); 

// DELETE
app.delete('/users/:id/:movieTitle', (req, res) => {
    const { id, movieTitle } = req.params;

    let user = users.find(user => user.id == id);

    if (user) {
        user.favoriteMovies = user.favoriteMovies.filter( title => title !== movieTitle);
        res.status(200).send(`${movieTitle} has been removed from user ${id}'s array`);;
    } else {
        res.status(400).send('user not found')
    }
});

app.delete('/users/:id', (req, res) => {
    const { id } = req.params;

    let user = users.find(user => user.id == id);

    if (user) {
        users = users.filter( user => user.id != id);
        res.status(200).send(` user ${id} has been deleted`);;
    } else {
        res.status(400).send('user not found')
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