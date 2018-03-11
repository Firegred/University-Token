/*flash message*/
var express = require('express');
const flash = require('connect-flash');
const session = require('express-session');
const app = express();
app.use(session({ secret: 'zxcv' })); // session secret
/*flash message*/

module.exports = function (app, dbcon, smtpTransport, host) {
    /*needed for flash messages*/
    app.use(flash()); // use connect-flash for flash messages stored in session
    app.use(function(req, res, next){
        res.locals.success = req.flash('success');
        res.locals.warning = req.flash('warning');
        next();
    });

    app.get("/user/:id", function(req, res) {
        var id = req.params.id;
        var databaseQuery = "SELECT * FROM perm_users WHERE user_id =" + id;
        dbcon.query(databaseQuery, function(err, result) {
            if(err) {
                res.render('error');
            }
            console.log(result);
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
            } else {
                if(result.length) {
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
                } else {
                    req.flash('warning', 'No user exists with that id.');
                    res.redirect('index');
                }
            }
        });
        console.log("triggere2d");
    });

    app.get('/resetpassword', function (req, res) {
        res.render('resetpassword');
    });

    app.post('/resetpassword', function (req, res) {
        var databaseQuery = "SELECT * FROM reset_pass WHERE email = " + dbcon.escape(req.body.email) + " AND used_flag = 0";
        dbcon.query(databaseQuery, function (err, result) {
            if (err) {
                res.render('error');
            }
            if (!result.length) {
                databaseQuery = "SELECT * FROM perm_users WHERE email = " + dbcon.escape(req.body.email) + ";";
                dbcon.query(databaseQuery, function (err, result) {
                    if (err) {
                        res.render('error');
                    }
                    if (result.length > 0) {
                        var confirmationToken = (1 + Math.random()).toString(36).substring(2, 18);
                        databaseQuery = "INSERT INTO reset_pass (user_id, verification_code, email, used_flag) VALUES (" +
                            result[0].user_id + ", " + dbcon.escape(confirmationToken) + ", " + dbcon.escape(result[0].email) + ", 0)";
                        dbcon.query(databaseQuery, function (err, result) {
                            if (err) {
                                res.render('error');
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
                                    res.render('error');
                                } else {
                                    req.flash('success', 'A link to reset your password has been sent to your email.');
                                    res.render('index');
                                }
                            });
                        });
                    } else {
                        // If user is not actually in the database [not registered / haven't confirmed registration],
                        // do not send an email while saying that we did to avoid disclosing info about users of the website
                        req.flash('success', 'A link to reset your password has been sent to your email.');
                        res.redirect('index');
                    }
                });
            } else {
                req.flash('warning', 'You have already requested a password reset, please check your email.');
                res.redirect('index');
            }
        });
    });

    app.get("/reset", function (req, res) {
        if ((req.protocol + "://" + req.get('host')) == ("http://" + host)) {
            var databaseQuery = "SELECT * FROM reset_pass WHERE verification_code =" + dbcon.escape(req.query.id) + " AND used_flag = 0;";
            dbcon.query(databaseQuery, function (err, result) {
                if (err) {
                    res.render('error');
                }
                if (result.length > 0) {
                    res.render('reset');
                } else {
                    req.flash('warning', 'This link has expired.');
                    res.redirect('index');
                }
            });
        } else {
            req.flash('warning', 'Wrong confirmation link.');
            res.redirect('index');
        }
    });

    app.post("/reset", function (req, res) {
        var databaseQuery = "SELECT * FROM reset_pass WHERE verification_code =" + dbcon.escape(req.query.id) + " AND used_flag = 0;";
        dbcon.query(databaseQuery, function (err, result) {
            databaseQuery = "UPDATE perm_users SET password = " + dbcon.escape(req.body.password) + " WHERE user_id = " + result[0].user_id + ";";
            databaseQuery += "UPDATE reset_pass SET used_flag = 1 WHERE user_id = " + result[0].user_id + ";";
            dbcon.query(databaseQuery, function (err, result) {
                if (err) {
                    res.render('error');
                }
                console.log(result.affectedRows + " record(s) updated");
                req.flash('success', 'Password has been successfully reset.');
                res.redirect('index');
            });
        });
    });

}