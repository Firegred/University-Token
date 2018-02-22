var http = require('http');
var mysql = require('mysql');

module.exports = function(app, dbcon) {

	app.get('/marketplace', function(req, res) {
		console.log('success');	
		res.render('marketplace');
	})

}
