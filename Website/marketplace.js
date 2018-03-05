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

}