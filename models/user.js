var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    numTaken: Number,
    numItemsOnHand: Number,
    numLateReturns: Number,
    permissions: {
        canMakePosts: Boolean,
        canModifyItems: Boolean,
        canModifyPermissions: Boolean,
    },
    records: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Record",
        }
    ],
    cart: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"Record",
        }
    ]
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);