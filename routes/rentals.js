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
        return res.status(404).send("Rental not found!");
    }
    res.send(rental);
});

/** ------ POST ROUTES ------ */

router.post('/' ,async (req, res) => {
    const { error } = validateRental(req.body);
    if(error) {
        return res.status(400).send(error.details[0].message);
    }

    const customer = await Customer.findById(req.body.customerId);
    if(!customer) {
        return res.status(404).send("Customer not found!");
    }

    /** Instead of the below we now use built in MongoDb's sessions to save to the db */

    // const movie = await Movie.findById(req.body.movieId);
    // if(!movie) {
    //     return res.status(404).send("Movie not found!");
    // }

    // if(movie.numberInStock === 0) {
    //     return res.status(404).send("Movie not in stock");
    // }

    // const rental = new Rental({
    //     customer: {
    //         _id: customer._id,
    //         name: customer.name,
    //         phone: customer.phone
    //     },
    //     movie: {
    //         _id: movie._id,
    //         title: movie.title,
    //         dailyRentalRate: movie.dailyRentalRate
    //     }
    // });

    // const result = await rental.save();
    // movie.numberInStock --;
    // await movie.save();

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const updatedMovie = await Movie.findOneAndUpdate({
            _id: req.body.movieId,
            numberInStock: {$gt: 0} // Critical concurrency guard -> prevents RACE conditions
        }, {
            $inc: {numberInStock: -1}
        }, {
            returnDocument : "after",
            session
        });

        if(!updatedMovie) {
            session.abortTransaction();
            return res.status(404).send("Movie not foundor out of stock");
        }

        // Now create the new rental object
        const rental = new Rental({
            customer: {
                _id: customer._id,
                name: customer.name,
                phone: customer.phone
            },
            movie: {
                _id: updatedMovie._id,
                title: updatedMovie.title,
                dailyRentalRate: updatedMovie.dailyRentalRate
            }
        });

        // Pass the session to each database operation
        await rental.save({ session });

        // Commit all changes to the database
        await session.commitTransaction();
        console.log("Transaction successful");

        res.send(rental);
    } catch (err) {
        // Abort and roll back all changes if an error happens
        await session.abortTransaction();
        res.status(500).send('Transaction failed, changes rolled back.', err)
    } finally {
        // Always close the session
        session.endSession();
    } 
});

/** ------ DELETE ROUTE ------ */

router.delete('/:id', async (req, res) => {
    const deletedRental = await Rental.findByIdAndDelete(req.params.id);
    if(!deletedRental) {
        return res.status(404).send("Rental not found!");
    }

    res.send(deletedRental);
});

module.exports = router;