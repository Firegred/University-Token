// Imports
const crypto = require("crypto");
const path = require('path');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: "uploads/",
    filename: function (req, file, callback) {
        crypto.pseudoRandomBytes(16, function (err, raw) {
            if (err) return callback(err);
            callback(null, raw.toString('hex') + path.extname(file.originalname));
        });
    }
});
const upload = multer({
    storage: storage
});
const isLoggedIn = require("./middleware.js").isLoggedIn;

module.exports = function (app, dbcon) {

    /*
    Market router
    Fetches listings from the database and displays them
     */
    app.get('/market', function (req, res) {
        dbcon.query("SELECT * FROM listings", function (err, result, fields) {
            if (err){
                res.render('error');
            } else {
                if(JSON.stringify(req.query) === '{}') {
                    res.render('marketplace', {listings: result, user: req.user});
                    return;
                }
                else {
                    var sortedListings = [];
                    console.log(Array.isArray(req.query.school));
                    res.render('marketplace', {listings: sortedListings, user: req.user});
                    return;
                }
            }
        });
    })

    // Market create listing router
    app.get("/market/post", isLoggedIn, function (req, res) {
        res.render("createListing", {user: req.user});
    });

    /*
    Market create listing submit router
    Stores user provided information for a new listing in the database
     */
    app.post("/market/post", upload.single("uploadPhoto"), function (req, res) {
        var picture = (typeof req.file == "undefined") ? "" : req.file.path; // If no picture is uploaded, picture path is empty
        var databaseQuery = "INSERT INTO listings (user_id, name, price, category, bio, info, picture, university) VALUES " +
            "(?, ?, ?, ?, ?, ?, ?, ?)";
        dbcon.query(databaseQuery, [req.user.user_id, req.body.listingName, req.body.listingPrice,
                req.body.listingCategory, req.body.listingBio, req.body.listingInfo, picture, req.user.university],
            function (err, result) {
                if (err){
                    console.log(err);
                    res.render("error");
                } else {
                    req.flash('success', 'Listing has been successfully created.');
                    res.redirect('/market');
                }
            });
    });

    app.get("/market/view/:id", function (req, res) {
        var listingId = req.params.id;
        dbcon.query("SELECT * FROM listings WHERE id = ?", [listingId], function (err, rows) {
            if (err) {
                res.render('error');
            }
            if (!rows.length) {
                req.flash('warning', 'No listing found with that ID.');
                res.redirect('/market');
            } else {
                res.render("viewListing", {listing: rows[0]});
            }
        });
    });

    app.post("/market/buy", isLoggedIn, function (req, res) {
        var listingId = req.query.id;
        dbcon.query("SELECT * FROM listings where id = ?", [listingId], function (err, result) {
            if (!result.length) {
                req.flash('warning', 'No listing found with that ID.');
                res.redirect('/market');
            } else {
                if (req.user.user_id != result[0].user_id) {
                    if (hasEnoughFunds()) {
                        if (performTransaction()) {
                            dbcon.query("DELETE FROM listings WHERE id = ?", [listingId], function (err, rows) {
                                if (err) {
                                    res.render('error');
                                }
                                addListingToCompleted(result[0], dbcon, req.user.user_id);
                                notifySeller();
                                req.flash('success', 'Transaction successful.');
                                res.redirect('/market');
                            });
                        } else {
                            req.flash('warning', 'There was an error with your transaction. Please, retry later.');
                            res.redirect('/market');
                        }
                    }
                } else {
                    req.flash('warning', 'You cannot buy your own listings.');
                    res.redirect('/market');
                }
            }
        });
    });

    function hasEnoughFunds() {
        return true;
    }

    function performTransaction() {
        return true;
    }

    function addListingToCompleted(listing, dbcon, buyerId) {
        var dbQuery = "INSERT INTO completed_listings (id, buyer_id, seller_id, name, price, category, bio, info, picture)" +
            " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        dbcon.query(dbQuery, [listing.id, buyerId, listing.user_id, listing.name, listing.price,
                listing.category, listing.bio, listing.info, listing.picture],
            function (err, rows) {
                if (err) {
                    throw err;
                } else {
                    console.log("Listing with id " + listing.id + " was successfully moved to completed listings");
                }
            });
    }

    function notifySeller() {

    }
}