const mongoose = require('mongoose');

// CREATE SCHEMA
const genresSchema = new mongoose.Schema({
    name: {
        type: String, 
        required: true, 
        minLength: 3, 
        maxLength: 255,
        lowerCase: true
    }
});

// CREATE THE GENRE MODEL
const Genre = mongoose.model("Genre", genresSchema);

exports.Genre = Genre; 
exports.genresSchema = genresSchema;