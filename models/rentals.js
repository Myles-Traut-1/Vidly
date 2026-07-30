const mongoose = require("mongoose");

const { moviesSchema } = require("./movies");
const { customersSchema } = require("./customer");

const rentalSchema = new mongoose.Schema({
    customer: {
        type: customersSchema,
        required: true
    },
    movie: {
        type: moviesSchema,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const Rental = mongoose.model("Rental", rentalSchema);

exports.Rental = Rental;
exports.rentalSchema = rentalSchema;