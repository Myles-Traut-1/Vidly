const express = require("express");
const { Customer } = require("../models/customer");
const { validateCustomer } = require("../utils/utils");

/** ------ MIDDLEWARE ------ */
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const validateObjectId = require("../middleware/validateObjectId");
const validate = require("../middleware/validate");

const router = express.Router();

/** -------- GET -------- */
router.get('/', async (req, res) => {
    const customers = await Customer.find().sort({name: 1});
    res.send(customers);
});

router.get('/:id', validateObjectId, async (req, res) => {
    const customer = await Customer.findById(req.params.id);

    if(!customer) {
        return res.status(404).send("Customer not found!");
    }

    res.send(customer);
});

/** -------- POST -------- */
router.post('/', [auth, validate(validateCustomer)], async (req, res) => {
    const customer = new Customer({
        name: req.body.name,
        phone: req.body.phone,
        isGold: req.body.isGold
    });

    await customer.save();
    res.send(customer);
});

/** ------ PUT ------ */
router.put('/:id', [auth, validateObjectId, validate(validateCustomer)], async (req, res) => {
    const updatedCustomer = await Customer.findByIdAndUpdate(req.params.id, {
        $set : {
            name: req.body.name,
            phone: req.body.phone,
            isGold: req.body.isGold
        },
    }, { returnDocument: 'after'});
    
    if(!updatedCustomer) {
        return res.status(404).send("Customer not found!");
    }
    res.send(updatedCustomer);
});

/** ------ DELETE ------ */
router.delete('/:id', [auth, admin, validateObjectId], async (req, res) => {
    const deletedCustomer = await Customer.findByIdAndDelete(req.params.id);
    if(!deletedCustomer) {
        return res.status(404).send("Customer not found!");
    }
    res.send(deletedCustomer); 
});

module.exports = router;