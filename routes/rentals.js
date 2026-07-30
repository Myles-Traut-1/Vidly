const mongoose = require("mongoose");
const express = require("express");

const { Rental } = require("../models/rentals");
const { Customer } = require("../models/customer");
const { Movie } = require("../models/movies");
const { validateRental } = require("../utils/utils");

const router = express.Router();

/** ------ GET ROUTES ------ */

router.get('/', async (req, res) => {
    const rentals = await Rental.find().sort({name: 1});
    res.send(rentals);
});

router.get('/:id', async (req, res) => {
    const rental = await Rental.findById(req.params.id);
    if(!rental) {
        res.status(404).send("Rental not found!");
    }
    res.send(rental);
});

/** ------ POST ROUTES ------ */

router.post('/' ,async (req, res) => {
    const { error } = validateRental(req.body);
    if(error) {
        res.status(400).send(error.details[0].message);
    }
    
    const customer = await Customer.findById(req.body.customerId);
    if(!customer) {
        res.status(404).send("Customer not found!");
    }

    const movie = await Movie.findById(req.body.movieId);
    if(!movie) {
        res.status(404).send("Movie not found!");
    }

    const rental = new Rental({
        customer: customer,
        movie: movie
    });

    try{
        // Update stock
        rental.movie.numberInStock --;
        rental.movie.dailyRentalRate ++;
        
        const result = await rental.save();

        if(result) {
            movie.numberInStock --;
            movie.dailyRentalRate ++;
            await movie.save();
        }

        res.send(result); 
    } catch (err) {
        console.error("Database error..." , err);
    }
});

/** ------ DELETE ROUTE ------ */

router.delete('/:id', async (req, res) => {
    const deletedRental = await Rental.findByIdAndDelete(req.params.id);
    if(!deletedRental) {
        res.status(404).send("Rental not found!");
    }

    res.send(deletedRental);
});

module.exports = router;