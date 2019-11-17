const mongoose = require("mongoose");

// Item
let ItemSchema = new mongoose.Schema({
    name: String,
    category: String,
    location: String,
    description: String,
    image: {path: String, mimeType: String},
    disposable: Boolean,
    available: Boolean,
    quantityAvailable: Number,
    statistics: {
        visitsThisMonth: Number,
        takenThisMonth: Number,
        yearLog: {
            visits: [],
            wasTaken: []
        }
    },
    storage: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Piece",
            }
    ],
    records: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Record",
        }
    ]

});

module.exports = mongoose.model("Item", ItemSchema);