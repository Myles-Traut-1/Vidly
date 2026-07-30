const mongoose = require("mongoose");

const rentalSchema = new mongoose.Schema({
    // CREATE CUSTOM SCHEMAS FOR CUSTOMER AND MOVIE TO ONLY STORE ESSENTIAL DATA
    // NOT ALL DATA FROM CUSTOMER IF WE USED IMPORTED SCHEMA
    customer: {
        type: new mongoose.Schema({
            name: {
                type: String,
                required: true,
                minLength: 3,
                maxLength: 255,
                trim: true
            },
            phone: {
                type: String,
                minLength: 5,
                maxLength: 255,
                required: true
            },
            isGold: {
                type: Boolean,
                default: false
            }
        }),
        required: true
    },
    movie: {
        type: new mongoose.Schema({
            title: {
                type: String,
                minLength: 5,
                maxLength: 255,
                required: true
            },
            dailyRentalRate: {
                type: Number,
                min: 0,
                max: 20,
                required: true
            }
        }),
        required: true
    },
    dateOut: {
        type: Date,
        required: true,
        default: Date.now
    },
    dateReturned: {
        type: Date
    },
    rentalFee: {
        type: Number,
        min: 0
    }
});

const Rental = mongoose.model("Rental", rentalSchema);

exports.Rental = Rental;
exports.rentalSchema = rentalSchema;