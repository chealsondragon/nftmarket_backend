/*
Project : Cryptotrades
FileName : item.js
Author : LinkWell
File Created : 21/07/2021
CopyRights : LinkWell
Purpose : This is the file which used to define all route releated to collecion api request.
*/

var express = require('express')
var router = express.Router();
var itemController = require("./../controller/itemController")
var auth = require("./../../../middleware/auth");
var adminauth = require("./../../../middleware/adminauth");
var optionalauth = require("./../../../middleware/optionalauth");
const { check } = require('express-validator');

router.post('/getMaxSlot', [check('collection_id').not().isEmpty(), auth], itemController.getMaxTokenSlot)
router.post('/add',[check('collection').not().isEmpty(),auth],itemController.add)
router.post('/list',[check('collection').not().isEmpty(), auth],itemController.list)
router.post('/lazyitems',[check('collection').not().isEmpty(), auth],itemController.lazyItems)
router.post('/getItem',[check('item_id').not().isEmpty(),auth],itemController.getItem)
router.post('/marketListItem',[check('item_id').not().isEmpty(),auth],itemController.marketListItem)
router.post('/getListedCollections', itemController.getListedCollectionsAllCategories)
router.post('/getTopCollectionsToday', itemController.getTopSoldCollectionsToday)
router.post('/getNotableCollections', itemController.getNotableCollections)
router.post('/getListedCollectionItem', [check('collection').not().isEmpty()], itemController.getListedCollectionItem)
router.post('/getListedItems', [check('collection').not().isEmpty()], itemController.getListedItemsByCollection)
router.post('/getAuctionedItems', [check('collection').not().isEmpty()], itemController.getAuctionedItems)
router.post('/getNewItems', [check('collection').not().isEmpty()], itemController.getNewItems)
router.post('/getEarningsOnItems', [check('collection').not().isEmpty()], itemController.getEarningsOnItems)
router.post('/getEarningsOffItems', [check('collection').not().isEmpty()], itemController.getEarningsOffItems)
router.post('/createOrder',[check('listId').not().isEmpty()],itemController.addOrders)
router.post('/addTrade',[check('listId').not().isEmpty()],itemController.tradeAdd)
router.post('/uploadMetadata', [check('metadata').not().isEmpty(), auth], itemController.uploadMetadata)
router.post('/uploadSlotData', [check('slotdata').not().isEmpty(), auth], itemController.uploadSlotData)
router.post('/getItemMetadata', itemController.getItemMetadata)
router.post('/getItemSlotdata', itemController.getItemSlotdata)
router.post('/getItemId', [check('collection_id').not().isEmpty(), auth], itemController.getItemIdBySlot)

module.exports = router