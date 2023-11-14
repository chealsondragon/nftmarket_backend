/*
Project : Cryptotrades
FileName : route.js
Author : LinkWell
File Created : 21/07/2021
CopyRights : LinkWell
Purpose : This is the file which used to define all route releated to user api request.
*/

var express = require('express')
var router = express.Router();
var userController = require("./../controller/userController")
const { check } = require('express-validator');
var auth = require("./../../../middleware/auth");
var adminauth = require("./../../../middleware/adminauth");

router.post('/login',[check('user_account').not().isEmpty()],userController.login)

router.post('/update',[check('username').not().isEmpty()], [auth], userController.update)

router.post('/opt_verify',[check('opt_code').not().isEmpty(), [auth]],userController.optVerify)

router.post('/getUserDetail', [check('owner').not().isEmpty()], userController.getUserDetail)

router.post('/getUserDetailById', [check('_id').not().isEmpty()], userController.getUserDetailById)
module.exports = router