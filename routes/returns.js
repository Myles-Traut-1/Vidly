const express = require("express");
const mongoose = require("mongoose");

const { Rental } = require("../models/rentals");
const { Movie } = require("../models/movies");

const { validateReturn } = require ("../utils/utils");

/** ------ MIDDLEWARE ------ */
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");

/** ------ CREATE ROUTER ------ */
const router = express.Router();

/** ------ POST ROUTES ------ */
router.post('/', [auth, validate(validateReturn)], async (req, res) => {
    // Custom Static method we created on the Rental Class
    const rental = await Rental.lookup(req.body.customerId, req.body.movieId);

    if(!rental) {
        return res.status(404).send("No rental found");
    }

    if(rental.dateReturned > 0) {
        return res.status(400).send("Rental already processed");
    }

    rental.return();

    const session = await mongoose.startSession();

    try{
        session.startTransaction();

        const result = await rental.save({session});

        await Movie.updateOne({_id: rental.movie._id}, { 
            $inc: { numberInStock: 1 }
        });

        await session.commitTransaction();

        res.status(200).send(rental);

    } catch( err ) {
        // Abort and roll back all changes if an error happens
        await session.abortTransaction();
        res.status(500).send('Transaction failed, changes rolled back.', err)
    } finally {
        // Always close the session
        session.endSession();
    } 

    
});

module.exports = router;