var express = require("express");
var router = express.Router();

//-------------
// INDEX ROUTES
//-------------

router.get("/", function(req, res){
    res.redirect("/login");
});

module.exports = router;