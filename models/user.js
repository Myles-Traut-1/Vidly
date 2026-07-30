const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minLength: 5,
        maxLength: 50,
        trim: true
    }, 
    email: {
        type: String,
        required: true,
        unique: true,
        minlength: 5,
        maxLength: 255,
        match: /.*@.*/
    },
    password: {
        type: String,
        required: true,
        minLength: 6,
    }
});

const User = mongoose.model("User", userSchema);

exports.User = User;
exports.userSchema = userSchema;