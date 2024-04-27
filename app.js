require('dotenv').config();

const express = require('express');
const path = require('path');
const pageRouter = require('./server/routes/pages');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const connectDB = require('./server/db/db');
const MongoStore = require('connect-mongo');
const cronJobs = require('./server/automated/cronjobs');

const app = express();

connectDB();

app.use(cookieParser());

cronJobs();

app.use(express.static(path.join(__dirname, 'public')));
// for body parser. to collect data that sent from the client.
app.use(express.urlencoded({ extended: false }));

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI
    }),
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs')

// Routers
app.use('/hverdagskram', pageRouter);


// Errors => page not found 404
app.use((req, res, next) => {
    var err = new Error('Page not found');
    err.status = 404;
    next(err);
})

// Handling errors (send them to the client)
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.send(err.message);
});

// Setting up the server
app.listen(5001, () => {
    console.log('Server is running on port 5001...');
});

