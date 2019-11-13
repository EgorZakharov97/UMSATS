const mongoose = require("mongoose");

// Record
const AnnounceSchema = new mongoose.Schema({
    date: Date,
    title: String,
    text: String,
});

module.exports = mongoose.model("Announce", AnnounceSchema);