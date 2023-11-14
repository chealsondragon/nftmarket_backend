/*
Project : Cryptotrades
FileName : favouriteModel.js
Author : LinkWell
File Created : 21/07/2021
CopyRights : LinkWell
Purpose : This is the file which used to define favourite schema that will store and reterive item favourite information.
*/

var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate-v2');
var uniqueValidator = require('mongoose-unique-validator');
var config = require('../../../helper/config')
const Schema = mongoose.Schema;

var tradeSchema = mongoose.Schema({
    list_id: {
        type: Schema.Types.ObjectId,
        ref: 'list'
    },
    collection_id: {
        type: Schema.Types.ObjectId,
        ref: 'collection'
    },
    fractionAmount: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        default: 0
    },
    taker: {
        type: String,
        default: ''
    },
    sold_date: {
        type: Date,
        default: Date.now
    }
});

tradeSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('trade', tradeSchema,config.db.prefix+'trade');