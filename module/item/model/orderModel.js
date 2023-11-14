/*
Project : Cryptotrades
FileName :  orderModel.js
Author : LinkWell
File Created : 21/07/2021
CopyRights : LinkWell
Purpose : This is the file which used to define offer schema that will store and reterive item offer information.
*/

var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate-v2');
var uniqueValidator = require('mongoose-unique-validator');
var config = require('../../../helper/config')
const Schema = mongoose.Schema;

var orderSchema = mongoose.Schema({
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
    create_date: {
        type: Date,
        default: Date.now
    }
});

orderSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('order', orderSchema,config.db.prefix+'order');