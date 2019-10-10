const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Item = require("../models/item");
const Record = require("../models/record");
const CameBack = require("../models/cameBack");
const Piece = require("../models/piece");
const passport = require("passport");
const flash = require('express-flash-notification');
const myFunc = require('../exports/exports'),
    isLoggedIn = myFunc.isLoggedIn,
    isLoggedCashier = myFunc.isLoggedCashier;


//----------------------
// SHOPPER ROUTES
//----------------------

// add piece to cart
router.post("/addOneToCart/:id", isLoggedIn, function(req, res){
    User.findById(req.user._id).populate('cart').exec(function(err, user){
        if(err){
            console.log(err);
        } else {
            let cart = user.cart;
            Piece.findById(req.params.id).populate("item").exec( function(err, piece){
                if(err) {
                    console.log(err)
                } else {

                    let contains = false;
                    for(let i = 0; i < cart.length; i++) {
                        if (cart[i].itemInfo.shortID == piece.shortID) {
                            contains = true;
                            break;
                        }
                    }

                    if(!contains){
                        Record.create({}, function(err, record){
                            if(err){
                                console.log(err)
                            } else {
                                // user
                                record.user.id = user._id;
                                record.user.username = user.username;
                                record.user.email = user.email;
                                // item
                                record.item = piece.item;
                                record.piece = piece;
                                record.itemInfo.shortID = piece.shortID;
                                record.itemInfo.name = piece.item.name;
                                record.itemInfo.image = piece.item.image.path;
                                record.itemInfo.disposable = piece.item.disposable;
                                record.itemInfo.quantityTaken = 1;
                                record.save();

                                user.cart.push(record);
                                user.save();
                            }
                        });
                    }
                }
            });
        }
    });
    res.redirect("/items");
});

// add disposable to cart
router.post("/addToCart/:id", isLoggedIn, function(req, res){
    User.findById(req.user._id, function(err, user){
        if(err){
            console.log(err);
        } else {
            Item.findById(req.params.id, function(err, item){
                if(err) {
                    console.log(err)
                } else {
                    Record.create({}, function(err, record){
                        if(err){
                            console.log(err)
                        } else {
                            // user
                            record.user.id = user._id;
                            record.user.username = user.username;
                            record.user.email = user.email;
                            // item
                            record.item = item;
                            record.itemInfo.name = item.name;
                            record.itemInfo.image = item.image.path;
                            record.itemInfo.disposable = item.disposable;
                            record.itemInfo.quantityTaken = req.body.quantity;
                            record.save();

                            user.cart.push(record);
                            user.save();
                        }
                    });
                }
            });
        }
    });
    res.redirect("/items");
});

// delete item from cart
router.post('/deleteFromCart', isLoggedIn, function(req, res){
    User.findById(req.user._id, function(err, user){
        if(err){
            console.log(err);
        } else {
            let cart = user.cart;
            let index = cart.indexOf(req.body.toDelete);
            Record.findByIdAndDelete(req.body.toDelete, function(err){
                if(err){
                    console.log(err)
                } else {
                    cart.splice(index, 1);
                    user.markModified('cart');
                    user.save();
                    console.log("Item was removed from cart of " + user.username);
                }
            });
        }
    });
    res.redirect("/items");
});

// take an item
router.post('/take', isLoggedIn, async function(req, res){

    let takeDisposable = async function(user, record){
         let item = record.item;
         record.dateTaken = new Date();
         record.save();

         item.quantityAvailable -= record.itemInfo.quantityTaken;
         item.statistics.takenThisMonth++;
         item.records.push(record);

         if(item.quantityAvailable <= 0){
             item.available = false;
         }
         item.save();

         user.records.push(record);
         user.numTaken++;
    };

    let takeReusable = async function(record, dateReturn){
        let item = record.item;
        let piece = record.piece;
        let now = new Date();

        if(dateReturn === ""){
            console.log("Error! Return date field is empty for " + item.name);
        } else if(piece.available) {

            // updating an item
            record.dateTaken = now;
            record.returned = false;
            record.dateReturn = new Date(dateReturn);
            record.save();

            item.records.push(record);
            piece.records.push(record);
            piece.available = false;
            piece.save();
            item.statistics.takenThisMonth++;
            item.quantityAvailable--;

            if(item.quantityAvailable <= 0){
                item.available = false;
            }
            item.save();

            user.numItemsOnHand++;
            user.numTaken++;
            user.records.push(record);
            console.log(user.username + " took " + record.item.name + " with ID: " + record.itemInfo.shortID);
        } else {
            console.log("Item " + item.name + " (" + piece.shortID + ") is unavailable!");
        }
    };

    let user = await User.findById(req.user._id).populate('cart');
    let cart = user.cart;
    let dates = req.body.dateReturn;

    for(let i = 0; i < cart.length; i++){
        let record = await Record.findById(cart[i]._id).populate('piece').populate('item');

        if(record.itemInfo.disposable){
            await takeDisposable(user, record);
            console.log(user.username + " took " + record.itemInfo.quantityTaken + " of " + record.itemInfo.name);
        } else {
            let dateReturn = dates[record.itemInfo.shortID];
            await takeReusable(record, dateReturn);
        }
    }
    user.cart = [];
    user.save();
    res.redirect('/items');
});

// return item
router.post("/return/:id", isLoggedCashier, async function(req, res) {
    let piece = await Piece.findById(req.params.id).populate('item').populate('records');
    let item = piece.item;
    let record = piece.records[piece.records.length-1];
    let now = new Date();

    let user = await User.findById(record.user.id);

    if(record.dateReturn < now){
        user.numLateReturns++;
        console.log("Late return registered for " + user.username);
    }
    user.numItemsOnHand--;
    user.save();

    record.dateReturn = now;
    record.returned = true;
    record.save();

    piece.available = true;
    piece.save();
    item.quantityAvailable++;

    if(item.available == false){
        item.available = true;
        CameBack.find({}, function(err, found){
            let array = found[0].items;
            if(found[0].size >= 5){
                array.pop();
            } else {
                found[0].size++;
            }
            array.unshift(item);
            found[0].save();
        })
    }

    item.markModified('storage');
    item.save();

    console.log(user.username + " has returned " + item.name + " (" + record.itemInfo.shortID + ")");

    res.redirect("/itemManager/cashier");
});

// show all unreturned items for cashier
router.get("/cashier", isLoggedCashier, async function(req, res){
    let records = await Record.find({returned: false});
    res.render("Items/cashierr", {title: "Cashier page!", records: records});
});

module.exports = router;