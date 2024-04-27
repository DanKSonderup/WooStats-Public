const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const StatisticsSchema = new Schema({
    // Amount, Revenue, Profit, AvgSalesPerPeriod
    oneWeek: {
        type: [Number]
    },
    twoWeeks: {
        type: [Number]
    },
    oneMonth: {
        type: [Number]
    },
    threeMonths: {
        type: [Number]
    },
    sixMonths: {
        type: [Number]
    },
    totalSales: {
        type: Number
    },
    daysTillStockDry: {
        type: Number
    }
});

const Statistics = mongoose.model('Statistics', StatisticsSchema);

const ProductSchema = new Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    stock_quantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        default: 0
    },
    categories: {
        type: [String]
    },
    image: {
        type: String
    },
    cost_of_goods: {
        type: Number,
        default: 0
    },
    total_sales: {
        type: Number,
        default: 0
    },
    statistics: [StatisticsSchema]
});

module.exports = mongoose.model('Product', ProductSchema);