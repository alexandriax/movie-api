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
// gpt suggestion


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


//

//static

app.use(express.static('public'));
app.use(morgan('common'));
app.use(bodyParser.json());

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

// add a movie to a user's list of favorites
app.post('/users/:username/movies/:MovieID', passport.authenticate('jwt', { session: false }),  async (req, res) => {
    await Users.findOneAndUpdate({username: req.params.username}, {
        $addToSet: { favoriteMovies: req.params.MovieID}
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

//add a user
/* expect JSON like:
{
    ID: integer,
    username: string,
    password: string,
    email: string,
    birthday: date
}*/

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

app.post('/login', async (req, res) => {
    console.error("🔹 Incoming Login Request Body:", req.body); // Log the request body

    // Check if req.body is actually an object
    if (!req.body || typeof req.body !== "object") {
        console.error("🚨 Backend received an INVALID request body:", req.body);
        return res.status(400).json({ message: "Invalid request format.", user: false });
    }

    const { username, password } = req.body;

    if (!username || !password) {
        console.error("🚨 Missing Username or Password! Received:", req.body);
        return res.status(400).json({ message: "Username and password are required.", user: false });
    }

    try {
        const user = await Users.findOne({ username: req.body.username.toLowerCase() });

        if (!user) {
            console.error("🚨 User Not Found:", username);
            return res.status(400).json({ message: "Invalid username or password", user: false });
        }

        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {
            console.error("🚨 Incorrect Password for User:", username);
            return res.status(400).json({ message: "Invalid username or password", user: false });
        }

        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '7d' }
        );

        console.error("✅ User Authenticated:", user.username);
        console.log("Login Response:", {
            token,
            user: { _id: user._id, username: user.username },
          });
           // Log user authentication
           res.json({
            token: token,
            userId: user._id,
            username: user.username  // Ensure username is included in the response
        });

    } catch (err) {
        console.error("🚨 Server Error:", err);
        res.status(500).json({ message: "Internal server error", user: false });
    }
});




// UPDATE

// update a user's info by username
app.put('/users/:username', passport.authenticate('jwt', { session: false }),
[
    check('username', 'username is required').isLength({min: 5}),
    check('username', 'username contains invalid characters').isAlphanumeric(),
    check('password', 'password is required').not().isEmpty(),
    check('email', 'email does not appear to be valid').isEmail()
],
     async (req, res) => {

    let errors = validationResult(req);

    if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array() });
    }

    if(req.user.username !== req.params.username){
        return res.status(400).send('permission denied');
    }
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


app.get('/movies/:title', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { title } = req.params;
    const movie = movies.find(movie => movie.title === title );

    if (movie) {
        res.status(200).json(movie);
    } else {
        res.status(400).send('movie not found')
    }
});


app.get('/movies/genre/:genreName', passport.authenticate('jwt', { session: false }), (req, res) => {
    const { genreName } = req.params;
    const genre = movies.find(movie => movie.genre.name === genreName).genre;

    if (genre) {
        res.status(200).json(genre);
    } else {
        res.status(400).send('genre not found')
    }
})

app.get('/movies/director/:directorName', passport.authenticate('jwt', { session: false }),  (req, res) => {
    const { directorName } = req.params;
  
   const movie = movies.find(movie => movie.director.name === directorName);
    if (movie) {
        res.status(200).json(movie);
    } else {
        res.status(400).send('director not found')
    }
}); 

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

// Get a user's favorite movies
/*app.post('/users/movies/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const userId = req.user._id; // Get user ID from the token
        const movieId = req.params.MovieID;

        console.log(`🔹 Adding movie ${movieId} to user ${userId}`);

        const updatedUser = await Users.findByIdAndUpdate(
            userId,
            { $addToSet: { favoriteMovies: movieId } }, // Avoid duplicates
            { new: true }
        ).populate('favoriteMovies');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(updatedUser);
    } catch (err) {
        console.error('Error adding favorite movie:', err);
        res.status(500).json({ message: 'Error adding favorite movie' });
    }
}); */

app.post('/users/:username/movies/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    console.log("Incoming favorite request for user:", req.params.username);
    console.log("Movie ID:", req.params.MovieID);

    if (!req.params.MovieID) {
        console.error("Movie ID is missing!");
        return res.status(400).send("Movie ID is required");
    }

    try {
        const updatedUser = await Users.findOneAndUpdate(
            { username: req.params.username },
            { $push: { favoriteMovies: req.params.MovieID } }, // Avoids duplicates
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






/* 
// get all users
app.get('/users', async (req, res) => {
    await Users.find()
      .then((users) => {
        res.status(201).json(users);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('error: ' + err);
      });
}); */

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

/*app.get('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
  
    try {
      if (!req.user || !req.user._id) {
        
        
        const token = req.headers.authorization?.split(' ')[1];
  
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret' );
          
  
          req.user = await Users.findById(decoded._id); // Fetch the user manually
          console.log('Manually Retrieved User:', req.user);
        } catch (err) {
          console.error('JWT Verification Error:', err);
          return res.status(401).json({ message: 'Invalid token' });
        }
      }
  
      if (!req.user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
    
      res.status(200).json(req.user);
    } catch (err) {
      console.error('Error fetching user:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });*/
  
  
  
  

// DELETE

// Remove a movie from the authenticated user's favorites
app.delete('/users/movies/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const userId = req.user._id; // Get user ID from the token
        const movieId = req.params.MovieID;

        console.log(`🔹 Removing movie ${movieId} from user ${userId}`);

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