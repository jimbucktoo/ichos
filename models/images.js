var mongoose = require("mongoose");

var ichosImage = new mongoose.Schema({
    data: Buffer,
    contentType: String
});

module.exports = mongoose.model("image", ichosImage);
