const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    numTaken: Number,
    numItemsOnHand: Number,
    numLateReturns: Number,
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

module.exports = mongoose.model("User", UserSchema);