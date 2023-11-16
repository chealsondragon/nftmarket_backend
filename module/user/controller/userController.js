/*
Project : Cryptotrades
FileName : userController.js
Author : LinkWell
File Created : 21/07/2021
CopyRights : LinkWell
Purpose : This is the file which used to define all user related api function.
*/

var users = require('./../model/userModel')
var jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
var config = require('./../../../helper/config')
var moment = require('moment');
const { random } = require('lodash');
const crypto = require('crypto');

/**************************************************************
*  This is the function which used to create new user and login.
**************************************************************/
exports.login = function(req,res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.json({
            status: false,
            message: "Request failed",
            errors:errors.array()
        });
        return;
    }  
    
    params = {account:req.body.user_account.toLowerCase()};
    this.getToken(params,req,res);
}

/**********************************************************
*  This function used to find whether user name exist or not
***********************************************************/
checkUserExist = function (req,res,callback) {
    if(req.body.user_account.toLowerCase()) {      
        users.find({'account':req.body.user_account},function(err,data) {
            if(err) {
                res.json({
                    status: false,
                    message: "Request failed",
                    errors:err
                });
                return;
            }

            if(data.length>0) {
                callback(true)
            }
        })
    } else {
        res.json({
            status: false,
            message: "User account is required",
            errors:"User account is required"
        });
        return;
    }
}

/************************************************************
 * This is the function which used to process getting token
 ***********************************************************/
getToken = function(params,req,res) {
    users.findOne(params, function (err, user) {
        if (err) {
            res.json({
                status: false,
                message: "Request failed",
                errors:err
            });
            return;
        }
        if(this.isEmptyObject(user)) {
            let token = jwt.sign({authenticated: false, username: "", email: "", phone:"", profile_image:"", status:"", website_url:"", twitter_info:"", telegram_info:"", account:params.account, desc: ""},
                config.secret_key,
                { expiresIn: '24h' // expires in 24 hours
                }
            );
            res.json({
                status: true,
                token:token,
                message:"not found user",
            }); 
            return;
        } 
        let token = jwt.sign({authenticated: true, username: user.username, email: user.email, phone:user.phone, profile_image:user.profile_image, status:user.status, website_url:user.website_url, twitter_info:user.twitter_info, telegram_info:user.telegram_info, account:user.account, desc: user.desc, user_id:user._id},
            config.secret_key,
            { expiresIn: '24h' // expires in 24 hours
            }
        );
        res.json({
            status: true,
            token:token,
            message:"login successful",
        }); 
    });
}

/*********************************************************
*  This is the function which used to update user profile
**********************************************************/
exports.update = function(req,res) {
    users.findOne({account:req.decoded.account.toLowerCase()}, function (err, user) {
        if (err) {
            res.json({
                status: false,
                message: "Request failed",
                errors:err
            });
            return;
        }

        if(this.isEmptyObject(user)) {
            var user_new = new users();
            user_new.username = req.body.username;
            user_new.email = req.body.email;
            user_new.account = req.decoded.account.toLowerCase();
            user_new.phone = req.body.phone;
            user_new.profile_image = req.body.profile_image;
            user_new.website_url = req.body.website_url;
            user_new.twitter_info = req.body.twitter_info;
            user_new.telegram_info = req.body.telegram_info;
            user_new.desc = req.body.desc;
            user_new.status = 'active';
           
            // const opt_code = random(1000000, 9999999);
            // const activation_code = crypto.createHash('md5').update(opt_code.toString()).digest('hex');
            // console.log(opt_code);
            // mailer.mail({
            //     Name : user_new.username,
            //     content:"For verify your email address, enter this verification code when prompted: "+ opt_code
            // },user_new.email,'Email Verification',config.site_email,function(error,result) {
            //     if(error) {
            //         console.log("email not working");
            //     }   
                // user_new.activation_code = activation_code;

                user_new.save(function (err , user_new) {
                    if (err) {
                        res.json({
                            status: false,
                            message: "Request failed",
                            errors:err
                        });
                        return;
                    } 
                        
                    let token = jwt.sign({authenticated: true, username: user_new.username,email: user_new.email,phone:user_new.phone,profile_image:user_new.profile_image,status:user_new.status,website_url:user_new.website_url,twitter_info:user_new.twitter_info,telegram_info:user_new.telegram_info, account:user_new.account, desc:user_new.desc, user_id:user_new._id},
                        config.secret_key,
                        { expiresIn: '24h' // expires in 24 hours
                        }
                    );
                    res.json({
                        status: true,
                        token: token,
                        message:"update success",
                    });
                    return;
                });
                return;
            // });
        }
        if(user.status == 'inactive') {
            console.log("dddsssss")
            res.json({
                status: false,
                message:"Your account has been inactive. Contact admin to activate your account"
            });
            return;
        }
        if(user.status == 'blocked') {
            res.json({
                status: false,
                message:"Your account has been blocked. Contact admin to activate your account"
            });
            return;
        } 
        
        user.username = req.body.username ? req.body.username : user.username;
        user.email = req.body.email ? req.body.email : user.email;
        user.website_url = req.body.website_url ? req.body.website_url : user.website_url;
        user.twitter_info = req.body.twitter_info ? req.body.twitter_info : user.twitter_info;            
        user.telegram_info = req.body.telegram_info ? req.body.telegram_info : user.telegram_info;
        user.phone = req.body.phone ? req.body.phone : user.phone;
        user.desc = req.body.desc ? req.body.desc : user.desc;
        user.status = 'active';
        user.profile_image = req.body.profile_image? req.body.profile_image : user.profile_image;
        user.modified_date = moment().format();

        // const opt_code = random(1000000, 9999999);
        // const activation_code = crypto.createHash('md5').update(opt_code.toString()).digest('hex');
        // console.log(opt_code);
        // mailer.mail({
        //     Name : user.username,
        //     content:"For verify your email address, enter this verification code when prompted: "+ opt_code
        // },user.email,'Email Verification',config.site_email,function(error,result) {
        //     if(error) {
        //         console.log("email not working");
        //     }   
            // user.activation_code = activation_code;

            // save the user and check for errors
            let params ={
                'username': user.username,
                'email': user.email,
                'website_url': user.website_url,
                'twitter_info': user.twitter_info,
                'telegram_info': user.telegram_info,
                'profile_image': user.profile_image,
                'activation_code': user.activation_code,
                'status': user.status,
                'phone': user.phone,
                'desc': user.desc,
            };
            
            users.updateMany({_id: user._id}, {'$set': params}, function(err) {
                if (err) {
                    let w_err = "Request failed";
                    if(err.errors.username) {
                        w_err = 'Metadata already Exist'
                    }
                    res.json({
                        status: false,
                        message: w_err,
                        errors:err
                    });
                    return
                }    
                
                let token = jwt.sign({authenticated: true, username: user.username,email: user.email,phone:user.phone,profile_image:user.profile_image,status:user.status,website_url:user.website_url,twitter_info:user.twitter_info,telegram_info:user.telegram_info, account:user.account, desc:user.desc, user_id:user._id},
                    config.secret_key,
                    { expiresIn: '24h' // expires in 24 hours
                    }
                );
                res.json({
                    status: true,
                    token: token,
                    message:"update success",
                });
                return;
            });
        });
        
    // });
}

exports.optVerify = function(req,res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.json({
            status: false,
            message: "Request failed",
            errors:errors.array()
        });
        return;
    }  

    const activation_code = crypto.createHash('md5').update(req.body.opt_code.toString()).digest('hex');
    
    users.findOne({activation_code: activation_code}, function (err, user) {
        if (err) {
            res.json({
                status: false,
                message: "Request failed",
                errors:err
            });
            return;
        }
        if(this.isEmptyObject(user)) {
            res.json({
                status: false,
                message: "User not found",
            });
            return;
        } 
        // save the user and check for errors
        let params ={
            'status': 'active'
        };
        
        users.updateMany({_id: user._id}, {'$set': params}, function(err) {
            if (err) {
                let w_err = "Request failed";
                if(err.errors.username) {
                    w_err = 'Metadata already Exist'
                }
                res.json({
                    status: false,
                    message: w_err,
                    errors:err
                });
                return
            }    
            let token = jwt.sign({authenticated: true, username: user.username,email: user.email,phone:user.phone,profile_image:user.profile_image,status:user.status,website_url:user.website_url,twitter_info:user.twitter_info,telegram_info:user.telegram_info, account:user.account, desc:user.desc},
                config.secret_key,
                { expiresIn: '24h' // expires in 24 hours
                }
            );
            res.json({
                status: true,
                token: token,
                message:"update success",
            });
            return;
        });
    });
}

/******************************************************
 *   This is the function to get user info by wallet address
 *****************************************************/
exports.getUserDetail = function(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.json({
            status: false,
            message: "Request failed",
            errors:errors.array()
        });
        return;
    }  

    users.findOne({account: req.body.owner.toLowerCase()}, function (err, user) {
        if (err) {
            res.json({
                status: false,
                message: "Request failed",
                errors:err
            });
            return;
        }
        if(this.isEmptyObject(user)) {
            res.json({
                status: false,
                message: "User not found",
            });
            return;
        } 
        res.json({
            status: true,
            message: "user retrieved successfully",
            data: user
        });
    });
}

/******************************************************
 *   This is the function to get user info by id
 *****************************************************/
exports.getUserDetailById = function(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.json({
            status: false,
            message: "Request failed",
            errors:errors.array()
        });
        return;
    }  

    users.findOne({_id: req.body._id}, function (err, user) {
        if (err) {
            res.json({
                status: false,
                message: "Request failed",
                errors:err
            });
            return;
        }
        if(this.isEmptyObject(user)) {
            res.json({
                status: false,
                message: "User not found",
            });
            return;
        } 
        res.json({
            status: true,
            message: "user retrieved successfully",
            data: user
        });
    });
}

/******************************************************
 *   This is the function check object is empty or not
 *****************************************************/
isEmptyObject = function (obj) {
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        return false;
      }
    }
    return true;
}