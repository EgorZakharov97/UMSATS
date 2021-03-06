const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Record = require("../models/record")
const myFunc = require('../exports/exports'),
    isLoggedIn = myFunc.isLoggedIn;

// ------------
// Users routes
// ------------

// show current user page
router.get("/user", isLoggedIn, function(req, res){
    User.findById(req.user._id)
        .populate('cart')
        .exec(async function(err, user){
            if(err){
                console.log(err)
            } else {
                let onHand = await Record.find({returned: false, "user.id": user._id}).catch(e =>{console.log(e)})
                let returned = await Record.find({returned: true, "user.id": user._id}).catch(e =>{console.log(e)})
                res.render('me', {user: user, onHand: onHand, returned: returned})
            }
        })
})

// display all users
router.get('/all-users/', isLoggedIn, function(req, res){
    User.findById(req.user._id).populate('cart').exec(function(err, user){
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

// shows any user page
router.get(
    "/user/:id",
    isLoggedIn,
    function(req, res){
        User.findById(req.user._id).populate('cart').exec(function(err, currUser){
            if(err){
                console.log(err)
            } else {
                User.findById(req.params.id, async function(err, foundUser){
                    if(err){
                        console.log(err)
                    } else {
                        let onHand = await Record.find({returned: false, "user.id": foundUser._id}).catch(e =>{console.log(e)})
                        let returned = await Record.find({returned: true, "user.id": foundUser._id}).catch(e =>{console.log(e)})
                        res.render('user', {user: currUser, display: foundUser, onHand: onHand, returned: returned})
                    }
                })
            }
        })
    }
);

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

module.exports = router