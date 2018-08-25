//APP.JS

//APP INITIALIZATION
var express = require("express");
var app = express();
var fs = require("file-system");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var methodOverride = require("method-override");
var multer = require('multer');
var upload = multer({dest: "uploads/"});

//APP CONFIGURATION
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost:27017/ichosdemo", { useNewUrlParser: true });
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static("public"));
app.use(methodOverride("_method"));

//MONGOOSE MODEL CONFIGURATION
/*
var ichosSchema = new mongoose.Schema({
	title: String,
	content: String
});

var Ichos = mongoose.model("object", ichosSchema);

var ichosUser = new mongoose.Schema({
	email: String,
	username: String,
	posts: [ichosSchema]
});

var User = mongoose.model("user", ichosUser);

var newUser = new User({
	email: "jamesliang.g@gmail.com",
	username: "jimbucktoo",
});

newUser.posts.push({
	title: "How to make data associations.",
	content: "Like this."
});

newUser.save(function(err, user){
	if (err) {
		console.log(err);
	} else {
		console.log(user);
	}
});

User.findOne({username: "jimbucktoo"}, function(err, user){
	if (err) {
		console.log(err);
	} else {
		user.posts.push({
			title: "How to make many data associations.",
			content: "Like this."
		});
		user.save(function(err, user){
			if (err) {
				console.log(err);
			} else {
				console.log(user);
			}
		})
	}
});


Ichos.create({
	title: "How to make data references again.",
	content: "Like this again."
},function(err, ichos){
	if (err) {
		console.log(err);
	} else {
		User.findOne({username: "jimbucktoo"}, function(err, foundUser){
			if (err) {
				console.log(err);
			} else {
				foundUser.posts.push(ichos);
				foundUser.save(function(err, data){
					if (err) {
						console.log(err);
					} else {
						console.log(data);
					}
				})
			}
		})
	}
});

*/

var Image = require('./models/images.js');

var Ichos = require('./models/ichos.js');

var User = require('./models/users.js');

var jemail = "jamesliang.g@gmail.com";
var jusername = "jimbucktoo";


//RESTful ROUTES

//INDEX ROUTE
app.get("/", function(req,res){
	res.send("ichos");
});

app.get("/ichos", function(req,res){
	Ichos.find({}, { _id: 1, title: 1, content: 1, image: 1 }, function(err, mongoObject){
		if (err) {
			console.log("Object search: Object not found.");
			res.render("index.ejs");
		} else {
			var idArray = [];
			var titleArray = [];
			var contentArray = [];
			var imageArray = [];
			var image = mongoObject;
			mongoObject.forEach(function(element){
			idArray.push(element._id);
			titleArray.push(element.title);
			contentArray.push(element.content);
			imageArray.push(element.image);
			});
			res.render("index.ejs", { idArray: idArray, titleArray: titleArray, contentArray: contentArray, imageArray: imageArray, image: image });
		}
	});
});

//NEW ROUTE
app.get("/ichos/new", function(req,res){
	res.render("new.ejs");
});

//CREATE ROUTE
app.post("/ichos", upload.single("ichosObject[image]"), function(req,res){

	console.log(fs.readFileSync(req.file.path));

	Image.create({
			data: fs.readFileSync(req.file.path),
			contentType: "image/png"
		}, function(err,img){
			console.log(img);
			img.save();
		Ichos.create({
				title: req.body.ichosObject.title,
				content: req.body.ichosObject.content,
				img: []
			}, function(err,ichos){
				//console.log(ichos);
				ichos.image.push(img);
				ichos.save();
			User.create({
					email: jemail,
					username: jusername,
					posts: []
				}, function(err,usr){
					usr.posts.push(ichos);
					usr.save(function(err, data){
						if (err) {
							console.log(err);
						}
						else {
							console.log(data);
						}
					});
				});
		});
	});
	res.redirect("/ichos");
});

//SHOW ROUTE
app.get("/ichos/:id", function(req,res){
	Ichos.findById(req.params.id, function(err, mongoObjectID){
		if (err) {
			console.log("Object search by ID: Object not found.");
			res.redirect("/ichos");
		} else {
			console.log("Object search by ID: Object found.");

			Ichos.find({}, { _id: 1, title: 1, content: 1 }, function(err, mongoObject){
				if (err) {
					console.log("Object search: Object not found.");
					res.render("show.ejs");
				} else {
					var idArray = [];
					var titleArray = [];
					var contentArray = [];
					mongoObject.forEach(function(element){
					idArray.push(element._id);
					titleArray.push(element.title);
					contentArray.push(element.content);
					});
					res.render("show.ejs", { ichosobject: mongoObjectID, idArray: idArray, titleArray: titleArray, contentArray: contentArray });
				}
			});
		}
	});
});

//EDIT ROUTE
app.get("/ichos/:id/edit", function(req,res){
	Ichos.findById(req.params.id, function(err, mongoObject){
		if (err) {
			console.log("Object edit by ID: Object not edited.");
			res.redirect("/ichos");
		} else {
			console.log("Object edit by ID: Object edited.");
			res.render("edit.ejs", {ichosobject: mongoObject});
		}
	});
});

//UPDATE ROUTE
app.put("/ichos/:id", function(req,res){
	Ichos.findByIdAndUpdate(req.params.id, req.body.ichosObject, function(err, mongoObject){
		if (err) {
			console.log("Object update by ID: Object not updated.");
			res.redirect("/ichos");
		} else {
			console.log("Object update by ID: Object updated.");
			res.redirect("/ichos");
		}
	});
});

//DELETE ROUTE
app.delete("/ichos/:id", function(req,res){
	Ichos.findByIdAndRemove(req.params.id, function(err){
		if (err) {
			console.log("Object delete by ID: Object not deleted.");
			res.redirect("/ichos");
		} else {
			console.log("Object delete by ID: Object deleted.");
			res.redirect("/ichos");
		}
	});
});

//DELETE ALL
app.get("/remove/all", function(req,res){
	Ichos.remove({},function(err){
		if (err) {
			console.log("Deletion Failed.");
			console.log(err);
			res.redirect("/ichos");
		} else {
			console.log("Deletion Success.");
			res.redirect("/ichos");
		}
	});
});

//ERROR ROUTE
app.get("*", function(req,res){
	res.send("Page Not Found: 707");
});

//HOSTING
app.listen(3000, function(){
	console.log("Serving on port 3000.");
});

console.log("exit code 0");