// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var pug    = require('pug');
var fs    = require('fs');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var multer = require('multer')
var path = require('path')
var configDB = require('./config/database.js');
var storage = multer.diskStorage({
	destination: function(req, file, callback) {
		callback(null, './public/uploads')
	},
	filename: function(req, file, callback) {
    var fileName = file.fieldname + '-' + Date.now() + path.extname(file.originalname);
		callback(null, fileName )
	}
})

// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));
var Memes       = require('./app/models/photos.js');

app.set('view engine', 'pug'); // set up ejs for templating
app.set(express.static('./public'));
app.use(express.static(__dirname));
// required for passport
app.use(session({
    secret: 'ilovescotchscotchyscotchscotch', // session secret
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// profilePic Multer ======================================================================

// meme Multer ======================================================================

// app.post('/remove', function(req, res) {
// 	var imagepath = req.fileTodelete
// 	console.log(req.body);
//
// 			fs.unlink("./remove.js", function(err){
// 				if(err){
// 					console.log(err);
// 				}else{
// 					console.log("File removed");
// 					console.log("File removed");
// 					console.log("File removed");
// 					console.log("File removed");
// 					res.redirect("feed");
// 				}
// 			})
//
// });

app.post('/upload', function(req, res) {
  var upload = multer({
    storage: storage,
    fileFilter: function(req, file, callback) {
      var ext = path.extname(file.originalname)
      if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
        return callback(res.end('Only images are allowed'), null)
      }
      callback(null, true)
    }
  }).single('userFile');
  upload(req, res, function(err) {
    var filePath = req.file.path
    var userUpload = req.user.local.email
    var newMeme            = new Memes();

    newMeme.featured    = false;
    newMeme.size    = req.file.size;
    newMeme.originalName    = req.file.originalname;
    newMeme.author    = userUpload;
    newMeme.mimeType    = req.file.mimetype;
    newMeme.description    = userUpload;
    newMeme.filename    = filePath;

    newMeme.save(function(err) {
        if (err)
            return done(err);

    });

    console.log(filePath);
    console.log(userUpload);
    console.log("Uploaded Success");
    res.redirect("feed");
  })
})
// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);
