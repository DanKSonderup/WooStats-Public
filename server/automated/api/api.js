
require('dotenv').config();

const Product = require('../../models/Product');
const Order = require('../../models/Order');

// const ServerStorage = require('../../models/ServerStorage');


let username = process.env.API_USERNAME
let password = process.env.API_PASSWORD
let auth = btoa(`${username}:${password}`);


async function fetchProducts() {
    let counter = 1;
    let noMorePages = false;

    while (!noMorePages && counter < 20) {
        fetch('https://hverdagskram.dk/wp-json/wc/v3/products?per_page=50&page=' + counter, {
            headers: {
                'Authorization': `Basic ${auth}`
            }
        }).then(function (response) {
            if (response.ok) {
                return response.json();
            }
            throw response;
        }).then(function (data) {
            if (data.length == 0) {
                noMorePages = true;
            }
            data.forEach(element => {
                updateProductForDB(element);
            });
        }).catch(function (error) {
            console.warn(error);
        });
        counter++;
    }
}

async function fetchOrders() {
    let noMorePages = false;
    let counter = 1;
    while (!noMorePages && counter < 10) {
        fetch('https://hverdagskram.dk/wp-json/wc/v3/orders?per_page=50&page=' + counter + '&status=processing,completed', {
            headers: {
                'Authorization': `Basic ${auth}`
            }
        }).then(function (response) {
            if (response.ok) {
                return response.json();
            }
            throw response;
        }).then(function (data) {
            if (data.length == 0) {
                noMorePages = true;
            }
            data.forEach(element => {
                updateOrderForDB(element);
            });
        }).catch(function (error) {
            console.warn(error);
        });
        counter++;
    }
}


async function updateOrderForDB(order) {
    const orderObject = await Order.findOne({ 'id': order.id });

    const [dateOfTimeStamp] = order.date_created.split("T");
    const lineItems = [];
    order.line_items.forEach(item => {
        lineItems.push({ product_id: item.product_id, quantity: item.quantity, total: item.subtotal });
    });

    if (orderObject instanceof Order) {
        if (orderObject.status != order.status) {
            await Order.findOneAndUpdate({
                id: order.id
            }, {
                status: order.status,
                date_created: dateOfTimeStamp,
                total: order.total,
                line_items: lineItems
            });
        }
    } else {
        const newOrder = new Order({
            id: order.id,
            status: order.status,
            date_created: dateOfTimeStamp,
            total: order.total,
            line_items: lineItems
        });
        await Order.create(newOrder);
    }
}

async function updateProductStatisticsForDB(productId, ProductStatistic) {
    const productObject = await Product.findOne({ 'id': productId });

    if (productObject instanceof Product) {
        const updatedProduct = await Product.findOneAndUpdate(
            { id: productId },
            { statistics: ProductStatistic },
            { returnOriginal: false }
        );
        // console.log("Updated product with id: " + productId);
        // console.log(updatedProduct);
    }
}

async function updateProductForDB(product) {
    let productPriceChecked = product.regular_price;
    if (typeof productPriceChecked === 'string') {
        if (productPriceChecked.length == 0) {
            productPriceChecked = 0;
        }
    }
    const productObject = await Product.findOne({ 'id': 45 });

    let niCostGoodsObj = product.meta_data.find(item => item.key === '_ni_cost_goods');
    let niCostGoodsValue = niCostGoodsObj === undefined ? 0 : niCostGoodsObj.value;

    if (niCostGoodsValue !== null) {
        try {
            niCostGoodsValue = parseInt(niCostGoodsValue);
            if (isNaN(niCostGoodsValue)) {
                niCostGoodsValue = 0;
            }
        } catch (error) {
            console.log(error);
        }
    } else {
        niCostGoodsValue = 0;
    }


    if (productObject instanceof Product) {
        await Product.findOneAndUpdate({
            id: product.id
        }, {
            name: product.name,
            stock_quantity: typeof product.stock_quantity === 'number' ? product.stock_quantity : 0,
            regular_price: productPriceChecked,
            categories: product.categories[0].name,
            image: product.images[0].src,
            cost_of_goods: typeof niCostGoodsValue === 'number' ? niCostGoodsValue : 0
        }
        );

    } else {
        const newProduct = new Product({
            id: product.id,
            name: product.name,
            stock_quantity: typeof product.stock_quantity === 'number' ? product.stock_quantity : 0,
            price: productPriceChecked,
            categories: product.categories[0].name == undefined ? null : product.categories[0].name,
            image: product.images[0].src,
            cost_of_goods: typeof niCostGoodsValue === 'number' ? niCostGoodsValue : 0
        });
        await Product.create(newProduct);
    }
}


async function updateProfitMargin(productId, profitmargin) {
    const newPrice = await calcNewProfitMargin(productId, profitmargin);
    const data = {
        price: newPrice,
        regular_price: `${newPrice}`
    };
    console.log(data);
    const response = await fetch(`https://hverdagskram.dk/wp-json/wc/v3/products/${productId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    // Awaiting response.json() 
    const resData = await response.json();

    // Return response data  
    console.log(resData);
}

async function calcNewProfitMargin(productId, profitmargin) {
    let newPrice = 0;
    await Product.findOne({ id: productId }).lean().exec()
        .then(product => {
            console.log(product.cost_of_goods);
            newPrice = product.cost_of_goods * (profitmargin / 100);
            newPrice = Math.round(newPrice);
        })

    return newPrice;
}

/* Removed because they're not needed right now but might be in the future

async function getOrderCounter() {
    const docId = "6615639ddf59186e073d9b97";
    try {
        const storage = await ServerStorage.findById(docId).lean();
        console.log(storage);
        if (!storage) {
            return 0;
        }
        return storage.orderApiCounter;
    } catch (err) {
        console.error('Error finding document:', err);
        return 0;
    }
}

async function updateOrderCounter(count) {
    const docId = "6615639ddf59186e073d9b97";
    await ServerStorage.findOneAndUpdate({
        _id: docId
    }, {
        orderApiCounter: count
    });
}
*/

module.exports = { fetchProducts, updateProfitMargin, fetchOrders, updateOrderForDB, updateProductStatisticsForDB };