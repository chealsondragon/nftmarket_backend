/*
Project : Cryptotrades
FileName : userModel.js
Author : LinkWell
File Created : 21/07/2021
CopyRights : LinkWell
Purpose : This is the file which used to define user collection that will communicate and process user information with mongodb through mongoose ODM.
*/

var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate-v2');
var uniqueValidator = require('mongoose-unique-validator');
var config = require('./../../../helper/config')
var validator = require('validator');

// Setup schema
var userSchema = mongoose.Schema({
    username: {
        type: String
    },
    email: {
        type: String,
        unique: [ true , 'Email already exists. Please try a different email address'],
        validate: [ validator.isEmail, 'Oops, please enter a valid email address' ]
    },
    account: {
        type: String,
        unique: [ true , 'account already exists. Please try a different account']
    },     
    phone: {
        type: String,
    },
    profile_image: String,    
    website_url: String,            
    twitter_info: String,
    telegram_info: String,
    desc: String,
    activation_code: String,
    status:{
        type: String,
        enum : ['active','inactive','blocked']
    },
    create_date: {
        type: Date,
        default: Date.now
    }
});

userSchema.plugin(uniqueValidator);
userSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('users', userSchema,config.db.prefix+'users');