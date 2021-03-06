module.exports = function(app, passport) {
  var User       = require('./models/user');
  var Memes       = require('./models/photos.js');
  var fs    = require('fs');
  var axios = require('axios')

// normal routes ===============================================================
// normal routes ===============================================================


// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.pug');
    });


    // HOME SECTION =========================
    app.get('/home',isLoggedIn, function(req, res) {
      console.log(req.user.local.email, 'The token is ',req.user.local.nanoPoolToken);
      var nanoPoolToken = req.user.local.nanoPoolToken;
      User.findOne({ 'local.email': req.user.local.email}, function (err, doc){
        console.log('Found', doc.local.firstName);
        if(doc.local.nanoPoolToken != null){
          axios.all([
            axios.get('https://api.nanopool.org/v1/eth/hashrate/'+ nanoPoolToken),
            axios.get('https://api.nanopool.org/v1/eth/payments/'+ nanoPoolToken),
            axios.get('https://api.nanopool.org/v1/eth/workers/'+ nanoPoolToken)
          ])
          .then(axios.spread((hashresponse, paymentresponse, workersResponse) => {
            // ADDING ALLTHE PAYMENTS
            var paymentData = {payments: paymentresponse.data.data},
            totalPaid = 0, payments = paymentData.payments, i;
            for (i = 0; i < payments.length; i++) {totalPaid += payments[i].amount;}
            // ADDING ALLTHE MINERS
            var bookCount = Object.keys(workersResponse.data.data).length;
            console.log(bookCount);
            res.render('home.pug',{
              minerPaid:parseFloat(totalPaid).toFixed(2),
              currentuser : req.user.local,
              totalMiners: bookCount,
              currentHashRate : hashresponse.data.data,
            });
          }));
        }else{
          console.log("you have no pool");
          res.render('home.pug',{currentuser : req.user.local, noMiner: "Please update your miner here"});
        }
      });


    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/login');
    });
    // Profile ==============================
    app.get('/profile',isLoggedIn, function(req, res) {
      User.findOne({ 'local.email': req.user.local.email}, function (err, doc){
        console.log(doc.local.email);
        res.render("profile.pug",{currentuser : doc.local});
      });

    });
    app.post('/editprofile',isLoggedIn, function(req, res) {
      //taking in form data
      console.log(req.body.nanoPoolUpdate);
      //searching database email
      User.findOne({ 'local.email': req.user.local.email}, function (err, doc){
        // making sure req.user matches email
        if(doc.local.email === req.user.local.email){
          console.log("email match continue to update user profile");
          //updating user informtation
          User.where('local.email', doc.local.email)
          .update({$set: {'local.nanoPoolToken': req.body.nanoPoolUpdate,'local.email':req.body.emailUpdate}}, function (err, count) {
            if (err)  throw err;
            console.log("You have updated nano pool token with",req.body.nanoPoolUpdate);
            res.redirect(req.get('referer'));
          });
        }else{
          console.log("Current user email does not match");
        }
      });
    });

    app.post('/remove', function(request, response){
      console.log("Passed Path " + request.body.username);

          Memes.remove({filename:request.body.username},function(err,promo){
            if (err)  throw err;
            console.log("Found post");

            fs.unlink(request.body.username, function(err){
              if(err){
                console.log(err);
              }else{
                console.log("File removed");

                response.redirect("feed");
              }
            })
          });
        });
    app.post('/updateFeature', function(request, response){
      console.log("Passed Path " + request.body.username);
      var query = { featured: false };
          Memes.update(query, { featured: true },function(err,promo){

            if (err)  throw err;
            console.log("Found post");
            console.log("Found post");
            console.log("Found post");
            response.redirect("feed");

          });
        });

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/home', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/home', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

    // facebook -------------------------------

        // send to facebook to do the authentication
        app.get('/auth/facebook', passport.authenticate('facebook', { scope : ['public_profile', 'email'] }));

        // handle the callback after facebook has authenticated the user
        app.get('/auth/facebook/callback',
            passport.authenticate('facebook', {
                successRedirect : '/profile',
                failureRedirect : '/signup.ejs'
            }));

    // twitter --------------------------------

        // send to twitter to do the authentication
        app.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));

        // handle the callback after twitter has authenticated the user
        app.get('/auth/twitter/callback',
            passport.authenticate('twitter', {
                successRedirect : '/profile',
                failureRedirect : '/signup.ejs'
            }));


    // google ---------------------------------

        // send to google to do the authentication
        app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

        // the callback after google has authenticated the user
        app.get('/auth/google/callback',
            passport.authenticate('google', {
                successRedirect : '/profile',
                failureRedirect : '/signup.ejs'
            }));

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

    // locally --------------------------------
        app.get('/connect/local', function(req, res) {
            res.render('connect-local.ejs', { message: req.flash('loginMessage') });
        });
        app.post('/connect/local', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

    // facebook -------------------------------

        // send to facebook to do the authentication
        app.get('/connect/facebook', passport.authorize('facebook', { scope : ['public_profile', 'email'] }));

        // handle the callback after facebook has authorized the user
        app.get('/connect/facebook/callback',
            passport.authorize('facebook', {
                successRedirect : '/profile',
                failureRedirect : '/signup.ejs'
            }));

    // twitter --------------------------------

        // send to twitter to do the authentication
        app.get('/connect/twitter', passport.authorize('twitter', { scope : 'email' }));

        // handle the callback after twitter has authorized the user
        app.get('/connect/twitter/callback',
            passport.authorize('twitter', {
                successRedirect : '/profile',
                failureRedirect : '/signup.ejs'
            }));


    // google ---------------------------------

        // send to google to do the authentication
        app.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));

        // the callback after google has authorized the user
        app.get('/connect/google/callback',
            passport.authorize('google', {
                successRedirect : '/profile',
                failureRedirect : '/signup.ejs'
            }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // facebook -------------------------------
    app.get('/unlink/facebook', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.facebook.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // twitter --------------------------------
    app.get('/unlink/twitter', isLoggedIn, function(req, res) {
        var user           = req.user;
        user.twitter.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // google ---------------------------------
    app.get('/unlink/google', isLoggedIn, function(req, res) {
        var user          = req.user;
        user.google.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });


};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
