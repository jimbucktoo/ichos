//APP.JS

//APP INITIALIZATION

var express = require("express");
var app = express();
var fs = require("file-system");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var methodOverride = require("method-override");
var multer = require('multer');
var upload = multer({ dest: "uploads/" });
var passport = require("passport");
var LocalStrategy = require("passport-local");
var passportLocalMongoose = require("passport-local-mongoose");
var Image = require('./models/images.js');
var Ichos = require('./models/ichos.js');
var User = require('./models/users.js');


//APP CONFIGURATION

mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost:27017/ichosdb", { useNewUrlParser: true });
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(methodOverride("_method"));

app.use(require("express-session")({
    secret: "jimbucktoo",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//AUTH ROUTES

//REGISTER ROUTE

app.get("/register", function(req, res){
    res.render('register.ejs');
});

app.post("/register", function(req, res){
    User.register(new User({username: req.body.username}), req.body.password, function(err, user){
        if(err) {
            console.log(err);
            res.send("Registration Error.");
        }; 
        passport.authenticate('local')(req, res, function(){
            res.redirect('/ichos'); 
        });
    });

});


//LOGIN ROUTE

app.get("/", function(req, res) {
    res.render("login.ejs");
});

app.post('/', passport.authenticate('local', {
    successRedirect: '/ichos',
    failureRedirect: '/'
}), function(req, res){

});


//LOGOUT ROUTE

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});


var currentUser = "";

function isLoggedIn(req, res, next){
    if (req.isAuthenticated()){
        console.log(req.user);
        console.log(req.user.username);
        currentUser = req.user.username
        return next();
    } else {
        res.redirect('/');
    };
};


//RESTful ROUTES

//INDEX ROUTE

app.get("/ichos", isLoggedIn, function(req, res) {
    Ichos.find({}, { _id: 1, title: 1, content: 1, image: 1 }, function(err, mongoObject) {
        if (err) {
            console.log("Object search: Object not found.");
            res.render("index.ejs");
        } else {
            var idArray = [];
            var titleArray = [];
            var contentArray = [];

            var findByIDRequests = [];

            mongoObject.forEach(function(element) {
                idArray.push(element._id);
                titleArray.push(element.title);
                contentArray.push(element.content);
                var request = new Promise(function(resolve, reject) {
                    Image.findById(element.image, function(err, imageObj) {
                        console.log(JSON.stringify(imageObj.data));
                        if (err) {
                            reject(err);
                        } else {
                            var image64data = new Buffer(imageObj.data).toString('base64');
                            resolve(image64data);
                        }
                    });
                });
                findByIDRequests.push(request);
            });
            Promise.all(findByIDRequests).then(function(data) {
                console.log(data);
                res.render("index.ejs", { idArray: idArray, titleArray: titleArray, contentArray: contentArray, imageData: data });
            }).catch(function(err) {
                console.log(err);
            });
        }
    });
});


//NEW ROUTE

app.get("/ichos/new", isLoggedIn, function(req, res) {
    res.render("new.ejs");
});


//CREATE ROUTE

app.post("/ichos", upload.single("ichosObject[image]"), isLoggedIn, function(req, res) {
    Image.create({
        data: fs.readFileSync(req.file.path),
        contentType: "image/png"
    }, function(err, img) {
        img.save();
        Ichos.create({
            title: req.body.ichosObject.title,
            content: req.body.ichosObject.content,
            img: []
        }, function(err, ichos) {
            ichos.image.push(img);
            ichos.save();
            User.findOne({ username : currentUser }, function(err, usr) {
                usr.posts.push(ichos);
                usr.save(function(err, data) {
                    if (err) {
                        console.log(err);
                        res.redirect("/ichos") 
                    } else {
                        console.log(data);
                        res.redirect("/ichos");
                    }
                });
            });
        });
    });
});


//SHOW ROUTE

app.get("/ichos/:id", isLoggedIn, function(req, res) {
    Ichos.findById(req.params.id, function(err, mongoObjectID) {
        if (err) {
            console.log("Object search by ID: Object not found.");
            res.redirect("/ichos");
        } else {
            console.log("Object search by ID: Object found.");

            Ichos.find({}, { _id: 1, title: 1, content: 1 }, function(err, mongoObject) {
                if (err) {
                    console.log("Object search: Object not found.");
                    res.render("show.ejs");
                } else {
                    var idArray = [];
                    var titleArray = [];
                    var contentArray = [];
                    mongoObject.forEach(function(element) {
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

app.get("/ichos/:id/edit", isLoggedIn, function(req, res) {
    Ichos.findById(req.params.id, function(err, mongoObject) {
        if (err) {
            console.log("Object edit by ID: Object not edited.");
            res.redirect("/ichos");
        } else {
            console.log("Object edit by ID: Object edited.");
            res.render("edit.ejs", { ichosobject: mongoObject });
        }
    });
});


//UPDATE ROUTE

app.put("/ichos/:id", isLoggedIn, function(req, res) {
    Ichos.findByIdAndUpdate(req.params.id, req.body.ichosObject, function(err, mongoObject) {
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

app.delete("/ichos/:id", isLoggedIn, function(req, res) {
    Ichos.findByIdAndRemove(req.params.id, function(err) {
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

app.get("/remove/all", isLoggedIn, function(req, res) {
    Ichos.remove({}, function(err) {
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

app.get("*", function(req, res) {
    res.send("Page Not Found: 707");
});


//HOSTING

app.listen(3000, function() {
    console.log("Serving on port 3000.");
});

console.log("exit code 0");
