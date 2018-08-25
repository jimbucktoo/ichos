var mongoose = require("mongoose");

var ichosUser = new mongoose.Schema({
	email: String,
	username: String,
	posts: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "object"
	}]
});

module.exports = mongoose.model("user", ichosUser);