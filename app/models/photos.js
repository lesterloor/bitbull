// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var imagePath = "public/uploads/";
var bodyParser = require("body-parser");
// define the schema for our user model
var MemesSchema = mongoose.Schema({

        size        : Number,
        originalName   : String,
        author        : String,
        mimeType     : String,
        featured     : Boolean,
        description     : String,
        filename     : String


});


module.exports = mongoose.model('Memes', MemesSchema);
