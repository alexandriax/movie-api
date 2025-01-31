const passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  Models = require('./models.js'),
  passportJWT = require('passport-jwt');

let Users = Models.User,
  JWTStrategy = passportJWT.Strategy,
  ExtractJWT = passportJWT.ExtractJwt;

require('dotenv').config();

passport.use(
    new LocalStrategy(
        {
            usernameField: 'Username',
            passwordField: 'Password',
        },
        async (username, password, callback) => {
            console.log(`${username} ${password}`);
            await Users.findOne({ username: username })
            .then((user) => {
                if (!user) {
                    console.log('incorrect username');
                    return callback(null, false, {
                        message: 'incorrect username or password',
                    });
                }
                if (!user.validatePassword(password)) {
                    console.log('incorect pasword');
                    return callback(null, false, {message: 'incorrect password'});
                }
                console.log('finished');
                return callback(null, user);
            })
            .catch((error) => {
                if (error) {
                    console.log(error);
                    return callback(error);
                }
            })
        }
    )
);

passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.SECRET_KEY
}, async (jwtPayload, callback) => {
    console.log('🔹 Decoded JWT payload:', jwtPayload); // Debugging log

    return await Users.findById(jwtPayload._id)
      .then((user) => {
        console.log('🔹 User found in DB:', user); // Debugging log
        return callback(null, user);
      })
      .catch((error) => {
        console.error('🔹 Error finding user:', error);
        return callback(error);
      });
}));

