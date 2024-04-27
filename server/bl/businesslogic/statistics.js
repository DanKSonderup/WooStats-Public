require('dotenv').config();

const Order = require('../../models/Order');
const Product = require('../../models/Product');
const API = require('../../automated/api/api');

function ProductStatistic(name, stock_quantity, avgSales, daysTillStorageEmpty, revenue, profit) {
    this.name = name;
    this.stock_quantity = stock_quantity;
    this.avgSales = avgSales;
    this.daysTillStorageEmpty = daysTillStorageEmpty;
    this.revenue = revenue;
    this.profit = profit;
}

let calcPercentageDifference = (totalsales, avgsales) => {
    if (totalsales == 0) {
        return (avgsales * 100) * -1;
    }
    if (avgsales == 0) {
        return totalsales * 100;
    }
    tempDiff = (totalsales - avgsales);
    // tempAverage = (totalsales + avgsales) / 2;
    return (tempDiff / avgsales) * 100;
}


/**
 * Prepares the data neccessary for the ProductStatistic Field Object in MongoDB
 * Calls the API so it can handle the actual API request of updating the Product in Database
 * Returns nothing since the created object is passed to API.updateProductStatisticsForDB
 */

async function updateProductsStatistics() {
    const products = await Product.find();
    const periods = ['oneWeek', 'twoWeeks', 'oneMonth', 'threeMonths', 'sixMonths'];
    const days = [7, 14, 30, 90, 180];
    for (p of products) {
        const results = [];
        for (let i = 0; i < periods.length; i++) {
            let avg = await calcPercentageDifferenceForXDays(days[i], p.id)
            let stats = await getAllSalesForProductByPeriod(p.id, periods[i]);
            console.log(stats);
            stats.push(avg);
            results[i] = stats;
        }
        let total = await getAllSalesForProduct(p.id);
        let daysTillStockDry = await calcTimeTillStockDry(p.id, results);
        if (isNaN(daysTillStockDry)) {
            continue;
        }
        const ProductStatistic =
        {
            oneWeek: results[0],
            twoWeeks: results[1],
            oneMonth: results[2],
            threeMonths: results[3],
            sixMonths: results[4],
            daysTillStockDry: daysTillStockDry,
            totalSales: total
        }
        try {
            await API.updateProductStatisticsForDB(p.id, ProductStatistic);
        } catch (error) {
            console.log(error);
        }
    }

}

/**
 * 
 * @param {Number} productId 
 * @returns Total sales for the specified ProductId
 */
async function getAllSalesForProduct(productId) {
    const productObject = await Product.find({ id: productId });
    if (productObject[0] == undefined) {
        return;
    }
    let total = 0;
    const query = {
        line_items: {
            $elemMatch: {
                product_id: productId
            }
        }
    };
    const orders = await Order.find(query);
    orders.forEach(order => {
        order.line_items.forEach(lineitem => {
            total += lineitem.quantity;
        });
    });
    return total;
}

async function calcTimeTillStockDry(productId, sales) {
    const productObject = await Product.find({ 'id': productId });

    // Weights are still being adjusted and tested
    const weights = [1, 1, 1, 1];
    const days = [7.0, 14.0, 30.0, 90.0];

    let calculatedAverage = 0;

    for (let i = 0; i < 4; i++) {
        if (sales[i][0] > sales[i][3]) {
            weights[i] = 3;
        }
        if (sales[i][0] == 0) {
            weights[i] = 0;
        }
        calculatedAverage += (sales[i][0] * weights[i]) / days[i];
    }
    calculatedAverage = calculatedAverage / weights.reduce((accumulator, currentValue) => {
        return accumulator + currentValue;
    }, 0);
    let result = Math.round(productObject[0].stock_quantity / calculatedAverage);
    if (result != Infinity && !isNaN(result)) {
        return result;
    } else {
        return -1;
    }
}

async function calcPercentageDifferenceForXDays(days, productId) {
    const startDate = new Date(2023, 0, 1);
    const total = await getAllSalesForProduct(productId);
    const now = new Date();
    const millisecondsInADay = 24 * 60 * 60 * 1000;
    const numberOfPeriods = Math.floor((now - startDate) / (millisecondsInADay * days));

    return Math.round(total / numberOfPeriods);
}

async function getAllSalesForProductByPeriod(productId, timeperiod) {
    const productObject = await Product.find({ id: productId });
    if (productObject[0] == undefined) {
        return;
    }
    const endDate = new Date();
    const startDate = new Date(endDate);
    let amountOfSales = 0;
    let revenue = 0;
    let profit = 0;

    switch (timeperiod) {
        case 'oneWeek': {
            startDate.setDate(endDate.getDate() - 7);
        } break;
        case 'twoWeeks': {
            startDate.setDate(endDate.getDate() - 14);
        } break;
        case 'oneMonth': {
            startDate.setDate(endDate.getDate() - 30);
        } break;
        case 'threeMonths': {
            startDate.setDate(endDate.getDate() - 90);
        } break;
        case 'sixMonths': {
            startDate.setDate(endDate.getDate() - 180);
        } break;
    }

    const query = {
        date_created: {
            $gte: startDate,
            $lte: endDate
        },
        line_items: {
            $elemMatch: {
                product_id: productId
            }
        }
    };
    const orders = await Order.find(query);
    orders.forEach(order => {
        order.line_items.forEach(lineitem => {
            amountOfSales += lineitem.quantity;
            revenue += lineitem.total;
            profit += (lineitem.total - (lineitem.quantity * productObject[0].cost_of_goods));
        });
    });
    // Amount, Revenue, Profit
    return [amountOfSales, revenue, profit];
}

function calcSalesDifferenceInPercentForProduct(product, parameters) {
    let statisticsData = [0, 0, 0, 0];
    let tempDiff = 0;
    let tempAverage = 0;
    let salesDifference = 0;

    switch (parameters) {
        case '1w':
            statisticsData = product.statistics[0].oneWeek;
            salesDifference = calcPercentageDifference(product.statistics[0].oneWeek[0], product.statistics[0].oneWeek[3]);
            break;
        case '2w':
            statisticsData = product.statistics[0].twoWeeks;
            salesDifference = calcPercentageDifference(product.statistics[0].twoWeeks[0], product.statistics[0].twoWeeks[3]);
            break;
        case '1m':
            statisticsData = product.statistics[0].oneMonth;
            salesDifference = calcPercentageDifference(product.statistics[0].oneMonth[0], product.statistics[0].oneMonth[3]);
            break;
        case '3m':
            statisticsData = product.statistics[0].threeMonths;
            salesDifference = calcPercentageDifference(product.statistics[0].threeMonths[0], product.statistics[0].threeMonths[3]);
            break;
        case '6m':
            statisticsData = product.statistics[0].sixMonths;
            salesDifference = calcPercentageDifference(product.statistics[0].sixMonths[0], product.statistics[0].sixMonths[3]);
            break;
        default:
            statisticsData = [0, 0, 0, 0];
    }
    return { statisticsData: statisticsData, salesDifference: salesDifference };
}

async function getBestPerformingProductThisMonth() {
    const products = await Product.find();
    const bestRevenueGeneratingProduct = products.reduce((max, current) => {
        return (current.statistics[0].oneMonth[2] > max.statistics[0].oneMonth[2]) ? current : max;
    }, products[0]);

    return bestRevenueGeneratingProduct;
}


module.exports = { getAllSalesForProductByPeriod, updateProductsStatistics, calcTimeTillStockDry, calcSalesDifferenceInPercentForProduct, getBestPerformingProductThisMonth }; 
