const mongoose = require("mongoose");

// Record
const PieceSchema = new mongoose.Schema({
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Item",
    },
    shortID: String,
    available: Boolean,
    records: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"Record",
        }
    ],
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]
});

module.exports = mongoose.model("Piece", PieceSchema);