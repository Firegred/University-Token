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

module.exports = function (app, dbcon) {

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
                throw err;
            }
            if(!rows.length){
                res.end("No listing with such id");
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
                res.end("No such listing");
            } else {
                if(hasEnoughFunds()){
                    dbcon.query("DELETE FROM listings WHERE id = ?", [listingId], function(err, rows){
                        if(err){
                            throw err;
                        }
                        addListingToCompleted(rows[0]);
                        performTransaction();
                        notifySeller();
                        res.end("Transaction was successful");
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