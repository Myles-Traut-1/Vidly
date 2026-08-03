const express = require("express");
const logger = require("./utils/logger");

require("./config/config")();
require("./db/db")();

// MIDDLEWARE IMPORTS
const helmet = require("helmet");
const error = require('./middleware/error');

// ROUTE IMPORTS
const genres = require("./routes/genres");
const customers = require("./routes/customers");
const movies = require("./routes/movies");
const rentals = require("./routes/rentals");
const auth = require("./routes/auth");

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

// EXPRESS ERROR HANDLING MIDDLEWARE
app.use(error);

// LISTENERS
const port = process.env.PORT || 3000;

app.listen(port, logger.info(`Listening on port ${port}`));

