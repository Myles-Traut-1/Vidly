const mongoose = require('mongoose');


const customersSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            minLength: 2
        },
        phone: {
            type: String,
            required: true,
            minLength: 10,
            maxLength: 10
        },
        isGold: {
            type: Boolean,
            default: false
        }
    }
);

const Customer = mongoose.model("Customer", customersSchema);

exports.Customer = Customer;
exports.customersSchema = customersSchema;