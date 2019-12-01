const Item = require('../models/item')
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'G', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
const nodemailer = require('../node_modules/nodemailer')
const CASHIER = process.env.CASHIER

module.exports = {

    getEmailTransporter: function(){
        return nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        })
    },

    //-----------
    // MIDDLEWARE
    //-----------

    isLoggedIn: function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
    },

    isLoggedCashier: function(req, res, next) {
        if(req.isAuthenticated()){
            if(req.user._id == CASHIER){
                return next();
            }
        }
        res.redirect("/login");
    },

    createShortID: function (){
        let res = "";
        for(let i = 0; i < 6; i++){
            res += LETTERS[Math.floor(Math.random()* 25)];
        }
        return res;
    },

    spawn: function(){
        for(let i = 0; i < 200; i++){
            var item = {
                name: 'item',
                category: 'category1',
                location: 'sample location',
                description: 'sample description',
                image: {
                    path: '\\items-pics\\Mother Board.png'
                },
                disposable: true,
                available: true,
                quantityAvailable: 100,
                statistics: {
                    visitsThisMonth: 25,
                    takenThisMonth: 7,
                    yearLog: {
                        visits: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                        wasTaken: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
                    }
                }
            }

            item.name += i
            item.description += i
            Item.create(item, function(err, item){
                if(err){
                    console.log(err)
                } else {
                    console.log(item.name + " was created!")
                }
            })
        }
    }
}

