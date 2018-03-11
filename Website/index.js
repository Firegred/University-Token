// Imports
const nodemailer = require('nodemailer');
const fs = require('fs');

const registration = require("./registration.js");
const loginsessions = require("./loginsessions.js");
const userprofile = require("./userprofile.js");
const marketplace = require("./marketplace.js");

const mailConfig = JSON.parse(fs.readFileSync("config/mailing.json"));

// const host = "test.universitytoken.net";
const host = "localhost:3000";
const smtpTransport = nodemailer.createTransport(mailConfig);

module.exports = function(app, dbcon, passport) {

    // Index page router
    app.get('/', function(req, res) {
        res.render('index', {user: req.user});
    });

    loginsessions(app, dbcon, passport); // Login and sessions routers
    userprofile(app, dbcon, smtpTransport, host); // User profile routers
    registration(app, dbcon, smtpTransport, host); // Registration routers
    marketplace(app, dbcon); // Marketplace routers

    // Default error handler
    app.use(function(req, res, next){
        res.render("pageNotFound");
    });
};