const mongoose = require("mongoose");

// Record
const RecordSchema = new mongoose.Schema({
    user: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String,
        email: String,
        picture: String
    },
    itemInfo: {
        name: String,
        image: String,
        shortID: String,
        quantityTaken: Number,
        disposable: Boolean,
    },
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item"
    },
    piece: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Piece"
    },
    returned: Boolean,
    dateTaken: Date,
    dateReturn: Date
});

module.exports = mongoose.model("Record", RecordSchema);