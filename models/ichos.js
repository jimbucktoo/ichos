var mongoose = require("mongoose");

var ichosSchema = new mongoose.Schema({
	title: String,
	content: String,
	image: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "image"
	}]
});

module.exports = mongoose.model("object", ichosSchema);

