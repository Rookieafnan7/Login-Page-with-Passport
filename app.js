require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

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
        passworsord :String
    });

    userSchema.plugin(passportLocalMongoose);

    const User = mongoose.model('User', userSchema);

    passport.use(User.createStrategy());
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());

    app.get('/', (req, res) => {
        res.render('home');
    });

    app.get('/login', (req, res) => {
        res.render('login');
    });

    app.get('/register', (req, res) => {
        res.render('register');
    });
    
    app.get('/secrets', (req, res) => {
        if(req.isAuthenticated()){
            res.render('secrets');
        }else{
            res.redirect('/login');
        }
    })

    app.get('/logout', (req, res) => {
        req.logout();
        res.redirect('/');
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