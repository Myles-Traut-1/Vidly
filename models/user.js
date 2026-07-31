const mongoose = require("mongoose");
const config = require("config"); 
const jwt = require("jsonwebtoken");

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
    },
    isAdmin: Boolean,
});

userSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ _id: this._id, isAdmin: this.isAdmin }, config.get("jwtPrivateKey"));
    return token;
}

const User = mongoose.model("User", userSchema);

exports.User = User;
exports.userSchema = userSchema;