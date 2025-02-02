const passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  Models = require('./models.js'),
  passportJWT = require('passport-jwt');

let Users = Models.User,
  JWTStrategy = passportJWT.Strategy,
  ExtractJWT = passportJWT.ExtractJwt;

passport.use(
    new LocalStrategy(
        {
            usernameField: 'username',
            passwordField: 'password',
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

/*passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: 'your_jwt_secret'
}, async (jwtPayload, callback) => {
    return await Users.findById(jwtPayload._id)
      .then((user) => {
        //console.log('🔹 User found in DB:', user);
        console.log('🔹 Decoded JWT:', jwtPayload);  // Debugging log
        return callback(null, user);
      })
      .catch((error) => {
        console.error('🔹 Error finding user:', error);
        return callback(error);
      });
}));
*/

passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'your_jwt_secret' 
}, async (jwtPayload, done) => {
    console.log('Decoded JWT:', jwtPayload);  // Debugging log

    try {
        const user = await Users.findById(jwtPayload.userId);
        if (!user) {
            console.log('User not found in DB');
            return done(null, false);
        }
        console.log('User authenticated:', user.username);
        return done(null, user);
    } catch (error) {
        console.error('JWT Verification Error:', error);
        return done(error, false);
    }
}));
