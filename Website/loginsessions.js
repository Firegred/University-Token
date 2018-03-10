const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt-nodejs');

module.exports = function (app, dbcon, passport) {

    passport.serializeUser(function (user, done) {
        done(null, user.user_id);
    });

    passport.deserializeUser(function (user_id, done) {
        dbcon.query("SELECT * FROM perm_users WHERE user_id = ?", [user_id], function (err, rows) {
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

                    if (!bcrypt.compareSync(password, rows[0].password)) {
                        return done(null, false);
                    }
                    return done(null, rows[0]);
                });
            }));

    app.post("/login", passport.authenticate('local-login', {
            failureRedirect: "/login"
        }),
        function (req, res) {
            if (req.body.remember) {
                req.session.cookie.maxAge = 1000 * 60 * 3;
            } else {
                req.session.cookie.expires = false;
            }
            var returnTo = (req.session.returnTo) ? req.session.returnTo : "/";
            delete req.session.returnTo;
            res.redirect(returnTo);
        });

    app.get("/login", function (req, res) {
        res.render("login");
    });

}
