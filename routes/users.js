const express = require("express");
const router = express.Router();
const User = require("../models/user");
const myFunc = require('../exports/exports'),
    isLoggedIn = myFunc.isLoggedIn;

// ------------
// Users routes
// ------------

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

module.exports = router