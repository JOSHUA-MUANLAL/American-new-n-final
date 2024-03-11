const express=require('express')
const jwt = require('jsonwebtoken');
const app=express()
const path=require('path')
app.use(express.static('public'));
app.use(express.json());
const ejs = require("ejs");
const viewsPath = path.join(__dirname, 'views'); 

const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', viewsPath);
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
try{

    const UserController=require('./controller/usercontrol');

    app.use('/',UserController)
    console.log("woriking")
    
    app.listen(8080, () => {
        console.log('Server is running on http://localhost:8080');
      })
    





}
catch(error){
    console.log("error in app.js",error)
}