var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mysql = require('mysql');

var index = require('./routes/index');
var registration = require('./routes/registration');

var app = express();

var urlencodedParser = bodyParser.urlencoded({ extended: true });

/* Setting up Database Connection */
var connection = mysql.createConnection({
    host: "unitokendata.cpcqiko7dvv7.us-east-1.rds.amazonaws.com",
	user: "root",
	password: "dbaccess",
	port: "3306",
	database: "db"
});

connection.connect();
console.log('Connected!');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/registration', registration);

app.post('/registration', urlencodedParser, function(req, res) {
    console.log(req.body);
    var databaseQuery = "INSERT INTO user (firstName,lastName,email,birthmonth,birthday,birthyear,university,country,state,zip,password) VALUES ('"
                            + req.body.firstName +"','"
                            + req.body.lastName +"','"
                            + req.body.email +"','"
                            + req.body.birthmonth +"','"
                            + req.body.birthday +"','"
                            + req.body.birthyear +"','"
                            + req.body.university +"','"
                            + req.body.country +"','"
                            + req.body.state +"','"
                            + req.body.zip +"','"
                            + req.body.password +"')";

    connection.query(databaseQuery, function(err, result) {
        if (err) {
            throw err;
        }else{
            console.log(result.affectedRows + "records updated.");
        }
    });
    res.render('registration', {qs: req.query});
});

app.get('/', function(req, res,next) {
    res.render('index');
});

app.get('/registration', function(req, res,next) {
    res.render('registration', {qs: req.query});
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
