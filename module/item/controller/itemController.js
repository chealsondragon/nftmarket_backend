/*
Project : Cryptotrades
FileName : itemController.js
Author : LinkWell
File Created : 02/03/2023
CopyRights : LinkWell
Purpose : This is the file which used to define all item related api function.
*/

var items = require('../model/itemModel');
const { validationResult } = require('express-validator');
var collections = require('./../../collection/model/collectionModel');
var users = require('./../../user/model/userModel');
var orders = require('../model/orderModel');
var lists = require('../model/listModel');
var trades = require('../model/tradeModel');
// var ipfsAPI = require('ipfs-api');
// var ipfs = ipfsAPI('ipfs.infura.io', '5001', { protocol: 'https' });
var fs = require('fs');
var config = require("../../../helper/config")
const Moralis = require("moralis").default;
const { EvmChain } = require("@moralisweb3/common-evm-utils");

exports.getMaxTokenSlot = function(req,res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.json({
            status: false,
            message: "Request failed",
            errors:errors.array()
        });
        return;
    }  
    var query = items.find();
    query = query.where('collection_id',req.body.collection_id);
    query = query.sort('-slot');
    query = query.limit(1);
    var fields = ['slot'];
    items.find(query, fields).then(function (result) {
        if(result.length == 0) {
            res.json({
                status: true,
                message: "Items retrieved successfully",
                data: 0
            });
        } else {
            res.json({
                status: true,
                message: "Items retrieved successfully",
                data: result[0].slot
            });
        }
    }); 
}

/*********************************************************
* This is the function which used to add item in database
**********************************************************/
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

    var item = new items();
    item.collection_id = req.body.collection;
    item.current_owner = req.decoded.user_id;
    item.creator = req.decoded.user_id;
    item.lazy_minting = req.body.lazy_minting;
    item.status = "active";
    item.slot = req.body.slot;
    item.fraction = req.body.fraction;
    item.metadata_url = req.body.metadata_url;
    collections.findOne({_id:req.body.collection}, function (err, collection) {
        if (err || !collection) {
            res.json({
                status: false,
                message: "Collection not found",
                errors:err
            });
            return;
        }
        item.save(function (err ,itemObj) {
            if (err) {
                console.log(err)
                res.json({
                    status: false,
                    message: "Request failed",
                    errors:err
                });
                return;
            }
            collection.item_count = collection.item_count + 1;
            collection.save(function (err ,collectionObj) {
                res.json({
                    status: true,
                    message: "Item created successfully",
                    result: itemObj
                });
            });
        })
    });
}

/***********************************************************
* This is the function which used to list item in database
***********************************************************/
exports.list = function(req,res) {
    var keyword = req.body.searchName ? req.body.searchName : '';
    var limit = req.body.paginationLimit ? parseInt(req.body.paginationLimit) : 10;
    var offset = req.body.offset ? parseInt(req.body.offset) : 0;
    var collection = req.body.collection;
    var query = items.find();

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
   
    query = query.where('collection_id',collection)
    query = query.where('listed', false)
    query = query.where('status','active')
    query = query.sort('-create_date');

    var fields = ['fraction', 'slot', 'metadata_url', 'lazy_minting']
    
    items.find(query, fields, {skip: offset, limit: limit}).populate('collection_id').then(function (result) {
        res.json({
            status: true,
            message: "Items retrieved successfully",
            data: result
        });
    }); 
}

/***********************************************************
* This is the function which used to get lazy minted items in database
***********************************************************/
exports.lazyItems = function(req,res) {
    var keyword = req.body.searchName ? req.body.searchName : '';
    var collection = req.body.collection;
    var query = items.find();

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
   
    query = query.where('collection_id',collection)
    query = query.where('listed', false)
    query = query.where('lazy_minting', true)
    query = query.where('status','active')
    query = query.sort('-create_date');

    var fields = ['fraction', 'slot', 'metadata_url', 'lazy_minting']

    users.findOne({account: req.body.owner.toLowerCase()}, function (err, user) {
        if (err || !user) {
            res.json({
                status: false,
                message: "user not found",
                errors:err
            });
            return;
        }
        query = query.where('creator',user._id)
        items.find(query, fields).populate('collection_id').then(function (result) {
            res.json({
                status: true,
                message: "Items retrieved successfully",
                data: result
            });
        }); 
    })
}

/***********************************************************
* This is the function which used to get a item in database
***********************************************************/
exports.getItem = function(req,res) {
    var item_id = req.body.item_id;
    var query = items.find();
    query = query.where('_id', item_id)

    var fields = ['fraction', 'slot', 'type', 'metadata_url', 'current_owner', 'creator', 'detail', 'lazy_minting']
    items.find(query, fields).populate('collection_id').populate('current_owner').populate('creator').then(function (result) {
        res.json({
            status: true,
            message: "Items retrieved successfully",
            data: result
        });
    }); 
}

/***************************************************************
* This is the function which used to add listed item in database
***************************************************************/
exports.marketListItem = function(req,res) {
    const errors = validationResult(req);
    console.log(errors)
    if (!errors.isEmpty()) {
        res.json({
            status: false,
            message: "Request failed",
            errors:errors.array()
        });
        return;
    }  
    var list = new lists();
    list.item_id = req.body.item_id;
    list.price = req.body.price;
    list.isAuction = req.body.isAuction;
    list.user_id = req.decoded.user_id;
    list.auctionDays = req.body.auctionDays;
    list.collection_id = req.body.collection;
    list.isFraction = req.body.isFraction;
    list.fractionAmount = req.body.fractionAmount;
    list.isLazyMinting = req.body.lazyMinting;
    list.token_id = req.body.tokenId;

    list.save(function (err ,listObj) {
        if (err) {
            console.log(err)
            res.json({
                status: false,
                message: "Request failed",
                errors:err
            });
            return;
        }
        res.json({
            status: true,
            message: "listed on marketplace successfully"
        });
        return;
    })
}

/***************************************************************
* This is the function which used to get listed collections in database
***************************************************************/
exports.getListedCollectionsAllCategories = async function(req, res) {
    var skip = req.body.offset;
    var limit = req.body.limit;
    var w_collections = await this.getListedCollections(skip, limit);

    res.json({
        status: true,
        message: "listed collections retrieved successfully",
        data: w_collections
    });
    return;
}

exports.getListedCollectionItem = async function(req, res) {
    var collectionAddress = req.body.collection;

    try {
        /****** get one collection by contract address ***/
        var w_listedRes = await lists.aggregate([
            {
                "$group": {
                    "_id": "$collection_id",
                    "count": {"$sum": 1}
                }
            },
            { 
                "$lookup": {
                    "from": "linkwell_collection",
                    "localField": "_id",
                    "foreignField": "_id",
                    "as": "collections"
                }
            },
            { 
                $project: {
                    _id: 1,
                    count: 1,
                    collection: {
                        "$filter": {
                            "input": "$collections",
                            "as": "collection",
                            "cond": {
                                $eq: [
                                    "$$collection.contract_address",
                                    collectionAddress
                                ]
                            }
                        }
                    }
                }
            },
            { 
                $project: {
                    _id: 1,
                    count: 1,
                    collection: 1,
                    length: { "$size": "$collection"}
                }
            },
            {
                "$sort": {
                  "length": -1
                }
            }
        ]);
        
        var w_filteredListedRes = w_listedRes.filter(w_item => w_item.collection.length > 0);
        
        var w_soldRes = await trades.aggregate([
            {
                $match: {
                    collection_id: w_filteredListedRes[0]['_id']
                }
            },
            {
                "$group": {
                    "_id": "$collection_id",
                    "volume": {
                        "$sum" : { 
                            "$multiply" : ["$price", "$fractionAmount"]
                        }
                    },
                    "floor_price": {"$min": "$price"}   
                }
            }
        ]);

        var w_bNotExist = true;
        for(var w_i = 0; w_i < w_filteredListedRes.length; w_i++) {
            for(w_k = 0; w_k < w_soldRes.length; w_k++) {
                if(w_filteredListedRes[w_i]['_id'].toString() == w_soldRes[w_k]['_id'].toString()){
                    w_filteredListedRes[w_i]['volume'] = w_soldRes[w_k]['volume'];
                    w_filteredListedRes[w_i]['floor_price'] = w_soldRes[w_k]['floor_price'];
                    w_bNotExist = false;
                    break;
                }
            }
            if(w_bNotExist) {
                w_filteredListedRes[w_i]['volume'] = 0;
                w_filteredListedRes[w_i]['floor_price'] = 0;
            }
        }
        var w_allNFTs = [3,3,3] //await this.getAllNFTsByCollection(collectionAddress, w_listedRes[0]['collection']['chain']);
        var w_nftOwners = [2, 2, 2] //await this.getNFTOwners(collectionAddress, w_listedRes[0]['collection']['chain']);
        w_filteredListedRes[0]['listedRate'] = Math.round(w_filteredListedRes[0]['count'] /w_allNFTs.length * 100)
        w_filteredListedRes[0]['owners'] = w_nftOwners.length;
        w_filteredListedRes[0]['nftCount'] = w_allNFTs.length;

        res.json({
            status: true,
            message: "listed collections retrieved successfully",
            data: w_filteredListedRes
        });
    } catch (e) {
        console.log(e)
        res.json({
            status: false,
            message: "listed collections retrieved failed",
            data: []
        });
    }
    return;
}

/***************************************************************
* This is the function which used to get listed collections in database
***************************************************************/
exports.getTopSoldCollectionsToday = async function(req, res) {
    var skip = req.body.offset;
    var limit = req.body.limit;
    var start_date = new Date();
    var end_date = new Date();
    start_date.setDate(start_date.getDate() - 10);
    start_date.setDate(start_date.getUTCDate());
    start_date = new Date(start_date.setHours(23,59,59,999));
    end_date.setDate(end_date.getUTCDate());
    end_date = new Date(end_date.setHours(23,59,59,999));
    try {
        var w_soldRes = await trades.aggregate([
            { 
                $match : {
                    sold_date: {$gte: start_date, $lte: end_date}
                }
            },
            {
                "$group": {
                    "_id": "$collection_id",
                    "volume": {
                        "$sum" : { 
                            "$multiply" : ["$price", "$fractionAmount"]
                        }
                    },
                    "floor_price": {"$min": "$price"}    
                }
            },
            { 
                "$lookup": {
                    "from": "linkwell_collection",
                    "localField": "_id",
                    "foreignField": "_id",
                    "as": "collection"
                }
            },
            {
                "$sort": {
                  "volume": -1
                }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        ]);

        var w_listedCollectionIds = [];
        w_soldRes.map((r) => {
            w_listedCollectionIds.push(r._id);
        })
        
        var w_listRes = await lists.aggregate([
            {
                $match: {
                    collection_id: {
                        $in: w_listedCollectionIds
                    },
                    isSold: false
                }
            },
            {
                "$group": {
                    "_id": "$collection_id",
                    "count": {"$sum": 1}
                }
            }
        ]);

        var w_bNotExist = true;
        for(var w_i = 0; w_i < w_soldRes.length; w_i++) {
            for(w_k = 0; w_k < w_listRes.length; w_k++) {
                if(w_soldRes[w_i]['_id'] == w_listRes[w_k]['_id']){
                    w_soldRes[w_i]['count'] = w_listRes[w_k]['count'];
                    w_bNotExist = false;
                    break;
                }
            }
            if(w_bNotExist) {
                w_soldRes[w_i]['count'] = 0;
            }
            var w_allNFTs = [3,3,3] //await this.getAllNFTsByCollection(w_soldRes[w_i]['collection']['contract_address'], w_soldRes[w_i]['collection']['chain']);
            w_soldRes[w_i]['nftCount'] = w_allNFTs.length;
        }
        res.json({
            status: true,
            message: "get listed collections successfully",
            data: w_soldRes
        });
    } catch (e) {
        console.log(e)
        return [];
    }
}

/************************************************************
 * This is the function which used to get notable collections and items by category.
 ************************************************************/
exports.getNotableCollections = async function(req, res) {
    var w_merchandizeItems = [];
    var w_artItems = [];
    var w_membershipItems = [];
    var w_utilityItems = [];

    var w_merchandizeCollections = await this.getListedCollectionsByCategory('Merchandize', 0, 1);
    var w_artCollections = await this.getListedCollectionsByCategory('Art', 0, 1);
    var w_utilityCollections = await this.getListedCollectionsByCategory('Utility', 0, 1);
    var w_membershipCollections = await this.getListedCollectionsByCategory('Membership', 0, 1);

    if(w_merchandizeCollections.length > 0) {
        w_merchandizeItems = await this.getListedItems(w_merchandizeCollections[0]._id, 0, 3);
    }
    if(w_artCollections.length > 0) {
        w_artItems = await this.getListedItems(w_artCollections[0]._id, 0, 3);
    }
    if(w_utilityCollections.length > 0) {
        w_utilityItems = await this.getListedItems(w_utilityCollections[0]._id, 0, 3);
    }
    if(w_membershipCollections.length > 0) {
        w_membershipItems = await this.getListedItems(w_membershipCollections[0]._id, 0, 3);
    }
    var w_collections = [];
    w_collections[0] = w_artCollections;
    w_collections[1] = w_merchandizeCollections;
    w_collections[2] = w_membershipCollections;
    w_collections[3] = w_utilityCollections;
    var w_items = [];
    w_items[0] = w_artItems;
    w_items[1] = w_merchandizeItems;
    w_items[2] = w_membershipItems;
    w_items[3] = w_utilityItems;
    var w_res = {
        'collection': w_collections, 
        'items': w_items
    }

    res.json({
        status: true,
        message: "notable collections  retrieved successfully",
        data: w_res
    });
    return;
}
/***********************************************************
* This is the function which used to get listed items in database
***********************************************************/
exports.getListedItemsByCollection = async function(req,res) {
    var collection_id = req.body.collection;
    var skip = req.body.skip;
    var limit = req.body.limit;

    var w_res = await this.getListedItems(collection_id, skip, limit);
    res.json({
        status: true,
        message: "listed items retrieved successfully",
        data: w_res
    });
    return;  
}


/***********************************************************
* This is the function which used to get on auction items in database
***********************************************************/
exports.getAuctionedItems = function(req,res) {
    var collection_id = req.body.collection;
    var query = lists.find();
    query = query.where('collection_id', collection_id);
    query = query.where('isAuction', true);
    query = query.where('isSold', false)

    var fields_list = ['_id', 'token_id', 'fractionAmount', 'isAuction', 'price', 'item_id', 'auctionDays', 'collection_id', 'user_id']
    lists.find(query, fields_list).populate('collection_id').populate('item_id').populate('user_id').then(function (listsResult) {
        res.json({
            status: true,
            message: "Items retrieved successfully",
            data: listsResult
        });
    }); 
}

/***********************************************************
* This is the function which used to get listed new items in database
***********************************************************/
exports.getNewItems = async function(req,res) {
    var collection_id = req.body.collection;
    let date = new Date();
    date.setMonth(date.getMonth() - 1);
    date.setDate(date.getUTCDate());
    date = new Date(date.setHours(23,59,59,999))
    var w_listedRes = await lists.aggregate([
        { 
            $match : {
                collection_id : collection_id,
                isSold: false
            }
        },
        { 
            "$lookup": {
                "from": "linkwell_item",
                "localField": "item_id",
                "foreignField": "_id",
                "as": "items"
            }
        },
        { 
            $project: {
                _id: 1,
                token_id: 1,
                price: 1,
                fractionAmount: 1,
                isAuction: 1,
                item: {
                    "$filter": {
                        "input": "$items",
                        "as": "item",
                        "cond": {
                            $gte: [
                                "$$item.create_date",
                                date
                            ]
                        }
                    }
                }
            }
        },
        { 
            $project: {
                _id: 1,
                token_id: 1,
                price: 1,
                fractionAmount: 1,
                isAuction: 1,
                item: 1,
                length: { "$size": "$collection"}
            }
        },
        {   
            "$sort": {
                "length": -1
            }
        }
    ]);

    var w_filteredListedRes = w_listedRes.filter(w_item => w_item.collection.length > 0);

    res.json({
        status: true,
        message: "Items retrieved successfully",
        data: w_filteredListedRes
    });
}

/***********************************************************
* This is the function which used to get items which creator earning is bigger than 5% in database
***********************************************************/
exports.getEarningsOnItems = function(req,res) {
    var collection_id = req.body.collection;
    var query = collections.find();
    query = query.where('_id', collection_id);

    var fields = ['creatorFee']
    collections.find(query, fields).then(function (result) {
        if(result.length > 0 && result[0].creatorFee > 5) {
            var query_list = lists.find();
            query_list = query_list.where('collection_id', collection_id)
            query_list = query_list.where('isSold', false)

            var fields_list = ['_id', 'token_id', 'fractionAmount', 'isAuction', 'price', 'item_id', 'auctionDays', 'collection_id', 'user_id']
            lists.find(query_list, fields_list).populate('collection_id').populate('item_id').populate('user_id').then(function (listsResult) {
                res.json({
                    status: true,
                    message: "Items retrieved successfully",
                    data: listsResult
                });
            }); 
        } else {
            res.json({
                status: true,
                message: "Items retrieved successfully",
                data: []
            });
        }
    }); 
}

/***********************************************************
* This is the function which used to get items which creator earning is less than 5% in database
***********************************************************/
exports.getEarningsOffItems = function(req,res) {
    var collection_id = req.body.collection;
    var query = collections.find();
    query = query.where('collection_id', collection_id);

    var fields = ['creatorFee']
    collections.find(query, fields).then(function (result) {
        if(result.length > 0 && result[0].creatorFee <= 5) {
            var query_list = lists.find();
            query_list = query_list.where('collection_id', collection_id)
            query_list = query_list.where('isSold', false)

            var fields_list = ['_id', 'token_id', 'fractionAmount', 'isAuction', 'price', 'item_id', 'auctionDays', 'collection_id', 'user_id']
            lists.find(query_list, fields_list).populate('collection_id').populate('item_id').populate('user_id').then(function (listsResult) {
                res.json({
                    status: true,
                    message: "Items retrieved successfully",
                    data: listsResult
                });
            }); 
        } else {
            res.json({
                status: true,
                message: "Items retrieved successfully",
                data: []
            });
        }
    }); 
}

/***************************************************************
* This is the function which used to add orders in database
***************************************************************/
exports.addOrders = function(req,res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.json({
            status: false,
            message: "Request failed",
            errors:errors.array()
        });
        return;
    }  
    
    var order = new orders();
    order.list_id = req.body.listId;
    order.collection_id = req.body.collectionId;
    order.fractionAmount = req.body.fractionAmount;
    order.price = req.body.price;
    order.taker = req.body.buyer;
    order.sold_date = new Date();
  
    order.save(function (err ,orderObj) {
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
            message: "creating order successfully",
            result: orderObj
        });
    })
}

/***************************************************************
* This is the function which used to add trades in database
***************************************************************/
exports.tradeAdd = async function(req,res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.json({
            status: false,
            message: "Request failed",
            errors:errors.array()
        });
        return;
    }
    var w_soldRes = await trades.aggregate([
        {
            $match: {
                list_id: req.body.listId
            }
        },
        {
            "$group": {
                "_id": "$list_id",
                "fractionAmount": {"$sum": "$fractionAmount"}
            }
        }
    ]);

    var query = lists.find();
    query = query.where('_id', req.body.listId)
    var w_listRes = await lists.find(query);

    if(w_soldRes.length > 0 && w_listRes[0].fractionAmount <= (w_soldRes[0].fractionAmount + req.body.fractionAmount)) {
        var updatequery = { _id: req.body.listId };
        var newvalue = { $set: {isSold: true,  fractionAmount: 0} };
        await lists.updateOne(updatequery, newvalue);
    } else {
        var updatequery = { _id: req.body.listId };
        var newvalue = { $set: {fractionAmount: w_listRes[0].fractionAmount - req.body.fractionAmount} };
        await lists.updateOne(updatequery, newvalue);
    }

    var trade = new trades();
    trade.list_id = req.body.listId;
    trade.collection_id = req.body.collectionId;
    trade.fractionAmount = req.body.fractionAmount;
    trade.price = req.body.price;
    trade.taker = req.body.buyer;
    trade.sold_date = new Date();

    trade.save(function (err ,tradeObj) {
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
            message: "adding trade successfully",
            result: tradeObj
        });
    })
}

exports.uploadMetadata = function(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.json({
            status: false,
            message: "Request failed",
            errors:errors.array()
        });
        return;
    }  
    var timestamp = Date.now();
    var filename = Math.random().toString() + timestamp + '.json';
    fs.writeFile(global.__basedir + '/media/item/metadata/' + filename, req.body.metadata, function(err, result) {
        if(err) {
            console.log(err)
            res.json({
                status: false,
                message: "upload failed"
            });
            return;
        } else {
            res.json({
                status: true,
                message: "upload success",
                data: filename
            });
        }
    })
}

exports.uploadSlotData = function(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.json({
            status: false,
            message: "Request failed",
            errors:errors.array()
        });
        return;
    }  

    var timestamp = Date.now();
    var filename = Math.random().toString() + timestamp + '.json';
    fs.writeFile(global.__basedir + '/media/item/slotdata/' + filename, req.body.slotdata, function(err, result) {
        if(err) {
            res.json({
                status: false,
                message: "upload failed"
            });
            return;
        } else {
            res.json({
                status: true,
                message: "upload success",
                data: filename
            });
        }
    })
}

exports.getItemMetadata = function(req, res) {
    fs.readFile(global.__basedir + '/media/item/metadata/' + req.body.metadata_url, function(err, data) {
        if(err){
            res.json(''); 
            console.log(err)
        } else res.json(JSON.parse(data));
    })
}

exports.getItemSlotdata = function(req, res) {
    fs.readFile(global.__basedir + '/media/item/slotdata/' + req.body.slotdata_url, function(err, data) {
        if(err) res.json(''); else res.json(JSON.parse(data));
    })
}

exports.getItemIdBySlot = function(req,res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.json({
            status: false,
            message: "Request failed",
            errors:errors.array()
        });
        return;
    }  
    var query = items.find();
    query = query.where('collection_id',req.body.collection_id);
    query = query.where('slot',req.body.slot);
    var fields = ['_id'];
    items.find(query, fields).then(function (result) {
        if(result.length == 0) {
            res.json({
                status: true,
                message: "Items retrieved successfully",
                data: 0
            });
        } else {
            res.json({
                status: true,
                message: "Items retrieved successfully",
                data: result[0]._id
            });
        }
    }); 
}
/***********************************
 * This is function to get listed collections by category
 * ********************************/
getListedCollectionsByCategory = async function(category, skip, limit) {
    try {
        var w_listedRes = await lists.aggregate([
            {
                "$group": {
                    "_id": "$collection_id",
                    "count": {"$sum": 1}
                }
            },
            { 
                "$lookup": {
                    "from": "linkwell_collection",
                    "localField": "_id",
                    "foreignField": "_id",
                    "as": "collections"
                }
            },
            { 
                $project: {
                    _id: 1,
                    count: 1,
                    collection: {
                        "$filter": {
                            "input": "$collections",
                            "as": "collection",
                            "cond": {
                                $eq: [
                                    "$$collection.category",
                                    category
                                ]
                            }
                        }
                    }
                }
            },
            { 
                $project: {
                    _id: 1,
                    count: 1,
                    collection: 1,
                    length: { "$size": "$collection"}
                }
            },
            {
                "$sort": {
                  "length": -1
                }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        ]);

        var w_filteredListedRes = w_listedRes.filter(w_item => w_item.collection.length > 0);
        var w_collectionIds = [];
        w_filteredListedRes.map((r) => {
            w_collectionIds.push(r._id);
        })

        var w_soldRes = await trades.aggregate([
            {
                $match: {
                    collection_id: {
                        $in: w_collectionIds
                    }
                }
            },
            {
                "$group": {
                    "_id": "$collection_id",
                    "volume": {
                        "$sum": {
                            "$multiply": ["$price * $fractionAmount"]
                        }
                    },
                    "floor_price": {"$min": "$price"}    
                }
            }
        ]);
        var w_bNotExist = true;
        for(var w_i = 0; w_i < w_filteredListedRes.length; w_i++) {
            for(w_k = 0; w_k < w_soldRes.length; w_k++) {
                if(w_filteredListedRes[w_i]['_id'].toString() == w_soldRes[w_k]['_id'].toString()){
                    w_filteredListedRes[w_i]['volume'] = w_soldRes[w_k]['volume'];
                    w_filteredListedRes[w_i]['floor_price'] = w_soldRes[w_k]['floor_price'];
                    w_bNotExist = false;
                    break;
                }
            }
            if(w_bNotExist) {
                w_filteredListedRes[w_i]['volume'] = 0;
                w_filteredListedRes[w_i]['floor_price'] = 0;
            }
            var w_allNFTs = [3,3,3] //await this.getAllNFTsByCollection(w_filteredListedRes[w_i]['collection']['contract_address'], w_filteredListedRes[w_i]['collection']['chain']);
            w_filteredListedRes[w_i]['nftCount'] = w_allNFTs.length;
        }

        return w_filteredListedRes;
    } catch (e) {
        console.log(e)
        return [];
    }
}
/***********************************
 * This is function to get listed collections.
 * ********************************/
getListedCollections = async function(skip, limit) {
    try {
        var w_listedRes = await lists.aggregate([
            {
                "$group": {
                    "_id": "$collection_id",
                    "count": {"$sum": 1} 
                }
            },
            { 
                "$lookup": {
                    "from": "linkwell_collection",
                    "localField": "_id",
                    "foreignField": "_id",
                    "as": "collection"
                }
            },
            {
                "$sort": {
                  "count": -1
                }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        ]);
        var w_filteredListedRes = w_listedRes.filter(w_item => w_item.collection.length > 0);
        var w_collectionIds = [];
        w_filteredListedRes.map((r) => {
            w_collectionIds.push(r._id);
        })
        
        var w_soldRes = await trades.aggregate([
            { 
                $match : {
                    collection_id: {
                        $in: w_collectionIds
                    }
                }
            },
            {
                "$group": {
                    "_id": "$collection_id",
                    "volume": {
                        "$sum" : { 
                            "$multiply" : ["$price", "$fractionAmount"]
                        }
                    },
                    "floor_price": {"$min": "$price"}    
                }
            }
        ]);

        var w_bNotExist = true;
        for(var w_i = 0; w_i < w_filteredListedRes.length; w_i++) {
            for(w_k = 0; w_k < w_soldRes.length; w_k++) {
                if(w_filteredListedRes[w_i]['_id'].toString() == w_soldRes[w_k]['_id'].toString()){
                    w_filteredListedRes[w_i]['volume'] = w_soldRes[w_k]['volume'];
                    w_filteredListedRes[w_i]['floor_price'] = w_soldRes[w_k]['floor_price'];
                    w_bNotExist = false;
                    break;
                }
            }
            if(w_bNotExist) {
                w_filteredListedRes[w_i]['volume'] = 0;
                w_filteredListedRes[w_i]['floor_price'] = 0;
            }
            var w_allNFTs = [3,3,3] //await this.getAllNFTsByCollection(w_filteredListedRes[w_i]['collection']['contract_address'], w_filteredListedRes[w_i]['collection']['chain']);
            w_filteredListedRes[w_i]['nftCount'] = w_allNFTs.length;
        }
        return w_filteredListedRes;
    } catch (e) {
        console.log(e)
        return [];
    }
}

/***********************************************************
* This is the function which used to get listed items by collection in database
***********************************************************/
getListedItems = async function(collection, skip, limit) {
    var query = lists.find();
    query = query.where('collection_id', collection)
    query = query.where('isSold', false)
    var fields = ['_id', 'token_id', 'fractionAmount', 'isAuction', 'price', 'item_id', 'auctionDays', 'collection_id', 'user_id', 'list_date']
    try{
        var w_res = await lists.find(query, fields, {skip: skip, limit: limit}).populate('collection_id').populate('item_id').populate('user_id');
        return w_res;
    } catch(e) {
        return []
    }
    
}

/***********************
 * This is function to get all NFTs by collection(contract address) using moralis api
 ************************/
getAllNFTsByCollection = async function(contract_address, chain) {
    await Moralis.start({
        apiKey: config.moralis.apiKey
    });
    var moralis_chain = EvmChain.MUMBAI;
    if(chain == 56) {
        moralis_chain = EvmChain.BSC;
    } else if(chain == 137) {
        moralis_chain = EvmChain.POLYGON;
    } else if(chain == 1) {
        moralis_chain = EvmChain.ETHEREUM;
    }

    const response = await Moralis.EvmApi.nft.getContractNFTs({
        contract_address,
        moralis_chain,
    });
    
    return response.result;
}
/***********************
 * This is function to get all owners by collection(contract address) using moralis api
 ************************/
getNFTOwners = async function(contract_address, chain) {
    await Moralis.start({
        apiKey: config.moralis.apiKey
    });
    var moralis_chain = EvmChain.MUMBAI;
    if(chain == 56) {
        moralis_chain = EvmChain.BSC;
    } else if(chain == 137) {
        moralis_chain = EvmChain.POLYGON;
    } else if(chain == 1) {
        moralis_chain = EvmChain.ETHEREUM;
    }

    const response = await Moralis.EvmApi.nft.getNFTOwners({
        contract_address,
        moralis_chain,
    });

    return response.result;
}