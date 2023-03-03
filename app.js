require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');


// FB.getLoginStatus(function(response) {
//     statusChangeCallback(response);
// });


// FB.getLoginStatus(function(response) {
//     statusChangeCallback(response);
// });

const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret:"this is our secret",
    resave:false,
    saveUninitialized:false,
    //required to remove?
    //cookies frick things up a lot
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.set('strictQuery', false);

mongoose.connect('mongodb://127.0.0.1:27017/userDB')
   .then(() => {
        console.log('Connected to MongoDB');
    })
  .catch((err) => {
        console.log(err);
    });



    const userSchema = new mongoose.Schema({
        email:String,
        passworsord :String,
        googleId:String,
        facebookId:String,
        secret: String
    });

    userSchema.plugin(passportLocalMongoose);
    userSchema.plugin(findOrCreate);

    const User = mongoose.model('User', userSchema);

    passport.use(User.createStrategy());
    passport.serializeUser(function(user, cb) {
        process.nextTick(function() {
          return cb(null,user.id);
        });
      });
      
      passport.deserializeUser(function(user, cb) {
        process.nextTick(function() {
          return cb(null, user);
        });
      });
  
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
      },
      function(accessToken, refreshToken, profile, cb) {
        // console.log(profile);
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
          return cb(err, user);
        });
      }
    ));

    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: "http://localhost:3000/auth/facebook/secrets"
      },
      function(accessToken, refreshToken, profile, cb) {
        // console.log(profile);
        User.findOrCreate({ facebookId: profile.id }, function (err, user) {
          return cb(err, user);
        });
      }
    ));

    app.get('/', (req, res) => {
        res.render('home');
    });

    app.get('/auth/google',
        passport.authenticate('google', { scope: ["profile"] })
    );

    app.get('/auth/google/secrets', 
        passport.authenticate('google', { failureRedirect: '/login' }),
        function(req, res) {
            // Successful authentication, redirect home.
            res.redirect('/secrets');
    });

    app.get('/auth/facebook',
        passport.authenticate('facebook'));

    app.get('/auth/facebook/secrets',
        passport.authenticate('facebook', { failureRedirect: '/login' }),
        function(req, res) {
            // Successful authentication, redirect home.
            res.redirect('/secrets');
    });

    app.get('/login', (req, res) => {
        res.render('login');
    });

    app.get('/register', (req, res) => {
        res.render('register');
    });
    
    app.get('/secrets', (req, res) => {
        // if(req.isAuthenticated()){
        //     res.render('secrets');
        // }else{
        //     res.redirect('/login');
        // }

        User.find({"secret":{$ne: null}} , function(err,user){
            if(err){
                console.log(err)
            }else{
                if(user){
                    res.render("secrets",{usersWithSecrets:user})
                }
            }
        })
    })

    app.get('/logout', (req, res) => {
        req.logout(function(err) {
            if (err) { 
              return next(err); 
              }
            res.redirect('/');
          });
    })

    app.get('/submit',(req, res) => {
        if(req.isAuthenticated()){
            res.render('submit');
        }else{
            res.redirect('/login');
        }
    })

    app.post('/submit',(req,res)=>{
        const submittedSecret = req.body.secret;
        // console.log(req);
        console.log(req.user);

        User.findById(req.user,(err, user) => {
            if(err){
                console.log(err);
            }else{
                user.secret = submittedSecret;
                user.save((err) => {
                    if(err){
                        console.log(err);
                    }else{
                        console.log('secret saved');
                        res.redirect('/secrets');
                    }
                })
            }
        })
    })

    app.post('/login', (req, res) => {

        const user = new User({
            username:req.body.username,
            password: req.body.password
        });
        req.login(user,(err)=>{
            if(err){
                console.log(err);
            }else{
                passport.authenticate('local')(req,res,()=>{
                    res.redirect('/secrets');
                })
            }
        })
        }
    )

    app.post("/register", (req, res) => {
        User.register(new User({username: req.body.username}), req.body.password, (err, user) => {
            if(err){
                console.log(err);
                res.redirect('/register');
            }else{
                passport.authenticate('local')(req, res, () => {
                    res.redirect('/secrets');
                });
            }
        })
    })

    app.listen(3000, () => {
        console.log('Server started on port 3000');
    })