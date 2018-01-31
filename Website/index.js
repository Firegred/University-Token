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
	put mail log-in credentials (change password!) to the database, 
	add actual e-mail to send confirmation to from db
	*/

	var smtpTransport = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: 'unitokenemailconfirmation@gmail.com',
			pass: 'hP2-WtP-fCG-E9d'
		}
	});

	var host;

	app.get('/sendconfirmation', function(req, res){
		rnd = (1 + Math.random()).toString(36).substring(2, 18);
		qr = "UPDATE temp_users SET verification_code = '"
		+ rnd + "' WHERE email = '" + "example@gmail.com" + "'";
		dbcon.query(qr, function(err, result){
			if(err){
				console.log(err);
			}
			console.log(result.affectedRows + " record(s) updated");
		});
		host = req.get('host');
		link = "http://" + host + "/verify?id=" + rnd;
		mailOptions = {
			from : 'Do Not Reply <unitokenemailconfirmation@gmail.com>',
			to : 'example@gmail.com',
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
			qr = "SELECT * FROM temp_users WHERE email = '" + "example@gmail.com" + "'";
			dbcon.query(qr, function(err, result){
				if(err){throw err;}
				console.log(result);
				if(!result.length){
					console.log("No temp account associated with current email");
					res.end("This link has expired.");
				} else {
					if(req.query.id == result[0].verification_code){
						qr = "DELETE FROM temp_users WHERE email = '" + result[0].email + "'; ";
						qr += "INSERT INTO perm_users (email) values ('" + result[0].email + "');"; 
						dbcon.query(qr, function(err, result){
							if(err) throw err;
							console.log(result.affectedRows + " record(s) updated");
						});
						res.end("Email " + result[0].email + " has been successfully verified");
					} else {
						res.end("Bad request");
					}
				}
			});
		} else {
			res.end("Wrong confirmation URL");
		}
	});

};