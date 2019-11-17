const express = require("express");
const router = express.Router();
const Announcement = require("../models/announcement");
const CameBack = require('../models/cameBack');
const User = require('../models/user')
const myFunc = require('../exports/exports'),
    isLoggedIn = myFunc.isLoggedIn,
    isLoggedAdmin = myFunc.isLoggedAdmin,
    ADMIN = myFunc.ADMIN,
    CASHIER = myFunc.CASHIER;

// Show the main page
router.get("/", isLoggedIn, function(req, res){
    Announcement.find({}, function(err, anns){
        if(err){
            console.log(err);
        } else {
            CameBack.find({}).populate('items').exec(function(err, cameBack){
                if(err){
                    console.log(err);
                } else {
                    User.findById(req.user._id)
                    .populate('cart')
                    .populate('records')
                    .exec(function(err, user){
                        if(user._id === CASHIER){
                            res.redirect('/itemManager/cashier')
                        } else {
                            let variables = {
                                anns: anns.reverse(),
                                user: user
                            }
                            if(cameBack != null && cameBack.items != undefined){
                                variables.cameBacks = cameBack[0].items.reverse()
                            } else {
                                variables.cameBacks = undefined
                            }
                                res.render("main", variables);
                        }
                    })
                }
            })
        }
    })
});

// Post new announcement
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

// Show edit announcement page
// router.get("/:id/edit", isLoggedAdmin, function(req, res){
//     Announcement.findById(req.params.id, function(err, ann){
//         if(err){
//             res.redirect("back");
//         } else {
//             res.render("services/editAnnouncement", {title: "Edit announcement", ann: ann});
//         }
//     });
// });

// Update announcement
// router.put("/:id", isLoggedAdmin, function(req, res){
//     Announcement.findByIdAndUpdate(req.params.id, req.body.new, function(err, updated){
//         if(err){
//             console.log(err);
//             res.redirect("back");
//         } else {
//             res.redirect("/main");
//         }
//     })
// });

// delete an announcement
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