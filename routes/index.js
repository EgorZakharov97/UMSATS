var express = require("express");
var router = express.Router();

//-------------
// INDEX ROUTES
//-------------

router.get('/', function(req, res){
    res.redirect('/main')
})

router.get('*', function(req, res){
    res.render("404")
})

module.exports = router;