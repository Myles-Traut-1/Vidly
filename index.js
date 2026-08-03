const config = require("config");
const express = require("express");
const helmet = require("helmet");
const mongoose = require('mongoose');

// MIDDLEWARE
const error = require('./middleware/error');

// ROUTE IMPORTS
const genres = require("./routes/genres");
const customers = require("./routes/customers");
const movies = require("./routes/movies");
const rentals = require("./routes/rentals");
const auth = require("./routes/auth");

if(!config.get("jwtPrivateKey")) {
    console.log("FATAL ERROR... jwtPrivateKey not set");
    process.exit(1);
}

// CONNECT TO DB
mongoose.connect("mongodb://127.0.0.1:27017/Vidly?directConnection=true")
    .then(() => console.log("Connected to Vidly Db..."))
    .catch(err => console.error("Error connecting to db: ", err));

const app = express();

// MIDDLEWARES
app.use(express.json());
app.use(helmet());

// ROUTES
app.use('/api/genres', genres);
app.use('/api/customers', customers);
app.use('/api/movies', movies);
app.use('/api/rentals', rentals);
app.use('/api/auth', auth);

// ERROR HANDLING MIDDLEWARE
app.use(error);

// LISTENERS
const port = process.env.PORT || 3000;

app.listen(port, console.log(`Listening on port ${port}`));

