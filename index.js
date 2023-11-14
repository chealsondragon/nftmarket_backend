/*
Project : Cryptotrades
FileName : index.js
Author : Ha
File Created : 21/02/2023
CopyRights : Ha
Purpose : This is the main file which is first executed when running nodejs application through command line. It will load all relevant packages and depedencies for API request.
*/

const express = require('express')
const app = express()
const fs = require("fs");
const https = require("https");
var config = require("./helper/config")
var bodyParser = require('body-parser');
var user = require("./module/user/route/user")

var category = require("./module/category/route/category")
var collection = require("./module/collection/route/collection")
var media = require("./module/media/route/media")
var settings = require("./module/common/route/settings")
var item = require("./module/item/route/item");

var mongoose = require('mongoose');
var cors = require('cors')
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
global.__basedir = __dirname;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/media", express.static(__dirname + '/media'));
app.use(cors())

/*
* Below lines used to connect databse moongoose ORM
*/
mongoose.connect('mongodb://'+config.db.host+':'+config.db.port+'/'+config.db.name, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
});
var db = mongoose.connection;
// Added check for DB connection
db.on('connected', () => console.log('Connected'));
db.on('error', () => console.log('Connection failed'));
if(!db) {
   console.log("Error connecting db")
} else {
   console.log("Db connected successfully")
}

/*
* Below lines used to define route for the api services
*/
app.get('/', (req, res) => res.send('Welcome to Cryptotrades API'))
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/user', user)
app.use('/api/settings', settings)
app.use('/api/media', media)
app.use('/api/category', category);
app.use('/api/collection', collection)
app.use('/api/item', item)

/*
* Below lines used to handle invalid api calls
*/
app.use(function (req, res, next) {
    res.status(404).send("Sorry can't find that!")
})
app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).send('Something broke!')
})

/*
* Below lines used to run api service 
*/
//https.createServer(options, app).listen(config.app.port, () => console.log(`Cryptotrades app listening on port ${config.app.port}!`));
app.listen(config.app.port, () => console.log(`Cryptotrades app listening on port ${config.app.port}!`))