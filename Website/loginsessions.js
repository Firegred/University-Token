// Imports
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt-nodejs');

module.exports = function (app, dbcon, passport) {

    passport.serializeUser(function (user, done) {
        done(null, user.user_id);
    });

    // Used to deserialize user and get their info from database
    passport.deserializeUser(function (user_id, done) {
        dbcon.query("SELECT * FROM perm_users WHERE user_id = ?", [user_id], function (err, rows) {
            done(err, rows[0]);
        });
    });

    /*
    Login scheme
    After receiving email and password, the function
    checks the database for the user with the same fields
     */
    passport.use('local-login',
        new LocalStrategy({
                usernameField: 'email',
                passwordField: 'password'
            },
            function (email, password, done) {
                dbcon.query("SELECT * FROM perm_users WHERE email = " + dbcon.escape(email), function (err, rows) {
                    if (err) { // Database error
                        return done(err);
                    }
                    if (!rows.length) { // No user with such email
                        return done(null, false);
                    }
                    if (!bcrypt.compareSync(password, rows[0].password)) { // Passwords do not match
                        return done(null, false);
                    }
                    return done(null, rows[0]);
                });
            }));

    /*
    Login submit router
    If user failed to login, redirect them to login page
    Else, redirect them to the page they came from
     */
    app.post("/login", passport.authenticate('local-login', {
            failureRedirect: "/login"
        }),
        function (req, res) {
            if (req.body.remember) { // Manages the longevity of cookies (currently not supported)
                req.session.cookie.maxAge = 1000 * 60 * 3;
            } else {
                req.session.cookie.expires = false;
            }
            var returnTo = (req.session.returnTo) ? req.session.returnTo : "/";
            delete req.session.returnTo;
            res.redirect(returnTo);
        });

    // Login page router
    app.get("/login", function (req, res) {
        if(req.isAuthenticated()){
            req.flash('warning', 'You are already logged in.');
            res.redirect('/');
        } else {
            res.render("login", {user: req.user});
        }
    });

}
