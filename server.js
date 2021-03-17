var express = require('express')
var app = express()

var formidable = require('express-formidable')
app.use(formidable())


var mongodb = require('mongodb')
var mongoClient = mongodb.MongoClient
var ObjectId = mongodb.ObjectID


var http = require('http').createServer(app)
var bcrypt = require('bcrypt')
var fileSystem = require('fs')

var jwt = require('jsonwebtoken')
var accessTokenSecret = "myAccesTokenSecret1234567890"

app.use("/public",express.static(__dirname + "/public"))
app.set("view engine", "ejs")

var socketIO = require("socket.io")(http)
var socketId=""
var users = []

var mainURL = "http://localhost:3000"
socketIO.on("connection",function (socket) {
    console.log("User connected" , socket.id)
    socketId = socket.id ;
})

http.listen(3000 , () => {
    console.log("server Started")

    mongoClient.connect("mongodb://localhost:27017",function (error,client) {
        var database = client.db("pub_soc_db")
        console.log('database connected')

        app.get("/signup", function (request,response) {
            response.render("signup")

        })

        app.get('/login', (req, res) => {
             res.render('login');
        });

        app.post('/signup', (req, res) => {
            var name = req.fields.name ;
            var username = req.fields.username;
            var email = req.fields.email;
            var password = req.fields.password;
            var gender = req.fields.gender;

            database.collection("users").findOne({
                $or : [
                    {
                        "email" : email
                    },
                    {
                        "username" : username
                    }
                ]},function (err,user) {
                    if (user == null) {
                        bcrypt.hash(password,10,function (err,hash) {
                            database.collection("users").insertOne({
                                "name" : name,
                                "username" : username ,
                                "email" : email,
                                "password" : hash,
                                "gender" : gender ,
                                "profileImage" : "" ,
                                "coverPhoto" : "" ,
                                "dob" : "" ,
                                "city" : "" ,
                                "country" : "" ,
                                "aboutMe" : "" ,
                                "friends" : [] ,
                                "pages" : [] ,
                                "notifications" : [] ,
                                "groups" : [] ,
                                "posts" : []
                            },function (err,data) {
                                /* res.json({
                                    "status" : "success" ,
                                    "message" : "Signed up successfully , You can login now ..."
                                }) */
                                if (!error) {
                                    res.redirect("/login")
                                }
                            })
                    })
                    
                    }else{
                        res.json({
                            "status" : "error" ,
                            "message" : "Email or username already exist ... "
                        })
                    }
                }
            )

        /* app.get('/login', (request, response) => {
            return response.render("login")
        }); */

        app.post('/login', (request,response) => {
            var email = req.fields.email;
            var password = req.fields.password;

            database.collection("users").findOne({
                "email" : email     
                },function (error,user) {
                    if (user==null) {
                        response.json({
                            "status" : "error" ,
                            "message" : "Email does not exist "
                        })
                    }else{
                        bcrypt.compare(password,user.password,function (error,isVerify) {
                            if (isVerify) {
                                var accessToken = jwt.sign({"email" : email} , accessTokenSecret)
                                database.collection('users').findOneAndUpdate({
                                    "email" : email
                                },{
                                    $set:{
                                        "accessToken" : accessToken
                                    }
                                },function (error , data) {
                                    response.json({
                                        "status" : "success" ,
                                        "message" : "Login successfully " ,
                                        "accessToken" : accessToken ,
                                        "profileImage" : user.profileImage
                                    })
                                })
                            }else{
                                response.json({
                                    "status" : "error" ,
                                    "message" : "Password is not correct ! "
                                })
                            }
                        })
                    }
                })
                
            });
        });
    })
})


