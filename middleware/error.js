const logger = require("../utils/logger");

module.exports = function(err, req, res, next) {
    // LOG THE ERROR
    logger.error(err);

    // RETURN STATUS AND MESSAGE
    res.status(500).send("An error occured fetching data...")
}