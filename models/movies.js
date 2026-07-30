const mongoose = require('mongoose');
const { genresSchema } = require("./genre");

const moviesSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        minLength: 3
    },
    genre: {
        type: genresSchema,
        required: true
    },
    numberInStock: {
        type: Number,
        default: 0,
        min: 0,
        max: 50
    },
    dailyRentalRate: {
        type: Number,
        default: 0,
        min: 0
    }
});

const Movie = mongoose.model("Movie", moviesSchema);

exports.Movie = Movie;
exports.moviesSchema = moviesSchema;