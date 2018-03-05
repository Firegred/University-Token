var express = require('express');
var routes = require('./index.js');
var marketplace = require('./marketplace.js');
var mysql = require('mysql');
var path = require('path');
var app = express();

app.set('view engine', 'ejs');
app.set('views',  path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, 'public')));


var dbcon = mysql.createConnection({
	host: "unitokendata.cpcqiko7dvv7.us-east-1.rds.amazonaws.com",
	user: "root",
	password: "dbaccess",
	port: "3306",
	database: "db"
});

//For local testing
/*
var dbcon = mysql.createConnection({ 
	host: 'localhost',
	user: 'root',
	database: 'mydb'
});
*/
//used for search function
app.set('views',__dirname + '/views');
app.use(express.static(__dirname + '/JS'));
app.engine('html', require('ejs').renderFile);

app.get('/search',function(req,res){
	connection.query('SELECT wallet_address from wallet where user_id like "%'+req.query.key+'%"',
	function(err, rows, fields) {
		if (err) throw err;
			var data=[];
		for(i=0;i<rows.length;i++) {
			data.push(rows[i].first_name);
		}
		res.end(JSON.stringify(data));
	});
});

/* Routing of links */
routes(app, dbcon);
marketplace(app, dbcon);

var server=app.listen(3000,function(){
console.log("We have started our server on port 3000");
});
