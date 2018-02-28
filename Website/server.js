var express = require('express');
var routes = require('./index.js');
var mysql = require('mysql');
var path = require('path');
var session = require('express-session');
var passport = require('passport');
var cookieParser = require('cookie-parser');

var app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(session({secret: ""})); // Please insert random string for secret
app.use(passport.initialize());
app.use(passport.session());

var dbcon = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "mydb",
    multipleStatements: true
});

/* Routing of links */
routes(app, dbcon, passport);

/* Application is bound to port 3000 */
app.listen(3000, function() {
    console.log('Server is bound to port 3000')
});