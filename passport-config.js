const GoogleStrategy = require('passport-google-oauth20').Strategy
const passport = require("passport")
const session = require('express-session')
const User = require('./models/user')




module.exports = {
    setup: function(app){
        // SESSION CONFIGURATION
        app.use(session({  
            secret: process.env.SESSION_SECRET || 'default_session_secret',
            resave: false,
            saveUninitialized: false,
        }));
        app.use(passport.initialize());  
        app.use(passport.session());

        // SERIALIZE USER
        passport.serializeUser((incomingUserData, done) => {

            User.findOne({email: incomingUserData._json.email}, function(err, oldUser){
                if(err){
                    console.log(err)
                } else {
                    if(oldUser == null || oldUser == undefined){
                        let newUser = {
                            username: incomingUserData._json.name,
                            email: incomingUserData._json.email,
                            numTaken: 0,
                            numItemsOnHand: 0,
                            numLateReturns: 0,
                            records: [],
                            cart: []
                        }

                        User.create(newUser, function(err, registeredUser){
                            if(err){
                                console.log(err)
                            } else {
                                let cookieUser = {
                                    _id: registeredUser._id
                                }
                                done(null, cookieUser)
                            }
                        })
                    } else {
                        let cookieUser = {
                            _id: oldUser._id
                        }
                        done(null, cookieUser)
                    }
                }
            })
        })

        // DESERIALIZE USER
        passport.deserializeUser((userDataFromCookie, done) => {
            User.findOne({_id: userDataFromCookie._id}, function(err, user){
                if(err){
                    console.log(err)
                } else {
                    done(null, user);
                }
            })
        });

        // GOOGLE PASSPORT CONFIGURATION
        passport.use(new GoogleStrategy(
            {
                clientID: '639142406836-uldrcmhas2doe4h87j0umjeted02f3r1.apps.googleusercontent.com',
                clientSecret: 'NdALHxQVzFAqQfLmryY4mo0Z',
                callbackURL: 'http://127.0.0.1:3000/login/google/callback',
                scope: ['email', 'profile'],
            },
            // verify function
            (accessToken, refreshToken, profile, cb) => {
                return cb(null, profile);
            },
        ))


    }
}