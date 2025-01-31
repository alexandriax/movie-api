

const jwt = require('jsonwebtoken');
const passport = require('passport');
require('dotenv').config();
require('./passport');
const jwtSecret = process.env.SECRET_KEY;
let generateJWTToken = (user) => {
    return jwt.sign({ _id: user._id || user.id}, jwtSecret, {
        subject: String(user.username),
        expiresIn: '7d',
        algorithm: 'HS256'
    });
};

// POST login

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
                let token = generateJWTToken(user.toJSON());
                return res.json({ userId: user._id, token });
            });
        })(req, res);
    });
}