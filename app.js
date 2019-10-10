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
    schedule              = require("node-schedule");

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

// MAKE FOLDER PUBLIC
app.use('/views/static/assets/', express.static('views/static/assets/'));

// CONFIGURATION AND MONGOOSE
mongoose.connect("mongodb://localhost/umsats", {useNewUrlParser: true});
app.use(serveStatic('./views'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));

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
app.use(IndexRoutes);
app.use("/items", ItemRoutes);
app.use("/items/:id/comments", CommentRoutes);
app.use("/itemManager", ShopperRoutes);
app.use("/main", ServiceRoutes);

// LISTENER
app.listen(3000, function(){
    date = new Date();
    console.log("Server has started at " + date.getHours() + ":" + date.getMinutes());
});

// Updating statistics about each item
schedule.scheduleJob('0 0 0 1 * *', updateStats);