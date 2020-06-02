const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const User = mongoose.model("user");

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
},
    function (email, password, done) {

        //Assume there is a DB module pproviding a global UserModel
        return User.findOne({ email })
            .then(user => {
                if (!user) {
                    return done(null, false, { message: 'Incorrect email or password.' });
                }
                let ret = bcrypt.compareSync(password, user.hashPassword);
                if (!ret) {

                    return done(null, false, { message: 'Password incorrect' });
                }
                return done(null, user, {
                    message: 'Logged In Successfully'
                });
            })
            .catch(err => {
                return done(err);
            });
    }
));
