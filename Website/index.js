const nodemailer = require('nodemailer');

const registration = require("./registration.js")
const loginsessions = require("./loginsessions.js");
const userprofile = require("./userprofile.js");
const marketplace = require("./marketplace.js");

const host = "test.universitytoken.net";
const smtpTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'unitokenemailconfirmation@gmail.com',
        pass: 'hP2-WtP-fCG-E9d'
    }
});

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