var express = require('express');
var routes = require('./index.js');
var mysql = require('mysql');
var path = require('path');
var app = express();

app.set('view engine', 'ejs');
app.set('views',  path.join(__dirname, "views"));

var dbcon = mysql.createConnection({
	host: "unitokendata.cpcqiko7dvv7.us-east-1.rds.amazonaws.com",
	user: "root",
	password: "dbaccess",
	port: "3306",
	database: "db"
});

/* Routing of links */
routes(app, dbcon);

/* Application is bound to port 3000 */
app.listen(3000, function(){
	console.log('Server is bound to port 3000')
});
