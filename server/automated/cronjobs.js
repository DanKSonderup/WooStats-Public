const cron = require('node-cron');
const API = require('../automated/api/api');
const MailSender = require('../automated/mailsender');
const Product = require('../models/Product');
const Statistics = require('../bl/businesslogic/statistics');


function setupCrons() {
    cron.schedule('0 8,13,19 * * *', () => {
        API.fetchProducts();
        logMessage("Updated Products");
        API.fetchOrders();
        logMessage("Updated Orders");
        Statistics.updateProductsStatistics();
    });
    cron.schedule('0 9 */3 * *', () => {
        checkIfRestockingNeeded();
        logMessage("Ran restock check");
    });
}

function logMessage(cronmessage) {
    console.log(cronmessage, new Date().toLocaleString());
}

async function checkIfRestockingNeeded() {
    const products = await Product.find();
    console.log(products.length);
    const productsThatNeedRestock = products.filter((product) => product.statistics[0].daysTillStockDry < 50 && product.statistics[0].daysTillStockDry > 0).sort((p1, p2) => p1.statistics[0].daysTillStockDry - p2.statistics[0].daysTillStockDry);
    if (productsThatNeedRestock.length != 0) {
        MailSender.sendReStockUpdate(productsThatNeedRestock);
        logMessage("Sent restocking Update");
    }
}




module.exports = setupCrons;