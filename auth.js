const jwtSecret = 'your_jwt_secret';

const jwt = require('jsonwebtoken');
const passport = require('passport');

require('./passport');

/**
 * Generates a JWT token for an authenticated user.
 * @function generateJWTToken
 * @param {Object} user - The user object.
 * @param {string} user._id - The user's unique ID.
 * @returns {string} JWT token signed with the user's ID.
 */
let generateJWTToken = (user) => {
    console.log('Generating JWT for:', user._id); 
    return jwt.sign({ userId: user._id || user.id}, jwtSecret || process.env.JWT_SECRET, {
        subject: String(user.username),
        expiresIn: '7d',
        algorithm: 'HS256'
    });
};

// POST login

/**
 * Sets up authentication routes.
 * @module auth
 * @param {Object} router - Express router object.
 */
module.exports = (router) => {
    
    router.post('/login', (req, res) => {
        passport.authenticate('local', {session: false}, (error, user, info) => {
            if (error || !user) {
                return res.status(400).json({
                    message: 'something is broken',
                    user: user
                });
            }
            req.login(user, {session: false}, (error) => {
                if(error) {
                    res.send(error);
                }
                let token = jwt.sign(
                    { userId: user._id, username: user.username },
                    process.env.JWT_SECRET || 'your_jwt_secret', //should prob change this lol
                    { expiresIn: '7d' });
                console.log("Sending Login Response:", { token, user: { _id: user._id, username: user.username } });
                return res.json({
                    token: token,
                    user: {
                        _id: user._id,
                        username: user.username 
                    }
                });
            });
        })(req, res);
    });
}