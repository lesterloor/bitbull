// load the things we need
var mongoose = require('mongoose');
var Potato = mongoose.model('Potato', PotatoSchema);


module.exports = mongoose.model('User', userSchema);
