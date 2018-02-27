var http = require('http');
var mysql = require('mysql');

module.exports = function(app, dbcon) {

	app.get('/marketplace', function(req, res) {
		dbcon.query("SELECT * FROM listings", function(err, result, fields) {
			if (err) throw err;
			console.log(result);
			res.render('marketplace', { listings: result });
		});
	})
}