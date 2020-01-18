const GoogleStrategy = require('passport-google-oauth20').Strategy
const passport = require("passport")
const session = require('express-session')
const User = require('./models/user')
const transporter = require('./exports/exports').getEmailTransporter()

function sendWelcomeEmail(user){
    let emailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: 'UMSATS Registration Confirmation',
        html: "<img src='cid:unique@kreata.ee'/><p>Hello, " + user.username + "</p><p>You have just registered on UMSATS Inventory Platform. If you didn't meen to do that, someone is probably using your account for their insidious purposes.</p><p>Please, do not respond this email as we are not responsible for anything at all))))</p>",
        attachments: [
            {
                filename: 'img.img',
                path: './public/images/UMSATS-banner.png',
                cid: 'unique@kreata.ee'
            }
        ]
    }

    transporter.sendMail(emailOptions, function(err, info){
        if(err){
            console.log(err)
        } else {
            console.log("Welcome email was sent to " + user.username)
        }
    })
}

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
                            picture: incomingUserData._json.picture,
                            numTaken: 0,
                            numItemsOnHand: 0,
                            numLateReturns: 0,
                            permissions: {
                                canMakePosts: false,
                                canModifyItems: false,
                                canModifyPermissions: false,
                            },
                            records: [],
                            cart: []
                        }

                        User.create(newUser, function(err, registeredUser){
                            if(err){
                                console.log(err)
                            } else {
                                sendWelcomeEmail(newUser)
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
                callbackURL: 'http://mang0g0rilla.tech/login/google/callback',
                scope: ['email', 'profile'],
            },
            // verify function
            (accessToken, refreshToken, profile, cb) => {
                return cb(null, profile);
            },
        ))


    }
}
