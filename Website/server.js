var express = require('express');
var routes = require('./index.js');
var mysql = require('mysql');
var path = require('path');
var app = express();

app.set('view engine', 'ejs');
app.set('views',  path.join(__dirname, "views"));

var dbcon = mysql.createConnection(
{
	host: "unitokendb.cpcqiko7dvv7.us-east-1.rds.amazonaws.com",
	user: "root",
	password: "uniaccess",
	port: "3306",
	database: "db"
	
});

dbcon.connect(function(err)
{
	if (err) throw err;
	console.log("connected!");


});

