module.exports = function (app, dbcon, smtpTransport, host) {

    app.get('/resetpassword', function (req, res) {
        res.render('resetpassword');
    });

    app.post('/resetpassword', function (req, res) {
        var databaseQuery = "SELECT * FROM reset_pass WHERE email = " + dbcon.escape(req.body.email) + " AND used_flag = 0";
        dbcon.query(databaseQuery, function (err, result) {
            if (err) {
                throw err;
            }
            if (!result.length) {
                databaseQuery = "SELECT * FROM perm_users WHERE email = " + dbcon.escape(req.body.email) + ";";
                dbcon.query(databaseQuery, function (err, result) {
                    if (err) {
                        throw err;
                    }
                    if (result.length > 0) {
                        var confirmationToken = (1 + Math.random()).toString(36).substring(2, 18);
                        databaseQuery = "INSERT INTO reset_pass (user_id, verification_code, email, used_flag) VALUES (" +
                            result[0].user_id + ", " + dbcon.escape(confirmationToken) + ", " + dbcon.escape(result[0].email) + ", 0)";
                        dbcon.query(databaseQuery, function (err, result) {
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
                            smtpTransport.sendMail(mailOptions, function (error, response) {
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

    app.get("/reset", function (req, res) {
        if ((req.protocol + "://" + req.get('host')) == ("http://" + host)) {
            var databaseQuery = "SELECT * FROM reset_pass WHERE verification_code =" + dbcon.escape(req.query.id) + " AND used_flag = 0;";
            dbcon.query(databaseQuery, function (err, result) {
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

    app.post("/reset", function (req, res) {
        var databaseQuery = "SELECT * FROM reset_pass WHERE verification_code =" + dbcon.escape(req.query.id) + " AND used_flag = 0;";
        dbcon.query(databaseQuery, function (err, result) {
            databaseQuery = "UPDATE perm_users SET password = " + dbcon.escape(req.body.password) + " WHERE user_id = " + result[0].user_id + ";";
            databaseQuery += "UPDATE reset_pass SET used_flag = 1 WHERE user_id = " + result[0].user_id + ";";
            dbcon.query(databaseQuery, function (err, result) {
                if (err) {
                    throw err;
                }
                console.log(result.affectedRows + " record(s) updated");
                res.end("Password has been successfully reset");
            });
        });
    });

}