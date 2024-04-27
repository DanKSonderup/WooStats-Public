const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ServerStorage = new Schema({
    orderApiCounter: {
        type: Number
    }
});



module.exports = mongoose.model('ServerStorage', ServerStorage);