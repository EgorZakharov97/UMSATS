const express = require("express");
const router = express.Router();
const Announcement = require("../models/announcement");
const CameBack = require('../models/cameBack');
const myFunc = require('../exports/exports'),
    isLoggedIn = myFunc.isLoggedIn,
    isLoggedAdmin = myFunc.isLoggedAdmin,
    ADMIN = myFunc.ADMIN,
    CASHIER = myFunc.CASHIER;

// Show the announcements page
router.get("/", function(req, res){
    Announcement.find({}, function(err, anns){
        if(err){
            console.log(err);
        } else {
            CameBack.find({}).populate('items').exec(function(err, found){
                if(err){
                    console.log(err);
                } else {
                    res.render("services/announcements", {title: "Announcements", cameBack: found[0].items.reverse(), anns: anns.reverse()});
                }
            })
        }
    })
});

// Show post new page
router.get("/newAnnouncement", isLoggedAdmin, function(req, res){
    res.render("services/newAnnouncement", {title: "New announcement"});
});

// Post new record
router.post("/", isLoggedAdmin, function(req, res){
    Announcement.create(req.body.ann, function(err, announcement){
            if(err){
                console.log(err);
            } else {
                announcement.date = new Date();
                announcement.save();
                res.redirect("/main");
            }
        }
    )
});

// Show edit record page
router.get("/:id/edit", isLoggedAdmin, function(req, res){
    Announcement.findById(req.params.id, function(err, ann){
        if(err){
            res.redirect("back");
        } else {
            res.render("services/editAnnouncement", {title: "Edit announcement", ann: ann});
        }
    });
});

// Update record
router.put("/:id", isLoggedAdmin, function(req, res){
    Announcement.findByIdAndUpdate(req.params.id, req.body.new, function(err, updated){
        if(err){
            console.log(err);
            res.redirect("back");
        } else {
            res.redirect("/main");
        }
    })
});

// delete a record
router.delete("/:id", isLoggedAdmin, function(req, res){
    Announcement.findByIdAndRemove(req.params.id, function(err){
        if(err){
            console.log(err);
            res.redirect("back");
        }
        res.redirect("/main");
    })
});

module.exports = router;