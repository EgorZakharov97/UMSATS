var express = require("express");
var router = express.Router({mergeParams: true});
var Item = require("../models/item");
var Comment = require("../models/comment");
const myFunc = require('../exports/exports'),
    isLoggedIn = myFunc.isLoggedIn,
    isLoggedAdmin = myFunc.isLoggedAdmin,
    checkCommentOwnership = myFunc.checkCommentOwnership,
    ADMIN = myFunc.ADMIN;

//----------------
// COMMENTS ROUTES
//----------------

// show new comment page
router.get("/new", isLoggedIn, function(req, res) {
    Item.findById(req.params.id, function(err, item){
        if(err){
            console.log(err);
        } else {
            res.render("comments/new", {title: "New comment", item: item});
        }
    })
});

// post new comment
router.post("/", isLoggedIn, function(req, res){
    Item.findById(req.params.id, function(err, item) {
        if(err){
            console.log(err);
            res.redirect("/items");
        } else {
            Comment.create(req.body.comment, function(err, comment){
                if(err){
                    console.log(err);
                } else {
                    // constructing the comment
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save();
                    // saving the comment
                    item.comments.push(comment);
                    item.save();
                    
                    res.redirect('/items/' + item._id);
                }
            })
        }
    });
});

//------------
// EDIT ROUTES
//------------

// show edit page
router.get("/:comment_id/edit", checkCommentOwnership, function(req, res){
    Comment.findById(req.params.comment_id, function(err, comment){
        if(err){
            res.redirect("back");
        } else {
            res.render("comments/edit", {title: "Edit comment", item_id: req.params.id, comment: comment});
        }
    });
});

// update comment
router.put("/:comment_id", checkCommentOwnership, function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updated){
        if(err){
            console.log(err);
            res.redirect("back");
        } else {
            res.redirect("/items/" + req.params.id);
        }
    })
});

// delete a comment
router.delete("/:comment_id", checkCommentOwnership, function(req, res){
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err){
            console.log(err);
        }
        res.redirect("/items/" + req.params.id);
    })
});

module.exports = router;