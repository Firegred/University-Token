const LocalStrategy = require('passport-local').Strategy;

module.exports = function (app, dbcon, passport) {

    passport.serializeUser(function (user, done) {
        done(null, user.user_id);
    });

    passport.deserializeUser(function (id, done) {
        dbcon.query("SELECT * FROM perm_users WHERE user_id = ?", [id], function (err, rows) {
            done(err, rows[0]);
        });
    });

    passport.use('local-login',
        new LocalStrategy({
                usernameField: 'email',
                passwordField: 'password'
            },
            function (email, password, done) {
                dbcon.query("SELECT * FROM perm_users WHERE email = " + dbcon.escape(email), function (err, rows) {
                    if (err) {
                        return done(err);
                    }
                    if (!rows.length) {
                        return done(null, false);
                    }

                    if (rows[0].password != password) {
                        return done(null, false);
                    } else {
                        return done(null, rows[0]);
                    }
                });
            }));

    app.post("/login", passport.authenticate('local-login', {
            successRedirect: "/",
            failureRedirect: "/login"
        }),
        function (req, res) {
            if (req.body.remember) {
                req.session.cookie.maxAge = 1000 * 60 * 3;
            } else {
                req.session.cookie.expires = false;
            }
        });

    function isLoggedIn(req, res, next) {

        // if user is authenticated in the session, carry on
        if (req.isAuthenticated())
            return next();

        // if they aren't redirect them to the home page
        res.redirect('/');
    }

}