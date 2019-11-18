var express = require("express");
var router = express.Router({mergeParams: true});
var Item = require("../models/item");
var Comment = require("../models/comment");
var Piece = require('../models/piece');
const User = require('../models/user');
const myFunc = require('../exports/exports'),
    isLoggedIn = myFunc.isLoggedIn;

//----------------
// COMMENTS ROUTES
//----------------

// post new comment
router.post('/items/:item_id/inventory/:piece_id/comments', isLoggedIn, function(req, res){
    Piece.findById(req.params.piece_id, function(err, piece){
        if(err){
            console.log(err)
        } else {
            Comment.create({}, function(err, comment){
                if(err){
                    console.log(err)
                } else {
                    comment.text = req.body.text
                    comment.author.id = req.user._id
                    comment.author.username = req.user.username
                    comment.date = new Date
                    comment.item = piece.item
                    comment.pieceID = piece.shortID
                    comment.save()

                    piece.comments.push(comment)
                    piece.save()

                    console.log('User ' + req.user.username + ' just posted a comment')
                    res.redirect('/items/' + piece.item + '/inventory/' + piece._id)
                }
            })
        }
    })
})

// delete a comment
router.delete('/items/:item_id/inventory/:piece_id/comments/:comment_id', isLoggedIn, async function(req, res){
    let comment_id = req.params.comment_id
    let comment = await Comment.findById(req.params.comment_id)
    User.findById(req.user._id, function(err, user){
        if(err){
            console.log(err)
        } else {
            if(user.permissions.canModifyItems){
                comment.remove()
                console.log(req.user.username + " has deleted a comment")
            } else if(comment.author.id.toString() == user._id) {
                comment.remove()
                console.log(req.user.username + " has deleted a comment")
            }
        }
    })
    res.redirect('/items/' + req.params.item_id + '/inventory/' + req.params.piece_id)
})

module.exports = router;