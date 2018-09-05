var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var ichosUser = new mongoose.Schema({
    email: String,
    username: String,
    password: String,
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "object"
    }]
});

ichosUser.plugin(passportLocalMongoose);

module.exports = mongoose.model("user", ichosUser);
