const mongoose = require('mongoose');
const logger = require("../utils/logger");
const config = require("config");

module.exports = function() {
    const db = config.get("db");
    // CONNECT TO DB -> WINSTON NOW HANDLES DB CONNECTION FAILIURES
    mongoose.connect(db)
        .then(() => logger.info(`Connected to ${db}...`));
}