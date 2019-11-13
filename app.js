// REQUIREMENTS
const express =             require("express"),
    app =                   express(),
    mongoose =              require("mongoose"),
    passport =              require("passport"),
    bodyParser =            require("body-parser"),
    localStrategy =         require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
    User                  = require("./models/user"),
    cameBack              = require("./models/cameBack"),
    serveStatic           = require("serve-static"),
    methodOverride        = require("method-override"),
    ADMIN                 = require("./exports/exports").ADMIN,
    schedule              = require("node-schedule"),
    path                  = require('path'),
    cookieParser               = require('cookie-parser');

// Additional functions
const logic = require("./serverLogic/stats"),
      updateStats = logic.updateStats;

// ROUTES
const AuthRoutes = require("./routes/auth"),
      IndexRoutes = require("./routes/index"),
      ItemRoutes = require("./routes/items"),
      CommentRoutes = require("./routes/comments"),
      ShopperRoutes = require("./routes/shopper"),
      ServiceRoutes = require("./routes/services");

// VIEW ENGINE SETUP
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, 'public')))

// Cookies
app.use(cookieParser())


// MONGOOSE
mongoose.connect("mongodb://localhost/umsats", {useNewUrlParser: true});

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    // can be anything
    secret: "The String used to encode and decode the sessions",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// SHOW USER MIDDLEWARE
app.use(function(req, res, next){
    res.locals.user = req.user;
    res.locals.ADMIN = req.user != undefined && req.user._id == ADMIN;
    next();
});

// ROUTES CONFIGURATION
app.use(AuthRoutes);
app.use("/items", ItemRoutes);
app.use("/items/:id/comments", CommentRoutes);
app.use("/itemManager", ShopperRoutes);
app.use("/main", ServiceRoutes);
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

// LISTENER
app.listen(3000, function(){
    date = new Date();
    console.log("Server has started at " + date.getHours() + ":" + date.getMinutes());
});

// Updating statistics about each item
schedule.scheduleJob('0 0 0 1 * *', updateStats);