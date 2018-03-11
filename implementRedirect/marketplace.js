const crypto = require("crypto");
const path = require('path');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: "uploads/",
    filename: function(req, file, callback) {
        crypto.pseudoRandomBytes(16, function(err, raw) {
            if (err) return callback(err);
            callback(null, raw.toString('hex') + path.extname(file.originalname));
        });
    }
});
const upload = multer({
    storage: storage
});

/*flash message*/
var express = require('express');
const flash = require('connect-flash');
const session = require('express-session');
const app = express();
app.use(session({ secret: 'zxcv' })); // session secret
/*flash message*/

module.exports = function (app, dbcon) {
    app.use(flash()); // use connect-flash for flash messages stored in session
    app.use(function(req, res, next){
        res.locals.success = req.flash('success');
        res.locals.warning = req.flash('warning');
        next();
    });

     app.get('/market', function(req, res) {
        dbcon.query("SELECT * FROM listings", function(err, result, fields) {
            try {
                console.log(result);
                res.render('marketplace', {listings: result});
            } catch (err){
                res.render('error');
            }
        });
    })

    app.get("/market/post", function(req, res) {
        if(!req.isAuthenticated()){
            res.redirect("/login");
        }
        res.render("createListing",{user: req.user});
    });

    app.post("/market/post", upload.single("uploadPhoto"), function(req, res) {
        var picture = (typeof req.file == "undefined") ? "" : req.file.path;
        var databaseQuery = "INSERT INTO listings (user_id, name, price, category, bio, info, picture) VALUES (" +
            "0" + ", " + dbcon.escape(req.body.listingName) + ", " + dbcon.escape(req.body.listingPrice) +
            ", " + dbcon.escape(req.body.listingCategory) + ", " + dbcon.escape(req.body.listingBio) +
            ", " + dbcon.escape(req.body.listingInfo) + ", " + dbcon.escape(picture) + ");";
        dbcon.query(databaseQuery, function(err, result) {
            res.end("Listing was created successfully");
        });
    });

    app.get("/market/view/:id", function(req, res) {
        var listingId = req.params.id;
        dbcon.query("SELECT * FROM listings WHERE id = ?", [listingId], function (err, rows) {
            if (err) {
                res.render('error');
            }
            if(!rows.length){
                req.flash('warning', 'No listing found with that ID.');
                res.redirect('marketplace');
            } else {
                res.render("viewListing", {listing: rows[0]});
            }
        });
    });

    app.get("/market/buy", function(req, res){
        if(!req.isAuthenticated()){
            res.redirect("/login");
        }
        var listingId = req.query.id;
        dbcon.query("SELECT * FROM listings where id = ?", [listingId], function(err, result){
            if(!result.length){
                req.flash('warning', 'No listing found with that ID.');
                res.redirect('marketplace');
            } else {
                if(hasEnoughFunds()){
                    dbcon.query("DELETE FROM listings WHERE id = ?", [listingId], function(err, rows){
                        if(err){
                            res.render('error');
                        }
                        addListingToCompleted(rows[0]);
                        performTransaction();
                        notifySeller();
                        req.flash('success', 'Transaction successful.');
                        res.redirect('marketplace');
                    });
                }
            }
        })

    });

    function hasEnoughFunds(){
        return true;
    }

    function performTransaction(){}

    function addListingToCompleted(listing){}

    function notifySeller(){}
}