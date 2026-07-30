const express = require("express");
const { Customer } = require("../models/customer");
const { validateCustomer } = require("../utils/utils");

const router = express.Router();

/** -------- GET -------- */
router.get('/', async (req, res) => {
    const customers = await Customer.find().sort({name: 1});
    res.send(customers);
});

router.get('/:id', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if(!customer) {
            res.status(404).send("Customer not found!");
        }

        res.send(customer);
    } catch(err) {
        console.error("Database Error...", err);
    }
});

/** -------- POST -------- */
router.post('/', async (req, res) => {

    const { error } = validateCustomer(req.body);
    if(error) {
        res.status(400).send(error.details[0].message);
    }

    const customer = new Customer({
        name: req.body.name,
        phone: req.body.phone,
        isGold: req.body.isGold
    });

    try {
        const result = await customer.save();
        res.send(result);
    } catch(err) {
        console.error("Database Error...", err);
    }
});

/** ------ PUT ------ */
router.put('/:id', async (req, res) => {
    const { error } = validateCustomer(req.body);
    if(error) {
        res.status(400).send(error.details[0].message);
    }

    try {
        const updatedCustomer = await Customer.findByIdAndUpdate(req.params.id, {
            $set : {
                name: req.body.name,
                phone: req.body.phone,
                isGold: req.body.isGold
            },
        }, {new: true});
        
        if(!updatedCustomer) {
            res.status(404).send("Customer not found!");
        }
        res.send(updatedCustomer);

    } catch (err) {
        console.error("Database Error...", err);
    }
});

/** ------ DELETE ------ */
router.delete('/:id', async (req, res) => {
    const deletedCustomer = await Customer.findByIdAndDelete(req.params.id);
    if(!deletedCustomer) {
        res.status(404).send("Customer not found!");
    }
    res.send(deletedCustomer); 
});

module.exports = router;