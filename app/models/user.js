// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema   = mongoose.Schema;

var walletSchema = new Schema({
  coinName: String,
  amount: Number
  });

var userSchema = new Schema({

    local            : {
        email        : String,
        firstName        : String,
        lastName        : String,
        password     : String,
        nanoPoolToken     : String,
        wallet:  [walletSchema]
        // unique: true
    },
    facebook         : {
        id           : String,
        token        : String,
        name         : String,
        email        : String
    },
    twitter          : {
        id           : String,
        token        : String,
        displayName  : String,
        username     : String
    },
    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    }

});



// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
const User =  mongoose.model('user', userSchema);

module.exports = User;
