const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

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
            genreId: Joi.objectId().required(), 
            numberInStock: Joi.number().required(),
            dailyRentalRate: Joi.number().required()
        }

        return Joi.validate(movie, schema);
    },

    validateRental(rental) {
        const schema = {
            movieId: Joi.objectId().required(),
            customerId: Joi.objectId().required()
        }

        return Joi.validate(rental, schema);
    },

    validateRegistration(registration) {
        const schema = {
            name: Joi.string().min(3).max(50).required(),
            email: Joi.string().min(3).max(255).required().email(),
            password: Joi.string().min(6).required()
        }

        return Joi.validate(registration, schema);
    }
}

module.exports = validators;