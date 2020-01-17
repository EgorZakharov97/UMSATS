const express = require("express");
const router = express.Router();
const User = require("../models/user");
const passport = require("passport");
const flash = require('express-flash-notification');
const Cookies = require('cookie-parser')
const myFunc = require('../exports/exports'),
    isLoggedIn = myFunc.isLoggedIn;


//----------------------
// AUTHENTICATION ROUTES
//----------------------

// show login page
router.get("/login", function(req, res) {
    res.render("login");
});

// login a user
router.get('/login/google/callback',
    passport.authenticate('google',
        {successRedirect: '/main', failureRedirect: '/login', session: true}
    )
)

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

module.exports = router;