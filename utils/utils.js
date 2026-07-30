const Joi = require("joi");

const validators = {

    validateGenre(genre) {
    // VALIDATE INPUT. RETURN ERROR STATUS CODE AND MESSAGE IF INVALID INPUT AND EXIT
        const schema = {
            name: Joi.string().min(3).required()
        }
        return Joi.validate(genre, schema);
    }, 

    validateCustomer(customer) {
        const schema = {
            name: Joi.string().required().min(2),
            phone: Joi.string().required().min(10).max(10),
            isGold: Joi.boolean().required()
        };

        return Joi.validate(customer, schema);
    },

    validateMovie(movie) {
        const schema = {
            title: Joi.string().min(3).required(),
            genreId: Joi.string().required(), 
            numberInStock: Joi.number().required(),
            dailyRentalRate: Joi.number().required()
        }

        return Joi.validate(movie, schema);
    },

    validateRental(rental) {
        const schema = {
            movieId: Joi.string().required(),
            customerId: Joi.string().required()
        }

        return Joi.validate(rental, schema);
    }
}

module.exports = validators;