/*
Project : Cryptotrades
FileName : slotModel.js
Author : Hai
File Created : 21/02/2023
CopyRights : Hai
Purpose : This is the file which used to define collection schema that will communicate and process collection information with mongodb through mongoose ODM.
*/

var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate-v2');
var config = require('../../../helper/config')
const Schema = mongoose.Schema;
// Setup schema

var slotSchema = mongoose.Schema({
    collection_id: { type: Schema.Types.ObjectId, ref: 'collection' },
    slot_id: {
        type: Number
    },
    slot_url: {
        type: String,
        default: ''
    }
});

slotSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('slot', slotSchema,config.db.prefix+'slot');