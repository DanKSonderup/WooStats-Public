const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

const jwtSecret = process.env.JWT_SECRET;


const API = require('../automated/api/api');
const Statistics = require('../bl/businesslogic/statistics');
// const ServerStorage = require('../models/ServerStorage');


/**
 * 
 * Check Login
*/
const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        res.redirect('/hverdagskram');
        return // res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.redirect('/hverdagskram');
        // res.status(401).json({ message: 'Unauthorized' });
    }
}

/**
 * GET /
 * Admin - Login Page
*/
router.get('/', async (req, res) => {
    res.render('index');
});

/**
 * POST /
 * Admin - Check Login
*/
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, jwtSecret);
        res.cookie('token', token, { httpOnly: true });
        res.redirect('/hverdagskram/dashboard');

    } catch (error) {
        console.log(error);
    }
});

router.get('/dashboard', authMiddleware, async (req, res) => {
    const data = await Statistics.getBestPerformingProductThisMonth();
    res.render('dashboard', { data });
});

router.get('/statistik', authMiddleware, async (req, res) => {
    // Statistics.updateProductsStatistics();
    const periodsToDays = { '1w': 7, '2w': 14, '1m': 30, '3m': 90, '6m': 180 };
    let parameters = req.query.dataperiod;
    if (parameters == undefined) {
        parameters = '1w';
    }
    const products = await Product.find();
    let period = periodsToDays[parameters];
    data = products.map(product => {
        let daysTillStockDry = 0;
        let statisticsData = [0, 0, 0, 0];
        let salesDifference = 0;
        if (product.statistics.length > 0) {
            daysTillStockDry = product.statistics[0].daysTillStockDry;
            if (daysTillStockDry == Infinity) {
                daysTillStockDry = 0;
            }
            const statsdata = Statistics.calcSalesDifferenceInPercentForProduct(product, parameters);
            statisticsData = statsdata.statisticsData;
            salesDifference = statsdata.salesDifference.toFixed(0);
        }
        return {
            image: product.image,
            name: product.name.trim(),
            stock_quantity: product.stock_quantity,
            statisticsData: statisticsData,
            daysTillStockDry: daysTillStockDry,
            salesDifference: salesDifference
        };
    });

    res.render('statistik', { data, period });
});


router.get('/statistik:period', authMiddleware, async (req, res) => {
    const parameters = req.body.params;
    console.log(parameters);
    const data = await Product.find();

    res.render('statistik', { data });
});




router.get('/profit-margin', authMiddleware, async (req, res) => {
    API.fetchProducts();
    // API.fetchOrders();
    const data = await Product.find();
    res.render('profit-margin', { data });
});


router.get('/profit-margin-update', authMiddleware, async (req, res) => {
    API.fetchProducts();
    const data = await Product.find();
    res.render('profit-margin', { data });
});

router.post('/edit-profit-margin', authMiddleware, async (req, res) => {
    let profitMargin = req.body.profitmargin;
    try {
        profitMargin = parseInt(profitMargin);
    } catch (error) {
        res.redirect('/hverdagskram/profit-margin');
        return;
    }

    const updateProfitData = Object.values(req.body);
    updateProfitData.shift();
    for (value of updateProfitData) {
        await Product.findOne({ id: value }).lean().exec()
            .then(product => {
                if (product.cost_of_goods > 0) {
                    API.updateProfitMargin(value, profitMargin);
                }
            })
            .catch(err => {
                console.error(err);
                // Handle error
            });
    }
    const data = await Product.find();
    res.redirect('/hverdagskram/profit-margin');
});



/*
function insertOrderData() {
    Order.insertMany([
        {
            id: 1,
            status: "completed",
            date_created: "1990-06-12",
            total: 1000,
            line_items: [{ product_id: 1, quantity: 2, total: 4 }]
        }])
}
*/

module.exports = router;