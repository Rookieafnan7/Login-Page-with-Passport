//jshint esversion:6
require("dotenv").config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const md5 = require("md5");
const bcrypt = require("bcrypt");
const saltRounds = 10;

mongoose.set('strictQuery', false);
mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    email:String,
    password:String
})




const User = new mongoose.model("user",userSchema);



const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended : true}));

app.get("/",function(req,res){
    res.render("home");
})

app.get("/login",function(req,res){
    res.render("login");
})

app.get("/register",function(req,res){
    res.render("register");
})

app.get("/secrets",function(req,res){
    res.render("secrets");
})

app.get("/submit",function(req,res){
    res.render("submit");
})


app.post("/register",function(req,res){
    // console.log("working!");

    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        const newUser = new User({
            email:req.body.username,
            password:hash
        })
        newUser.save(function(err){
            if(err){
                console.log(err)
            }else{
                res.render("secrets");
            }
        })
    });    
    
})

app.post("/login",function(req,res){
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({email:username},function(err,foundUser){
        if(err){
            console.log(err);
            res.redirect()
        }else{
            if(foundUser){
                bcrypt.compare(password, foundUser.password, function(err, result) {
                    if(err){
                        res.redirect("/login");
                    }
                    if(result===true){
                        res.render("secrets");
                    }else{
                        res.redirect("/login");
                    }
                });
            }
        }
    })
})

app.listen(3000,function(){
    console.log("Server started at port 3000");
})