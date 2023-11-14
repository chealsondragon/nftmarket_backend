/*
Project : Cryptotrades
FileName : collectionController.js
Author : Ha
File Created : 21/02/2023
CopyRights : Ha
Purpose : This is the file which used to define all collection related api function.
*/

var collections = require('../model/collectionModel');
const { validationResult } = require('express-validator');

/***************************************************************
* This is the function which used to add collection in database
***************************************************************/
exports.add = function(req,res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.json({
            status: false,
            message: "Request failed",
            errors:errors.array()
        });
        return;
    }  
    var collection = new collections();
    collection.name = req.body.name;
    collection.description = req.body.description ? req.body.description : '';
    collection.bannerImage = req.body.bannerImage ? req.body.bannerImage : '';
    collection.featuredImage = req.body.featuredImage ? req.body.featuredImage : '';
    collection.logoImage = req.body.logoImage ? req.body.logoImage : '';
    collection.symbol = req.body.symbol ? req.body.symbol : '';
    collection.contract_address = req.body.contract_address ? req.body.contract_address : '';
    collection.chain = req.body.chain ? req.body.chain : 56;
    collection.category = req.body.category ? req.body.category : '';
    collection.tag = req.body.tag ? req.body.tag : '';
    collection.creator = req.body.creator ? req.body.creator : '';
    collection.creatorFee = req.body.creatorFee ? req.body.creatorFee : 0;
    collection.status = 1;
    collection.author_id = req.decoded.user_id;
    
    collection.save(function (err ,collectionObj) {
        if (err) {
            res.json({
                status: false,
                message: "Request failed",
                errors:err
            });
            return;
        }
        res.json({
            status: true,
            message: "Collection created successfully",
            result: collectionObj
        });
    });
}

/*****************************************************************
 * This is the function which used to update collection in database
******************************************************************/
exports.update = function(req,res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.json({
            status: false,
            message: "Request failed",
            errors:errors.array()
        });
        return;
    } 
    
    collections.findOne({_id:req.body._id}, function (err, collection) {
        if (err || !collection) {
            res.json({
                status: false,
                message: "Collection not found",
                errors:err
            });
            return;
        } else {
            collection.name = req.body.name;
            collection.description = req.body.description ? req.body.description : '';
            collection.bannerImage = req.body.bannerImage ? req.body.bannerImage : '';
            collection.featuredImage = req.body.featuredImage ? req.body.featuredImage : '';
            collection.logoImage = req.body.logoImage ? req.body.logoImage : '';
            collection.symbol = req.body.symbol ? req.body.symbol : '';
            collection.category = req.body.category ? req.body.category : '';

            collection.save(function (err , collectionObj) {
                if (err) {
                    res.json({
                        status: false,
                        message: "Request failed",
                        errors:err
                    });
                    return;
                } else {
                    res.json({
                        status: true,
                        message: "Collection updated successfully",
                        result: collectionObj 
                    });  
                }
            });
        }
    });
}

/*****************************************************************
* This is the function which used to delete collection in database
******************************************************************/
exports.delete = function(req,res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.json({
            status: false,
            message: "Request failed",
            errors:errors.array()
        });
        return;
    }  
    collections.findOne({_id:req.body.collection_id}, function (err, collection) {
        if (err || !collection) {
            res.json({
                status: false,
                message: "Collection not found",
                errors:err
            });
            return;
        } 
        if(collection.item_count > 0){
            res.json({
                status: false,
                message: "Collection has items and you can't delete it"
            }); 
        } else {
            collections.deleteOne({_id:req.body.collection_id},function(err) {
                res.json({
                    status: true,
                    message: "Collection deleted successfully"
                }); 
            })
        }
    });
}

/******************************************************
 *  This is the function which used to view collection
 *******************************************************/
exports.view = function(req,res) {
    collections.findOne({_id:req.body._id}).exec( function (err, collection) {
        if (err) {
            res.json({
                status: false,
                message: "Request failed",
                errors:"Collection not found"
            });
            return;
        }
        if(!collection) {
            res.json({
                status: false,
                message: "Request failed",
                errors:"Collection not found"
            });
            return;
        } 
        res.json({
            status: true,
            message: "Collection info retrieved successfully",
            result: collection
        });
    })
}

/****************************************************************
 * This is the function which used to list collection with filters
 ****************************************************************/
exports.list = function(req,res) {
    var keyword = req.body.searchName ? req.body.searchName : '';
    var limit = req.body.paginationLimit ? parseInt(req.body.paginationLimit) : 10;
    var offset = req.body.offset ? parseInt(req.body.offset) : 0;
    var type = req.body.type;
    var query = collections.find();
    var chain = req.body.chain? parseInt(req.body.chain) : 56;

    if ( keyword != '' ) {
        search = { $or: [ { 
            name :   {
                $regex: new RegExp(keyword, "ig")
        }  } , {
            description : {
                $regex : new RegExp ( keyword , "ig")
            }
        }] }
       query = query.or(search)
    }  

    if(type == "my") {
        if(req.decoded.user_id != null) {
            query = query.where('author_id', req.decoded.user_id)
            query = query.where('chain', chain).sort('-create_date');
        }
    } else {
        query = query.where('status' , 1).sort('-create_date')
    }

    var fields = ['name', 'description', 'symbol', 'bannerImage', 'featuredImage', 'logoImage', 'category', 'tag', 'creator', 'creatorFee', 'contract_address']
    collections.find(query, fields, {skip: offset, limit: limit}).then(function (result) {
        res.json({
            status: true,
            message: "Collection retrieved successfully",
            data: result
        });
    }); 
}

/**************************************************************
 * This is the function which used to list all items for admin
 *************************************************************/
exports.getAdminList = function(req,res) {
    var keyword = req.query.keyword ? req.query.keyword : ''; 
    keyword = keyword.replace("+"," ");     
    var page = req.query.page ? req.query.page : '1';  
    var query  = collections.find();
    var offset = ( page == '1' ) ? 0 : ((parseInt(page-1))*10);
    if ( keyword != '' ) {
        search = { $or: [ { 
            name :   {
                $regex: new RegExp(keyword, "ig")
        }  } , {
            description : {
                $regex : new RegExp ( keyword , "ig")
            }
        }] }
       query = query.or(search)
    }    
    query = query.sort('-create_date')
    var options = {
    select:   'name description banner image royalties',
    page:page,
    offset:offset,
    limit:10,    
    };  
    collections.paginate(query, options).then(function (result) {
        res.json({
            status: true,
            message: "Collection retrieved successfully",
            data: result
        });
    });
}

/**************************************************************
 * This is the function to get collection & creator's info
 *************************************************************/
exports.getCollection = function(req,res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.json({
            status: false,
            message: "Request failed",
            errors:errors.array()
        });
        return;
    }  
    var query = collections.find();
    query = query.where('contract_address', req.body.contract);
    collections.find(query).populate('author_id').then(function (results) {
        if (!results) {
            res.json({
                status: false,
                message: "collection not found",
                errors:err
            });
            return;
        }  
        res.json({
            status: true,
            message: "Items retrieved successfully",
            data: results[0]
        });
    })
}


