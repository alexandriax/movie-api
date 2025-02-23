const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
/**
 * Mongoose schema for movies.
 * @typedef {Object} Movie
 * @property {string} title - The movie title (required).
 * @property {string} description - A short description of the movie (required).
 * @property {string} id - Unique identifier for the movie (required).
 * @property {Object} genre - The genre of the movie.
 * @property {string} genre.name - The name of the genre.
 * @property {string} genre.description - A description of the genre.
 * @property {Object} director - The director of the movie.
 * @property {string} director.name - The name of the director.
 * @property {string} director.bio - A short biography of the director.
 * @property {string} image - URL to the movie's image.
 * @property {boolean} featured - Indicates whether the movie is featured.
 */
let movieSchema = mongoose.Schema({
    title: {type: String, required: true},
    description: {type: String, required: true},
    id: {type: String, required: true},
    genre: {
        name: String,
        description: String
    },
    director: {
        name: String,
        bio: String
    },
    image: String,
    featured: Boolean
});

/**
 * Mongoose schema for users.
 * @typedef {Object} User
 * @property {string} username - The username (required).
 * @property {string} password - The user's hashed password (required).
 * @property {string} email - The user's email (required).
 * @property {Date} birthday - The user's birthday.
 * @property {Array<ObjectId>} favoriteMovies - List of the user's favorite movies (references Movie schema).
 */
let userSchema = mongoose.Schema({
    username: {type: String, required: true},
    //id: {type: String, required: true},
    password: {type: String, required: true},
    email: {type: String, required: true},
    birthday: Date,
    favoriteMovies: [{type: mongoose.Schema.Types.ObjectId, ref: 'Movie'}]
});

userSchema.statics.hashPassword = (password) => {
    return bcrypt.hashSync(password, 10);
};

userSchema.methods.validatePassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

let Movie = mongoose.model('Movie', movieSchema);
let User = mongoose.model('User', userSchema);

module.exports.Movie = Movie;
module.exports.User = User;