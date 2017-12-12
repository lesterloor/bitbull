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
      var miningAdress = "0xd171c8869e991c51cfe2d1e1ab0aa9744c70a9d3";
      axios.get('https://api.nanopool.org/v1/eth/hashrate/'+ miningAdress)
      .then(function (hashresponse) {
        axios.get('https://api.nanopool.org/v1/eth/payments/'+ miningAdress)
        .then(function (paymentresponse) {
          axios.get('https://api.nanopool.org/v1/eth/avghashrateworkers/'+ miningAdress)
          .then(function (workersResponse) {
              // ADDING ALLTHE PAYMENTS
              var paymentData = {
                payments: paymentresponse.data.data
              },
              totalPaid = 0, payments = paymentData.payments, i;
              for (i = 0; i < payments.length; i++) {
                totalPaid += payments[i].amount;
              }
              var totalWorkers = {workers: workersResponse.data.data}
              totalPaid = 0, workers = totalWorkers.workers, i;
              for (i = 0; i < workers.length; i++) {
                totalPaid += workers[i].amount;
              }

              console.log(totalPaid);
              console.log(workers.length);
              console.log(hashresponse.data.data);
              // END ADDING ALLTHE PAYMENTS
                console.log(req.isAuthenticated());
                res.render('home.pug', {
                  totalMined:parseFloat(totalPaid).toFixed(2),
                  currentuser : req.user.local,
                  currentHashRate : hashresponse.data.data,
                  // allusers: allusers,
            });
          })
        })
      })
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/login');
    });
    // Profile ==============================
    app.get('/profile',isLoggedIn, function(req, res) {
      res.render("profile.pug",{currentuser : req.user.local});

    });
    app.post('/editprofile',isLoggedIn, function(req, res) {
      console.log(req.body.firstname);
      // var query = { 'locl.firstName': 'lester','local.lastName': 'loor' };
        User.update({ 'local.firstName' :  req.body.firstname },function(err,user){

        if (err)  throw err;

          console.log(user);
          res.render("profile.pug",{currentuser : req.user.local});

        });
      // var query = { firstName: 'lester' };
      // User.update(query, { firstName: req.body.username },function(err,promo){
      //
      //   if (err)  throw err;
      //   console.log("Found post");
      //   console.log("Found post");
      //   console.log("Found post");
      //   res.redirect("profile");
      //
      // });
      //     // Handle any possible database errors
      //     if (err) {
      //         res.status(500).send(err);
      //     } else {
      //         // Update each attribute with any possible attribute that may have been submitted in the body of the request
      //         // If that attribute isn't in the request body, default back to whatever it was before.
      //         edit.username = req.body.username || edit.username;
      //
      //         // Save the updated document back to the database
      //         edit.save((err, edit) => {
      //             if (err) {
      //                 res.status(500).send(err)
      //             }
      //             res.status(200).send(edit);
      //             res.render("profile.pug",{currentuser : req.user.local});
      //
      //         });
      //     }
      // });

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
