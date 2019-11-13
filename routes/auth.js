const express = require("express");
const router = express.Router();
const User = require("../models/user");
const passport = require("passport");
const flash = require('express-flash-notification');
const myFunc = require('../exports/exports'),
    isLoggedIn = myFunc.isLoggedIn,
    ADMIN = myFunc.ADMIN,
    CASHIER = myFunc.CASHIER;


//----------------------
// AUTHENTICATION ROUTES
//----------------------

// show register page
router.get("/register", function(req, res) {
    res.render("register");
});

// register a new user
router.post("/register", function(req, res){
    // create and save a new user in the database without a password. Pass password as an argument, so it will be hashed
    User.register(new User({username: req.body.username}), req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.redirect('/register');
        } else {
            user.email = req.body.email;
            user.numTaken = 0;
            user.numLateReturns = 0;
            user.numItemsOnHand = 0;
            user.save();
        }
        // this will log the user in
        passport.authenticate("local")(req, res, function(){
            console.log("Registered: " + req.user.username + " (" + req.user._id + ")");
            res.redirect("/");
        });
    });
});

// show login page
router.get("/login", function(req, res) {
    res.render("login");
});

// login a user
router.post(
        "/login",
        passport.authenticate(
            "local",
            {
                successRedirect: "/main",
                failureRedirect: "/login"
            }
        ),
        function(req, res){
            console.log("Logged in: " + req.user.username + " (" + req.user._id + ")");
        }
    );

// logout a user
router.get(
    "/logout",
    function(req, res) {
        req.cookies['username'] = 'null';
        req.cookies['pwd'] = 'null';
        req.logout();
        res.redirect("/login");
    }
);

// shows any user page
router.get(
    "/user/:id",
    isLoggedIn,
    function(req, res){
        User.findById(req.user._id).populate('cart').exec(function(err, currUser){
            if(err){
                console.log(err)
            } else {
                User.findById(req.params.id).populate('records').exec(function(err, foundUser){
                    if(err){
                        console.log(err)
                    } else {
                        res.render('user', {user: currUser, display: foundUser})
                    }
                })
            }
        })
    }
);

module.exports = router;