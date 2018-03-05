module.exports = function (app, dbcon, smtpTransport, host) {

    app.get("/register", function (req, res) {
        var email = req.query.email;
        res.render("registrationpage", {
            email: email
        });
    });

    app.post('/register', isAlreadyRegistered, function (req, res) {
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

        dbcon.query(databaseQuery, function (err, result) {
            if (err) {
                throw err;
            } else {
                console.log(result.affectedRows + "records updated.");
                sendEmailConfirmation(req.body.email, res);
            }
        });
    });

    function isAlreadyRegistered(req, res, next) {
        var databaseQuery = "SELECT * FROM perm_users where email = " + dbcon.escape(req.body.email);
        dbcon.query(databaseQuery, function (err, result) {
            if (!result.length) {
                return next();
            } else {
                res.end("This e-mail is already in use.");
            }
        });
    }

    app.get('/verify', function (req, res) {
        if ((req.protocol + "://" + req.get('host')) == ("http://" + host)) {
            var databaseQuery = "SELECT * FROM temp_users WHERE verification_code = " + dbcon.escape(req.query.id);
            dbcon.query(databaseQuery, function (err, result) {
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
                    dbcon.query(databaseQuery, function (err, result) {
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

    function sendEmailConfirmation(email, res) {
        var confirmationToken = (1 + Math.random()).toString(36).substring(2, 18);
        var databaseQuery = "UPDATE temp_users SET verification_code = " +
            dbcon.escape(confirmationToken) + " WHERE email = " + dbcon.escape(email);
        dbcon.query(databaseQuery, function (err, result) {
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
            smtpTransport.sendMail(mailOptions, function (error, response) {
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

}