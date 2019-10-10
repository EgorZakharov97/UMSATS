let mongoose = require("mongoose");
let cameBackSchema = new mongoose.Schema({
    items: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item"
        }
    ],
    size: Number
});

module.exports = mongoose.model("CameBack", cameBackSchema);