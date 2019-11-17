const express = require("express"),
    router = express.Router(),
    Item = require("../models/item"),
    Record = require("../models/record"),
    Comment = require("../models/comment"),
    User = require("../models/user"),
    Piece = require("../models/piece"),
    fs = require('fs'),
    nodemailer = require("nodemailer"),
    flash = require('express-flash-notification');

// storage
const multer = require("multer"),
    fileFilter = function(req, file, cb){
        if(file.mimeType === 'image/jpeg' || file.mimeType === 'image/png'){
            cb(null, true);
        } else {
            cb(null, false);
            console.log('File rejected');
        }
    },
    storage = multer.diskStorage({
        destination: function(req, res, cb){
            cb(null, './public/items-pics');
        },
        filename: function(req, file, cb){
            cb(null, req.body.item.name + '.' + file.originalname.split('.')[1]);
        }
    }),
    upload = multer({
        storage: storage,
        limits: {
            fileSize: 1024 * 1024 * 5
        }
    });

// middleware and constants
const myFunc = require('../exports/exports'),
    isLoggedIn = myFunc.isLoggedIn,
    isLoggedAdmin = myFunc.isLoggedAdmin,
    createShortID = myFunc.createShortID,
    EMAIL = myFunc.EMAIL,
    EMAIL_PASS = myFunc.EMAIL_PASS,
    CASHIER = myFunc.CASHIER;


var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL,
        pass: EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }

});

//-------------
// ITEMS ROUTES
//-------------

// show create new item for admin
router.get("/new", isLoggedAdmin, function(req, res){
    User.findById(req.user._id).populate("cart").exec(function(err, user){
        if(err){
            console.log(err);
        } else {
            res.render("new-item", {user: user});
        }
    })
});

// show all items
router.get("/", isLoggedIn, function(req, res){
    if(req.user._id == CASHIER){
        res.redirect("/itemManager/cashier");
    } else {
        Item.find({}, function(err, items){
            if(err){
                console.log(err);
            } else {
                User.findById(req.user._id).populate("cart").exec(function(err, user){
                    if(err){
                        console.log(err);
                    } else {
                        res.render("all-items", {items: items, user: user});
                    }
                })
            }
        });
    }
});

// show complete info
router.get("/:id", isLoggedIn, function(req, res) {
    Item.findById(req.params.id)
        .populate("records")
        .populate("comments")
        .populate("storage")
        .exec(function(err, item){
        if(err){
            res.redirect("/items");
        } else {
            if(item != undefined){
                // increment the number of visits
                item.statistics.visitsThisMonth++;
                item.save();

                User.findById(req.user._id).populate('cart').exec(function(err, user){
                    if(err){
                        console.log(err)
                    } else {
                        Comment.find({item: item._id}, function(err, comments){
                            if(err){
                                console.log(err)
                            } else {
                                res.render("item", {item: item, user: user, comments: comments});
                            }
                        })
                    }
                })
            } else {
                res.redirect("/items");
            }

        }
    });
});

// search route (for users as well)
router.post("/search", isLoggedIn, function(req, res){
    let superString = ".*" + req.body.searchKey + ".*";

    if(req.body.target == "users"){
        User.find(
            {
                "$or": [
                    {username: {$regex: superString, $options: "i"}},
                    {email: {$regex: superString, $options: "i"}}
                ]
            }
        , function(err, users){
            if(err){
                console.log(err)
            } else {
                User.findById(req.user._id).populate("cart").exec(function(err, user){
                    if(err){
                        console.log(err)
                    } else {
                        res.render("show-users", {users: users, user: user});
                    }
                })
            }
        })
    } else {

        Item.find(
            {
                "$or": [
                    {name: {$regex: superString, $options: "i"}},
                    {category: {$regex: superString, $options: "i"}},
                    {description: {$regex: superString, $options: "i"}}
                ]
            }
        , function(err, items){
            if(err){
                console.log(err);
            } else {
                User.findById(req.user._id).populate("cart").exec(function(err, user){
                    if(err){
                        console.log(err);
                    } else {
                        res.render("all-items", {items: items, user: user});
                    }
                })
            }
        });
    }
});

//post new item
router.post("/", isLoggedAdmin, upload.single('image'), function(req, res){
    Item.create(req.body.item, async function(err, newItem){
        if(err){
            console.log(err);
        } else {
            // initialising all the fields
            newItem.image.path = req.file.path.slice(req.file.path.indexOf('\\'), req.file.path.length)
            newItem.image.contentType = req.file.mimeType;

            // initialising storage fields
            newItem.quantityAvailable = req.body.quantity;
            newItem.disposable = req.body.disposable;
            newItem.available = true;

            // initialising statistics fields
            newItem.statistics.visitsThisMonth = 0;
            newItem.statistics.takenThisMonth = 0;

            for(let i = 0; i < 12; i++){
                newItem.statistics.yearLog.visits.push(0);
                newItem.statistics.yearLog.wasTaken.push(0);
            }

            if(!(req.body.disposable == "true")){
                for(let q = req.body.quantity; q > 0; q--){
                    let newPiece = await Piece.create({
                        item: newItem,
                        shortID: createShortID(),
                        available: true
                    });
                    newItem.storage.push(newPiece);
                }
            }

            newItem.save();
            console.log("Item created: " + newItem.name);
        }
    });
    res.redirect("/items");
});


//--------------
// PIECES ROUTES
//--------------

// show piece page
router.get("/:id/inventory/:pieceId", isLoggedIn, function(req, res){
    Piece.findById(req.params.pieceId)
    .populate("item")
    .populate("records")
    .populate("comments")
    .exec( function(err, piece){
        if(err){
            console.log(err);
        } else {
            User.findById(req.user._id).populate('cart').exec(function(err, user){
                if(err){
                    console.log(err)
                } else {
                    res.render("piece", {piece: piece, user: user});
                }
            })
        }

    })
});

//------------
// EDIT ROUTES
//------------

// show edit page
router.get("/:id/edit", isLoggedAdmin, function(req, res){
    Item.findById(req.params.id, function(err, item){
        if(err){
            console.log(err);
        } else {
            User.findById(req.user._id, function(err, user){
                if(err){
                    console.log(err)
                } else {
                    res.render("edit-item", {item: item, user: user});
                }
            })
        }
    });
});

// update item
router.put("/:id", isLoggedAdmin, function(req, res){

    console.log(req.body);
    Item.findByIdAndUpdate(req.params.id, req.body.item, function(err, updated){
        if(err){
            console.log(err);
            res.redirect("/items");
        } else {
            console.log("Item Updated: " + updated.name);
            res.redirect("/items/" + updated._id);
        }
    })
});

// destroy item
router.delete("/:id", isLoggedAdmin, function(req, res){
    Item.findById(req.params.id, async function(err, toRemove){
        if(err){
            console.log(err);
        } else {
            let nameRemoved = toRemove.name;

            if(fs.existsSync(toRemove.image.path)){
                fs.unlinkSync(toRemove.image.path);
            }
            
            for(let i = 0; i < toRemove.storage.length; i++){
                await Piece.findByIdAndRemove(toRemove.storage[i]);
            }
            for(let i = 0; i < toRemove.comments.length; i++){
                await Comment.findByIdAndRemove(toRemove.comments[i]);
            }
            toRemove.remove();
            console.log("Item deleted: " + nameRemoved);
        }
        res.redirect("/items");
    });
});

// create new piece
router.post("/:id/inventory/new", isLoggedAdmin, function(req, res){
    Item.findById(req.params.id, function(err, item){
        if(err){
            console.log(err)
        } else {
            Piece.create(
                {
                    item: item,
                    shortID: createShortID(),
                    available: true
                }, function(err, piece){
                    if(err){
                        console.log(err)
                    } else {
                        item.storage.push(piece)
                        item.quantityAvailable++
                        item.save()
                        console.log("Piece created for item: " + item.name + ", ID: " + piece.shortID)
                        res.redirect('/items/' + item._id)
                    }
                }
            )
        }
    })
})

// delete piece
router.delete("/:id/inventory/:piece/delete", isLoggedAdmin, function(req, res){
    Piece.findById(req.params.piece, function(err, piece){
        if(err){
            console.log(err);
        } else {
            if(piece.available){
                Item.findById(req.params.id, function(err, item){
                    if(err){
                        console.log(err);
                    } else {
                        item.quantityAvailable--;
                        item.save();
                    }
                })
            }
            piece.remove();
        }
    });
    res.redirect("/items/" + req.params.id);
});

function sendEmail(param, record){
    var subject;
    var text;
    switch (param) {
        case 'take':
           subject = 'You\'e taken ' + record.item.name + 'from UMSATS';
           text = 'This is the automatically generated email send as a confirmation that you, ' + record.user.username + ' have taken'
                + record.item.name + 'form UMSATS storage.' + '\nThis item is expected to be returned ' + record.dateReturn
                + '. Don\'t forget to bring it back!';
           break;
        default:
            console.log("unknown parameter. Could not send email");
            break;
    }

    if(subject != null && text != null){
        var mailOptions = {
            from: EMAIL,
            to: record.user.email,
            subject: subject,
            text: text
        }
    };

    transporter.sendMail(mailOptions, function(err, info){
        if(err){
            console.log(err);
        } else {
            console.log('Email confirmation was sent to: ' + record.user.username);
        }
    });
}

module.exports = router;