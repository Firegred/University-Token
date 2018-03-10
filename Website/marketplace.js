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

module.exports = function (app, dbcon) {

    app.get('/market', function (req, res) {
        dbcon.query("SELECT * FROM listings", function (err, result, fields) {
            if (err) throw err;
            res.render('marketplace', {listings: result, user: req.user});
        });
    })

    app.get("/market/post", function (req, res) {
        if (!req.isAuthenticated()) {
            res.redirect("/login");
        } else {
            res.render("createListing", {user: req.user});
        }
    });

    app.post("/market/post", upload.single("uploadPhoto"), function (req, res) {
        var picture = (typeof req.file == "undefined") ? "" : req.file.path;
        var databaseQuery = "INSERT INTO listings (user_id, name, price, category, bio, info, picture) VALUES " +
            "(?, ?, ?, ?, ?, ?, ?)";
        dbcon.query(databaseQuery, [req.user.user_id, req.body.listingName, req.body.listingPrice,
                req.body.listingCategory, req.body.listingBio, req.body.listingInfo, picture],
            function (err, result) {
                res.end("Listing was created successfully");
            });
    });

    app.get("/market/view/:id", function (req, res) {
        var listingId = req.params.id;
        dbcon.query("SELECT * FROM listings WHERE id = ?", [listingId], function (err, rows) {
            if (err) {
                throw err;
            }
            if (!rows.length) {
                res.end("No listing with such id");
            } else {
                res.render("viewListing", {listing: rows[0]});
            }
        });
    });

    app.get("/market/buy", function (req, res) {
        if (!req.isAuthenticated()) {
            res.redirect("/login");
        } else {
            var listingId = req.query.id;
            dbcon.query("SELECT * FROM listings where id = ?", [listingId], function (err, result) {
                if (!result.length) {
                    res.end("No such listing");
                } else {
                    if(req.user.user_id != result[0].user_id) {
                        if (hasEnoughFunds()) {
                            if (performTransaction()) {
                                dbcon.query("DELETE FROM listings WHERE id = ?", [listingId], function (err, rows) {
                                    if (err) {
                                        throw err;
                                    }
                                    addListingToCompleted(result[0], dbcon, req.user.user_id);
                                    notifySeller();
                                    res.end("Transaction was successful");
                                });
                            } else {
                                res.end("There was an error with your transaction. Please, retry later.")
                            }
                        }
                    } else {
                        res.end("You can't buy your own listings");
                    }
                }
            });
        }

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