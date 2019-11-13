const Comment = require("../models/comment");
const ADMIN = "5dc5eebaa723f30650ffd162";
const CASHIER = "5dcb9b45af6ebf1948864e20";
const EMAIL = "***";
const EMAIL_PASS = "***";
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'G', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

module.exports = {

    // EMAILS
    EMAIL: EMAIL,
    EMAIL_PASS: EMAIL_PASS,

    // superuser verification
    ADMIN: ADMIN,
    CASHIER: CASHIER,

    //-----------
    // MIDDLEWARE
    //-----------

    isLoggedIn: function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
    },

    isLoggedAdmin: function(req, res, next) {
        if(req.isAuthenticated()){
            if(req.user._id == ADMIN){
                return next();
            }
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

    checkCommentOwnership: function (req, res, next){
        if(req.isAuthenticated()){
            Comment.findById(req.params.comment_id, function(err, comment) {
                if(err){
                    console.log(err);
                    res.redirect("back");
                } else {
                    if(
                        comment.author.id.equals(req.user._id) ||
                        req.user._id == ADMIN
                    ){
                        next();
                    } else {
                        res.redirect("back");
                    }
                }
            });
        } else {
            res.redirect("/login");
        }
    },
    createShortID: function (){
        let res = "";
        for(let i = 0; i < 6; i++){
            res += LETTERS[Math.floor(Math.random()* 25)];
        }
        return res;
    }
}

