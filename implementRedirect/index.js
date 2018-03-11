const nodemailer = require('nodemailer');
const fs = require('fs');

const registration = require("./registration.js")
const loginsessions = require("./loginsessions.js");
const userprofile = require("./userprofile.js");
const marketplace = require("./marketplace.js");

const host = "test.universitytoken.net";

const mailConfig = JSON.parse(fs.readFileSync("config/mailing.json"));
const smtpTransport = nodemailer.createTransport(mailConfig);

/*needed for flash messages*/
var express = require('express');
const flash = require('connect-flash');
const session = require('express-session');
const app = express();
app.use(session({ secret: 'zxcv' })); // session secret
/*needed for flash messages*/

module.exports = function(app, dbcon, passport) {

    /*needed for flash messages*/
    app.use(flash()); // use connect-flash for flash messages stored in session
    app.use(function(req, res, next){
        res.locals.success = req.flash('success');
        res.locals.warning = req.flash('warning');
        next();
    });

    app.get('/', function(req, res) {
        res.render('index');
    });

    registration(app, dbcon, smtpTransport, host);
    loginsessions(app, dbcon, passport);
    userprofile(app, dbcon, smtpTransport, host);
    marketplace(app, dbcon);

    app.use(function(req, res, next){
        res.render('pageNotFound');
    });

};