var nodemailer = require('nodemailer');
var bodyParser = require('body-parser');
var crypto = require("crypto");
var path = require('path');
var multer = require('multer');
var LocalStrategy = require('passport-local').Strategy;
var storage = multer.diskStorage({
    destination: "uploads/",
    filename: function(req, file, callback) {
        crypto.pseudoRandomBytes(16, function(err, raw) {
            if (err) return callback(err);
            callback(null, raw.toString('hex') + path.extname(file.originalname));
        });
    }
});
var upload = multer({
    storage: storage
})

module.exports = function(app, dbcon, passport) {

    app.use(bodyParser.urlencoded({
        extended: true
    }));

    /*
        Description:
        TODO(-s):
        */
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

    var host = "test.universitytoken.net";

    /*
        Description:
        TODO(-s):
        */
    function sendEmailConfirmation(email, res) {
        var confirmationToken = (1 + Math.random()).toString(36).substring(2, 18);
        var databaseQuery = "UPDATE temp_users SET verification_code = " +
            dbcon.escape(confirmationToken) + " WHERE email = " + dbcon.escape(email);
        dbcon.query(databaseQuery, function(err, result) {
            if (err) {
                throw err;
            }
            console.log(email);
            var link = "http://" + host + "/verify?id=" + confirmationToken;
            var mailOptions = {
                from: 'Do Not Reply <unitokenemailconfirmation@gmail.com>',
                to: email,
                subject: 'Unitoken registration confirmation',
                html: 'Please click on the link to verify your e-mail.<br><a href=' +
                    link + '>Click here to verify</a>'
            };
            smtpTransport.sendMail(mailOptions, function(error, response) {
                if (error) {
                    console.log(error);
                    res.end("error");
                } else {
                    console.log("Message sent: " + response.message);
                    res.end("Please, check your email to verify your account.");
                }
            });
        });
    }

    /*
        Description:
        TODO(-s):
        */
    app.get('/verify', function(req, res) {
        if ((req.protocol + "://" + req.get('host')) == ("http://" + host)) {
            var databaseQuery = "SELECT * FROM temp_users WHERE verification_code = " + dbcon.escape(req.query.id);
            dbcon.query(databaseQuery, function(err, result) {
                if (err) {
                    throw err;
                }
                if (!result.length) {
                    console.log("No temp account associated with current email");
                    res.end("This link has expired.");
                } else {
                    databaseQuery = "DELETE FROM temp_users WHERE email = " + dbcon.escape(result[0].email) + "; ";
                    databaseQuery += "INSERT INTO perm_users (first_name,last_name,email,birth_month,birth_day,birth_year,university,country,state,zip,password) VALUES (" +
                        dbcon.escape(result[0].first_name) + "," +
                        dbcon.escape(result[0].last_name) + "," +
                        dbcon.escape(result[0].email) + "," +
                        dbcon.escape(result[0].birth_month) + "," +
                        dbcon.escape(result[0].birth_day) + "," +
                        dbcon.escape(result[0].birth_year) + "," +
                        dbcon.escape(result[0].university) + "," +
                        dbcon.escape(result[0].country) + "," +
                        dbcon.escape(result[0].state) + "," +
                        dbcon.escape(result[0].zip) + "," +
                        dbcon.escape(result[0].password) + ")";
                    dbcon.query(databaseQuery, function(err, result) {
                        if (err) throw err;
                        console.log(result.affectedRows + " record(s) updated");
                    });
                    res.end("Email " + result[0].email + " has been successfully verified");
                }
            });
        } else {
            res.end("Wrong confirmation URL");
        }
    });

    /*
        Description:
        TODO(-s):
        */
    app.get('/resetpassword', function(req, res) {
        res.render('resetpassword');
    });

    /*
        Description:
        TODO(-s):
        */
    app.post('/resetpassword', function(req, res) {
        var databaseQuery = "SELECT * FROM reset_pass WHERE email = " + dbcon.escape(req.body.email) + " AND used_flag = 0";
        dbcon.query(databaseQuery, function(err, result) {
            if (err) {
                throw err;
            }
            if (!result.length) {
                databaseQuery = "SELECT * FROM perm_users WHERE email = " + dbcon.escape(req.body.email) + ";";
                dbcon.query(databaseQuery, function(err, result) {
                    if (err) {
                        throw err;
                    }
                    if (result.length > 0) {
                        var confirmationToken = (1 + Math.random()).toString(36).substring(2, 18);
                        databaseQuery = "INSERT INTO reset_pass (user_id, verification_code, email, used_flag) VALUES (" +
                            result[0].user_id + ", " + dbcon.escape(confirmationToken) + ", " + dbcon.escape(result[0].email) + ", 0)";
                        dbcon.query(databaseQuery, function(err, result) {
                            if (err) {
                                throw err;
                            }
                            var link = "http://" + req.get('host') + "/reset?id=" + confirmationToken;
                            var mailOptions = {
                                from: 'Do Not Reply <unitokenemailconfirmation@gmail.com>',
                                to: req.body.email,
                                subject: 'Unitoken password reset',
                                html: 'Please click on the link to reset your password.<br><a href=' +
                                    link + '>Click here to reset your password</a>'
                            };
                            smtpTransport.sendMail(mailOptions, function(error, response) {
                                if (error) {
                                    console.log(error);
                                    res.end("error");
                                } else {
                                    console.log("Message sent: " + response.message);
                                    res.end("A link has been sent to " + req.body.email + ". Please, check your email.");
                                }
                            });
                        });
                    } else {
                        // If user is not actually in the database [not registered / haven't confirmed registration],
                        // do not send an email while saying that we did to avoid disclosing info about users of the website
                        console.log("No user with requested email");
                        res.end("A link has been sent to " + req.body.email + ". Please, check your email.");
                    }
                });
            } else {
                res.end("You have already requested a password reset, check your email.")
            }
        });
    });

    /*
        Description:
        TODO(-s):
        */
    app.get("/reset", function(req, res) {
        if ((req.protocol + "://" + req.get('host')) == ("http://" + host)) {
            var databaseQuery = "SELECT * FROM reset_pass WHERE verification_code =" + dbcon.escape(req.query.id) + " AND used_flag = 0;";
            dbcon.query(databaseQuery, function(err, result) {
                if (err) {
                    throw err;
                }
                if (result.length > 0) {
                    res.render('reset');
                } else {
                    res.end("This link has expired.")
                }
            });
        } else {
            res.end("Wrong confirmation URL");
        }
    });

    /*
        Description:
        TODO(-s):
        */
    app.post("/reset", function(req, res) {
        var databaseQuery = "SELECT * FROM reset_pass WHERE verification_code =" + dbcon.escape(req.query.id) + " AND used_flag = 0;";
        dbcon.query(databaseQuery, function(err, result) {
            databaseQuery = "UPDATE perm_users SET password = " + dbcon.escape(req.body.password) + " WHERE user_id = " + result[0].user_id + ";";
            databaseQuery += "UPDATE reset_pass SET used_flag = 1 WHERE user_id = " + result[0].user_id + ";";
            dbcon.query(databaseQuery, function(err, result) {
                if (err) {
                    throw err;
                }
                console.log(result.affectedRows + " record(s) updated");
                res.end("Password has been successfully reset");
            });
        });
    });

    app.get("/register", function(req, res) {
        res.render("registrationpage", {
            email: req.query.email
        });
    });

    app.post('/register', isAlreadyRegistered, function(req, res) {
        var databaseQuery = "INSERT INTO temp_users (first_name,last_name,email,birth_month,birth_day,birth_year,university,country,state,zip,password) VALUES (" +
            dbcon.escape(req.body.firstName) + "," +
            dbcon.escape(req.body.lastName) + "," +
            dbcon.escape(req.body.email) + "," +
            dbcon.escape(req.body.birthmonth) + "," +
            dbcon.escape(req.body.birthday) + "," +
            dbcon.escape(req.body.birthyear) + "," +
            dbcon.escape(req.body.university) + "," +
            dbcon.escape(req.body.country) + "," +
            dbcon.escape(req.body.state) + "," +
            dbcon.escape(req.body.zip) + "," +
            dbcon.escape(req.body.password) + ")";

        dbcon.query(databaseQuery, function(err, result) {
            if (err) {
                throw err;
            } else {
                console.log(result.affectedRows + "records updated.");
                sendEmailConfirmation(req.body.email, res);
            }
        });
    });

    app.get("/market/post", function(req, res) {
        res.render("createListing");
    });

    app.post("/market/post", upload.single("uploadPhoto"), function(req, res) {
        var databaseQuery = "INSERT INTO listings (user_id, name, price, category, bio, info, picture) VALUES (" +
            "0" + ", " + dbcon.escape(req.body.listingName) + ", " + dbcon.escape(req.body.listingPrice) +
            ", " + dbcon.escape(req.body.listingCategory) + ", " + dbcon.escape(req.body.listingBio) +
            ", " + dbcon.escape(req.body.listingInfo) + ", " + dbcon.escape(req.file.path) + ");";
        dbcon.query(databaseQuery, function(err, result) {
            res.end("Listing was created successfully");
        });
    });
	
	app.get("/user/:id", function(req, res) {
		var id = req.params.id;
		var databaseQuery = "SELECT * FROM perm_users WHERE user_id =" + id;
		dbcon.query(databaseQuery, function(err, result) {
			if(err) {
				throw err;
			}
			if(typeof result[0] !== 'undefined') {
            // temporary variable
            var myid = 0;
            //Checking if user is authenticated
            if(req.isAuthenticated()) {
                //Checking if user's profile is personal
                if(req.user.user_id == id) {
                    //If true, render use's personal profile page
                    res.render("myUserPage", {
                    firstName: result[0].first_name,
                    lastName: result[0].last_name,
                    email: result[0].email,
                    month: result[0].birth_month,
                    day: result[0].birth_day,
                    year: result[0].birth_year,
                    university: result[0].university,
                    country: result[0].country,
                    state: result[0].state
                
                    });
                }
            }
            //Render public version of user page
			res.render("userPage", {
				firstName: result[0].first_name,
				lastName: result[0].last_name,
				email: result[0].email,
				month: result[0].birth_month,
				day: result[0].birth_day,
				year: result[0].birth_year,
				university: result[0].university,
				country: result[0].country,
				state: result[0].state
				
			});
			}
			else {
				res.end("user does not exist");
			}
		});
		console.log("triggere2d");
	});

    passport.serializeUser(function(user, done) {
        done(null, user.user_id);
    });

    passport.deserializeUser(function(id, done) {
        dbcon.query("SELECT * FROM perm_users WHERE user_id = ?", [id], function(err, rows) {
            done(err, rows[0]);
        });
    });

    passport.use('local-login',
        new LocalStrategy({
                usernameField: 'email',
                passwordField: 'password'
            },
            function(email, password, done) {
                dbcon.query("SELECT * FROM perm_users WHERE email = " + dbcon.escape(email), function(err, rows) {
                    if (err) {
                        return done(err);
                    }
                    if (!rows.length) {
                        return done(null, false);
                    }

                    if (rows[0].password != password) {
                        return done(null, false);
                    } else {
                        return done(null, rows[0]);
                    }
                });
            }));

    app.post("/login", passport.authenticate('local-login', {failureRedirect: "/login"}),
        function(req, res) {
            if (req.body.remember) {
                req.session.cookie.maxAge = 1000 * 60 * 3;
            } else {
                req.session.cookie.expires = false;
            }
            res.redirect("/user/" + req.user.user_id);
        });

    function isLoggedIn(req, res, next) {

        // if user is authenticated in the session, carry on
        if (req.isAuthenticated())
            return next();

        // if they aren't redirect them to the login page
        res.redirect('/login');
    }

    function isAlreadyRegistered (req, res, next) {
        var databaseQuery = "SELECT * FROM perm_users where email = " + dbcon.escape(req.body.email);
        dbcon.query(databaseQuery, function(err, result){
           if(!result.length){
               return next();
           } else {
               res.end("This e-mail is already in use.");
           }
        });
    }

    app.use(function(req, res, next){
        res.status(404).end("Sorry, page not found");
    });
};