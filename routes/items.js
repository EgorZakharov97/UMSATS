const express = require("express"),
    router = express.Router(),
    Item = require("../models/item"),
    Record = require("../models/record"),
    Comment = require("../models/comment"),
    User = require("../models/user"),
    Piece = require("../models/piece"),
    fs = require('fs'),
    nodemailer = require("nodemailer"),
    flash = require('express-flash-notification'),


const transporter = require('../exports/exports').getEmailTransporter()

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


// var transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: EMAIL,
//         pass: EMAIL_PASS
//     },
//     tls: {
//         rejectUnauthorized: false
//     }

// });

//-------------
// ITEMS ROUTES
//-------------

// show create new item
router.get("/new", isLoggedIn, function(req, res){
    if(req.user.permissions.canModifyItems){
        User.findById(req.user._id).populate("cart").exec(function(err, user){
            if(err){
                console.log(err);
            } else {
                res.render("new-item", {user: user});
            }
        })
    } else {
        res.render('404')
    }
});

// show first 100 items
router.get("/", isLoggedIn, function(req, res){
    if(req.user._id.toString() == CASHIER){
        res.redirect("/itemManager/cashier");
    } else {
        Item.find({}).limit(20).exec(function(err, items){
            if(err){
                console.log(err);
            } else {
                User.findById(req.user._id).populate("cart").exec(async function(err, user){
                    if(err){
                        console.log(err);
                    } else {
                        let count = await Item.collection.countDocuments({})
                        res.render("all-items", {items: items, user: user, numItems: count});
                    }
                })
            }
        });
    }
});

// get items from page
router.get('/page/:num', isLoggedIn, function(req, res){
    const pageNum = req.params.num
    Item.find({}).skip(20*(pageNum-1)).limit(20).exec(function(err, items){
        if(err){
            console.log(err);
        } else {
            User.findById(req.user._id).populate("cart").exec(async function(err, user){
                if(err){
                    console.log(err);
                } else {
                    let count = await Item.collection.countDocuments({})
                    res.render("all-items", {items: items, user: user, numItems: count});
                }
            })
        }
    })
})

// show complete info
router.get("/:id", isLoggedIn, function(req, res) {
    Item.findById(req.params.id)
        .populate("records")
        .populate("comments")
        .populate("storage")
        .exec(function(err, item){
        if(err){
            console.log(err)
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
                        res.render("show-users", {users: users, user: user, numItems: 0});
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
                        res.render("all-items", {items: items, user: user, numItems: 0});
                    }
                })
            }
        });
    }
});

//post new item
router.post("/", isLoggedIn, upload.single('image'), function(req, res){
    if(req.user.permissions.canModifyItems){
        Item.create(req.body.item, async function(err, newItem){
            if(err){
                console.log(err);
            } else {

                // initialising all the fields
                let itemPath = req.file.path.slice(req.file.path.indexOf('\\'), req.file.path.length)

                // // resizing the item
                // let resizeImage = new ResizeImage({
                //     format: itemPath.split('.')[1],
                //     width: 640,
                //     height: 560
                // })

                newItem.image.path = itemPath
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
    } else {
        res.render('404')
    }
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
router.get("/:id/edit", isLoggedIn, function(req, res){
    if(req.user.permissions.canModifyItems){
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
    } else {
        res.render('404')
    }
});

// update item
router.put("/:id", isLoggedIn, function(req, res){
    if(req.user.permissions.canModifyItems){
        Item.findByIdAndUpdate(req.params.id, req.body.item, function(err, updated){
            if(err){
                console.log(err);
                res.redirect("/items");
            } else {
                console.log("Item Updated: " + updated.name);
                res.redirect("/items/" + updated._id);
            }
        })
    } else {
        res.render('404')
    }
});

// destroy item
router.delete("/:id", isLoggedIn, function(req, res){
    if(req.user.permissions.canModifyItems){
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
    } else {
        res.render('404')
    }
});

// create new piece
router.post("/:id/inventory/new", isLoggedIn, function(req, res){
    if(req.user.permissions.canModifyItems){
        Item.findById(req.params.id, function(err, item){
            if(err){
                console.log(err)
            } else if(!item.disposable) {
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
            } else {
                res.send("This is a disposable item, you cannot create pieces of it!")
            }
        })
    } else {
        res.render('404')
    }
})

// delete piece
router.delete("/:id/inventory/:piece/delete", isLoggedIn, function(req, res){
    if(req.user.permissions.canModifyItems){
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
    } else {
        res.redirect('404')
    }
});

module.exports = router;