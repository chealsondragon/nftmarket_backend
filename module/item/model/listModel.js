/*
Project : Cryptotrades
FileName :  listModel.js
Author : LinkWell
File Created : 21/02/2023
CopyRights : LinkWell
Purpose : This is the file which used to define view schema that will store and reterive listed Item.
*/

var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate-v2');
var config = require('../../../helper/config')
const Schema = mongoose.Schema;

var listSchema = mongoose.Schema({
    token_id: {
        type: Number,
        default: 0
    },
    item_id: {
        type: Schema.Types.ObjectId, ref: 'item'
    },
    collection_id: { type: Schema.Types.ObjectId, ref: 'collection' },
    price: {
        type: Number,
        default:0
    },
    isFraction: {
        type:Boolean,
        default: false
    },
    fractionAmount: {
        type: Number,
        default: 1
    },
    isLazyMinting: {
        type: Boolean,
        default: false
    },
    isAuction: {
        type: Boolean,
        default: false
    },
    auctionDays: {
        type: Number,
        default: 1
    },
    user_id: {
        type: Schema.Types.ObjectId, ref: 'users'
    },
    isSold: {
        type: Boolean,
        default: false
    },
    list_date: {
        type: Date,
        default: Date.now
    }
});

listSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('list', listSchema,config.db.prefix+'lists');