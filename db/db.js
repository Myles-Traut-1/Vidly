const mongoose = require('mongoose');
const logger = require("../utils/logger");

module.exports = function() {
    // CONNECT TO DB -> WINSTON NOW HANDLES DB CONNECTION FAILIURES
    mongoose.connect("mongodb://127.0.0.1:27017/Vidly?directConnection=true")
        .then(() => logger.info("Connected to Vidly Db..."));
}