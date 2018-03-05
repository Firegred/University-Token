const express = require('express');
const mysql = require('mysql');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

var app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(session({secret: ""})); // Please insert random string for secret
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({extended: true}));

var dbcon = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "mydb",
    multipleStatements: true
});

/* Routing of links */
const routes = require('./index.js');
routes(app, dbcon, passport);

/* Application is bound to port 3000 */
app.listen(3000, function() {
    console.log('Server is bound to port 3000')
});