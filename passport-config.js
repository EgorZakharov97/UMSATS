const localStrategy = require('passport-local').Strategy
const User = require('./models/user')

async function authenticateUser(email, password, done) {
    const user = await User.findOne({email: email})
    if(user == null){
        return done(null, false, {message: 'No user with that email'})
    } else if(user.password == password){
        return done(null, user)
    } else {
        return done(null, false, {message: 'Password is incorrect'})
    }
}

function initializePassport(passport){
    passport.use(new localStrategy({ usernameField: 'email' }),authenticateUser)
    passport.serializeUser((user, done) => {})
    passport.deserializeUser((id, done) => {})

}

module.exports = initializePassport