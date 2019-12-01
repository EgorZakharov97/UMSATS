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

// show current user page
router.get("/user", isLoggedIn, function(req, res){
    User.findById(req.user._id)
        .populate('cart')
        .populate('records')
        .exec(function(err, user){
            if(err){
                console.log(err)
            } else {
                res.render('me', {user: user})
            }
        })
})

// update permissions
router.post('/user/permissions/:id', isLoggedIn, function(req, res){
    User.findById(req.user._id, function(err, sendUser){
        if(err){
            console.log(err)
        } else {
            if(sendUser.permissions.canModifyPermissions){
                User.findById(req.params.id, function(err, userToModify){
                    if(err){
                        console.log(err)
                    } else {
                        if(req.body.canMakePosts){
                            userToModify.permissions.canMakePosts = true
                        } else {
                            userToModify.permissions.canMakePosts = false
                        }

                        if(req.body.canModifyItems){
                            userToModify.permissions.canModifyItems = true
                        } else {
                            userToModify.permissions.canModifyItems = false
                        }

                        if(req.body.canModifyPermissions){
                            userToModify.permissions.canModifyPermissions = true
                        } else {
                            userToModify.permissions.canModifyPermissions = false
                        }

                        userToModify.save()
                        console.log("User " + sendUser.username + " modified permissions of user " + userToModify.username)
                        res.redirect('/user/' + req.params.id)
                    }
                })
            } else {
                res.render('404')
            }
        }
    })
})

// display all users
router.get('/all-users/', isLoggedIn, function(req, res){
    User.findById(req.user._id, function(err, user){
        if(err){
            console.log(err)
        } else {
            User.find({}, function(err, allUsers){
                if(err){
                    console.log(err)
                } else {
                    res.render('show-users', {user: user, users: allUsers})
                }
            })
        }
    })
})

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