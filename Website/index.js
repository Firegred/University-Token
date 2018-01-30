var nodemailer = require('nodemailer');

module.exports = function(app, dbcon) {

	app.get('/', function(req, res) {
		res.render('index')
	})

	/*
	--Mailing--
	TODO: make mailing a separate file,
	fix links being accessible by anyone,
	documentation,
	delete user if haven't verified after 24hrs,
	fix res.end [-s] linking empty htmls,
	create temporary user before creating an actual user pre-confirmation,
	put mail log-in credentials (change password!) to the database
	*/

	var smtpTransport = nodemailer.createTransport({
    	service: 'gmail',
    	auth: {
        	user: 'unitokenemailconfirmation@gmail.com',
     		pass: 'hP2-WtP-fCG-E9d'
    	}
	});

	var host, rnd, mailOptions;

	app.get('/sendconfirmation', function(req, res){
		rnd = (1 + Math.random()).toString(36).substring(2, 18);
		host = req.get('host');
		link = "http://" + host + "/verify?id=" + rnd;
		mailOptions = {
			from : 'Do Not Reply <unitokenemailconfirmation@gmail.com>',
			to : 'sasha130297@gmail.com',
			subject : 'Unitoken registration confirmation',
			html : 'Please click on the link to verify your e-mail.<br><a href='
				+ link + '>Click here to verify</a>'
		};
		smtpTransport.sendMail(mailOptions, function(error, response){
			if(error){
				console.log(error);
				res.end("error");
			} else {
				console.log("Message sent: " + response.message);
				res.end("sent");
			}
		});
	});

	app.get('/verify', function(req, res){
		if((req.protocol + "://" + req.get('host')) == ("http://" + host)){
			if(req.query.id == rnd){
				res.end("Email " + mailOptions.to + " has been successfully verified");
				dbcon.connect(function(err){
					if (err) {
						console.log("Couldn't connect to the database");
						res.end("Some issues were encountered. Please, verify your e-mail later.")
					}
					qr = "UPDATE users SET flag_verified = 1 WHERE email = '" + mailOptions.to + "'";
					dbcon.query(qr, function(err, result){
						if(err) {
							console.log(err);
						}
						console.log(result.affectedRows + " record(s) updated");
					});
				});
			} else {
				res.end("Bad request");
			}
		} else {
			res.end("Wrong confirmation URL");
		}
	});

};