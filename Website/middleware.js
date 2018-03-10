module.exports = {

    isLoggedIn: function (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        } else {
            req.session.returnTo = (req.originalUrl) ? req.originalUrl : "/";
            res.redirect('/login');
        }

    }

}