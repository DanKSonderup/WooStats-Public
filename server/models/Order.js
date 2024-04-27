const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const LineItemSchema = new Schema({ product_id: 'Number', quantity: 'Number', total: 'Number' });

const LineItem = mongoose.model('LineItem', LineItemSchema);

const OrderSchema = new Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    status: {
        type: String,
    },
    date_created: {
        type: Date,
        default: "2000-01-01"
    },
    total: {
        type: Number,
        default: 0
    },
    line_items: [LineItemSchema]
});



module.exports = mongoose.model('Order', OrderSchema);