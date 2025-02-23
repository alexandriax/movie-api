/**
 * @file index.js
 * @description  main server file for the movie API. handles authentication, user management, and movie-related endpoints.
 * @requires express
 * @requires mongoose
 * @requires passport
 * @requires jsonwebtoken
 * @requires bcrypt
 * @requires morgan
 * @requires cors
 */

const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const cors = require('cors');

require('dotenv').config({ path: './uri.env' });
console.log('MongoDB URI:', process.env.CONNECTION_URI);

const app = express();

const mongoose = require('mongoose');
const models = require('./models.js');



const Movies = models.Movie;
const Users = models.User;

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// connects mongoose to database locally
 /*mongoose.connect('mongodb://localhost:27017/mooviesDB', { 
    useNewUrlParser: true, useUnifiedTopology: true   
}); */

// connects mongoose to database online
mongoose.connect( process.env.CONNECTION_URI , 
    { useNewUrlParser: true, useUnifiedTopology: true

})
.then(() => console.log('connected to mongoDB'))
.catch(err => console.error('failed to connect')) 

console.log('MongoDB URI:', process.env.CONNECTION_URI)




//static

app.use(express.static('public'));
app.use(morgan('common'));
app.use(bodyParser.json());

/**
 * Enables CORS for all routes.
 */
app.use(cors({ 
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization'],
    credentials: true,
 })); 

 app.options('*', cors()); 

let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

const { check, validationResult } = require('express-validator');
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
        image: 'https://miro.medium.com/v2/resize:fit:720/format:webp/1*ga8kbfjjbpIQ7FpiKJrGGA.jpeg',
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
        image: 'https://static.wikia.nocookie.net/headhuntershorrorhouse/images/e/e4/Mary_Mason.jpg/revision/latest/scale-to-width-down/225?cb=20230215143548',
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
        image: 'https://resizing.flixster.com/9WTXozXWG-XAlTMgO_uWZfMkWok=/300x300/v2/https://resizing.flixster.com/-XZAfHZM39UwaGJIFWKAE8fS0ak=/v3/t/assets/p173259_k_h9_ac.jpg',
        director: {
            name: 'Quentin Tarantino',
            description: 'film director focused on stylized violence',
        },
        genre: {
            name: 'slasher',
            description: 'A subgenre of horror known for consistent tropes'
        },
    }


];

// GET requests

app.get('/', (req, res) => {
    res.send('hi!')
});



// CREATE


/**
 * adds a movie to a user's list of favorites.
 * @name /users/:userId/movies/:MovieID
 * @function
 * @param {string} userId - The user's ID.
 * @param {string} MovieID - The movie's ID.
 * @returns {Object} Updated user details.
 */
app.post('/users/:userId/movies/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const updatedUser = await Users.findOneAndUpdate(
            { _id: req.params.userId }, 
            { $addToSet: { favoriteMovies: req.params.MovieID } }, 
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).send("User not found");
        }

        res.json(updatedUser);
    } catch (err) {
        console.error("Error adding favorite movie:", err);
        res.status(500).send("Error: " + err);
    }
});


/* expect JSON like:
{
    ID: integer,
    username: string,
    password: string,
    email: string,
    birthday: date
}*/
/**
 * Registers a new user.
 * @name /users
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} Created user object.
 */
app.post('/users', [
    check('username', 'Username is required').isLength({min: 5}),
    check('username', 'Username contains invalid characters').isAlphanumeric(),
    check('password', 'Password is required').not().isEmpty(),
    check('email', 'Email does not appear to be valid').isEmail() ],
    async (req, res) => {

    let errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log('validation errors:', errors.array());
        return res.status(422).json({errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.password);
    await Users.findOne({username: req.body.username })
      .then((user) => {
        if (user) {
            return res.status(400).send(req.body.username + 'already exists');
        } else {
            Users
              .create({
                username: req.body.username,
                password: hashedPassword,
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

/**
* update user profile
* @name /users/:userId
* @function
*/
app.put('/users/:userId', passport.authenticate('jwt', { session: false }),
[
    check('username', 'username is required').isLength({min: 5}),
    check('username', 'username contains invalid characters').isAlphanumeric(),
    check('email', 'email does not appear to be valid').isEmail()
],
async (req, res) => {
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    if (req.user._id.toString() !== req.params.userId) {
        return res.status(400).send('Permission denied');
    }

    
    let updatedFields = {
        username: req.body.username,
        email: req.body.email,
        birthday: req.body.birthday
    };

    
    if (req.body.password) {
        updatedFields.password = await bcrypt.hash(req.body.password, 10);
    }

    try {
        const updatedUser = await Users.findOneAndUpdate(
            { _id: req.params.userId }, 
            { $set: updatedFields },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).send("User not found");
        }

        res.json(updatedUser);
    } catch (err) {
        console.error("Error updating user:", err);
        res.status(500).send("Error: " + err);
    }
});



/**
 * fetches all movies.
 * @name /movies
 * @function
 * @returns {Array<Object>} List of all movies.
 */
app.get('/movies', (req, res, next) => {
    console.log('Incoming Auth Header:', req.headers.authorization);
    next();
}, passport.authenticate('jwt', { session: false }), async (req, res) => {
    console.log('User after Auth:', req.user);
    console.log(' Incoming Auth Header:', req.headers.authorization);


    if (!req.user) {
        console.log('User authentication failed');
        return res.status(401).send('Unauthorized');
    }

    try {
        const movies = await Movies.find();
        res.status(200).json(movies);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});






/**
 * fetches a specific movie by ID.
 * @name /movies/:id
 * @function
 * @param {string} id - The movie ID.
 * @returns {Object} The requested movie.
 */
app.get('/movies/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const movie = await Movies.findById(req.params.id);
        if (!movie) {
            return res.status(404).send('Movie not found');
        }
        res.status(200).json(movie);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err);
    }
});

/**
 * fetches a specific movie by title
 * @name /movies/:title
 * @function
 * @param {string} title 
 * @returns {Object} requested movie
 */
app.get('/movies/:title', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { title } = req.params;
    const movie = movies.find(movie => movie.title === title );

    if (movie) {
        res.status(200).json(movie);
    } else {
        res.status(400).send('movie not found')
    }
});

/**
 * fetches a movie's genre.
 * @name /movies/genre/:genreName
 * @function
 * @param {string} genreName 
 * @returns {Object} requested movie's genre
 */
app.get('/movies/genre/:genreName', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { genreName } = req.params;
    const genre = movies.find(movie => movie.genre.name === genreName).genre;

    if (genre) {
        res.status(200).json(genre);
    } else {
        res.status(400).send('genre not found')
    }
})

/**
 * fetches a movie's director. 
 * @name /movies/director/:directorName
 * @function
 * @param {string} directorName 
 * @returns {Object} requested movie's director
 */
app.get('/movies/director/:directorName', passport.authenticate('jwt', { session: false }),  (req, res) => {
    const { directorName } = req.params;
  
   const movie = movies.find(movie => movie.director.name === directorName);
    if (movie) {
        res.status(200).json(movie);
    } else {
        res.status(400).send('director not found')
    }
}); 

/**
 * fetches all movies
 * @name /movies
 * @function
 */
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const { search } = req.query;
    let query = {};
    if (search) {
        query = {
            title: { $regex: search, $options: 'i' } 
        };
    }

    try {
        const movies = await Movies.find(query);
        const formattedMovies = movies?.map(movie => ({
            id: movie.id,
            title: movie.title,
            image: movie.image,
            description: movie.description,
            director: movie.director,
            genre: movie.genre,
            featured: movie.featured
        }));
        res.status(200).json(formattedMovies);
    } catch (err) {
        console.error(err);
        res.status(500).send('error: ' + err);
    }
});


/**
 * updates a user's favorite movies.
 * @name /users/:userId/movies/:MovieID
 * @function
 */
app.post('/users/:userId/movies/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    console.log("Incoming favorite request for user:", req.params.userId);
    console.log("Movie ID:", req.params.MovieID);

    if (!req.params.MovieID) {
        console.error("Movie ID is missing!");
        return res.status(400).send("Movie ID is required");
    }

    try {
        const updatedUser = await Users.findOneAndUpdate(
            { username: req.params.username },
            { $push: { favoriteMovies: req.params.MovieID } }, 
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).send("User not found");
        }

        console.log("Movie added to favorites:", updatedUser);
        res.json(updatedUser);
    } catch (err) {
        console.error("Error adding favorite movie:", err);
        res.status(500).send("Error: " + err);
    }
});

/**
 * fetches a user's favorite movies.
 * @name /users/:userId/movies
 * @function
 */
app.get('/users/:userId/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const user = await Users.findById(req.params.userId).populate('favoriteMovies'); 
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user.favoriteMovies); 
    } catch (error) {
        console.error('Error fetching favorite movies:', error);
        res.status(500).json({ message: "Internal server error" });
    }
});

/**
 * fetches a user's profile
 * @name /users/:username
 * @function
 */
app.get('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findOne({username: req.params.username})
      .then((user) => {
        res.status(200).json(user);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('error: ' + err);
      });
});
          
  
// DELETE

/**
 * removes a user's favorite movie.
 * @name /users/:userId/movies/:MovieID
 * @function
 */
app.delete('/users/movies/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const userId = req.user._id; 
        const movieId = req.params.MovieID;

        console.log(`Removing movie ${movieId} from user ${userId}`);

        const updatedUser = await Users.findByIdAndUpdate(
            userId,
            { $pull: { favoriteMovies: movieId } },
            { new: true }
        ).populate('favoriteMovies');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(updatedUser);
    } catch (err) {
        console.error('Error removing favorite movie:', err);
        res.status(500).json({ message: 'Error removing favorite movie' });
    }
});


/**
 * deletes a user.
 * @name /users/:username
 * @function
 */
app.delete('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findOneAndDelete({username: req.params.username})
    .then((user) => {
        if (!user){
            res.status(400).send(req.params.username + 'was not found');
        } else {
            res.status(200).send(req.params.username + 'was deleted');
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('error: ' + err);
    });
});


//listen
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('listening on port ' + port);
});

//error

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('something is broken!');
});