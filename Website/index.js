const nodemailer = require('nodemailer');
const fs = require('fs');

const registration = require("./registration.js")
const loginsessions = require("./loginsessions.js");
const userprofile = require("./userprofile.js");
const marketplace = require("./marketplace.js");

const host = "test.universitytoken.net";

const mailConfig = JSON.parse(fs.readFileSync("config/mailing.json"));
const smtpTransport = nodemailer.createTransport(mailConfig);

module.exports = function(app, dbcon, passport) {

    app.get('/', function(req, res) {
        res.render('index');
    });

    registration(app, dbcon, smtpTransport, host);
    loginsessions(app, dbcon, passport);
    userprofile(app, dbcon, smtpTransport, host);
    marketplace(app, dbcon);

    app.use(function(req, res, next){
        res.status(404).end("Sorry, page not found");
    });
};