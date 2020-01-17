// ENVIRONMENT
require('dotenv').config()

// REQUIREMENTS
const express             = require("express"),
    app                   = express(),
    mongoose              = require("mongoose"),
    bodyParser            = require("body-parser"),
    serveStatic           = require("serve-static"),
    methodOverride        = require("method-override"),
    schedule              = require("node-schedule"),
    path                  = require('path'),
    cookieParser          = require('cookie-parser'),
    passportSetup         = require('./passport-config').setup
    spawn                 = require('./exports/exports').spawn

// Additional functions
const logic = require("./serverLogic/stats"),
      updateStats = logic.updateStats

// ROUTES
const AuthRoutes = require("./routes/auth"),
      IndexRoutes = require("./routes/index"),
      ItemRoutes = require("./routes/items"),
      CommentRoutes = require("./routes/comments"),
      ShopperRoutes = require("./routes/shopper"),
      ServiceRoutes = require("./routes/services"),
      UsersRoutes = require('./routes/users')

// Cookies
app.use(cookieParser())

// VIEW ENGINE SETUP
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, 'public')));

// MONGOOSE
mongoose.connect("mongodb+srv://admin:admin@emailsaver-xwdou.gcp.mongodb.net/test?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true});

// SHOW USER MIDDLEWARE
app.use(function(req, res, next){
    res.locals.user = req.user;
    next();
});

// PASSPORT STRATEGYSETUP
passportSetup(app)

// ROUTES CONFIGURATION
app.use(AuthRoutes);
app.use("/items", ItemRoutes);
app.use(CommentRoutes);
app.use("/itemManager", ShopperRoutes);
app.use("/main", ServiceRoutes);
app.use(UsersRoutes);
app.use(IndexRoutes);

// SET UP FORMATTED DATE OUTPUT
Date.prototype.showDate = function(){
    var mm = this.getMonth() + 1; // getMonth() is zero-based
        var dd = this.getDate();

    return [this.getFullYear(),
            (mm>9 ? '' : '0') + '-' + mm,
            (dd>9 ? '' : '0') + '-' + dd
            ].join('');
};

// Updating statistics about each item
schedule.scheduleJob('0 0 0 1 * *', updateStats);

let date = new Date()
// LISTENER
app.listen(80, function(){
    console.log("Server has started at " + date.getHours() + ":" + date.getMinutes());
});
