const mongoose = require("mongoose");
const express = require("express");

const { Movie } = require("../models/movies");
const { Genre } = require("../models/genre");
const { validateMovie, vaidateMovieDeletion } = require("../utils/utils");

/** ------ MIDDLEWARE ------ */
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const validateObjectId = require("../middleware/validateObjectId");
const validate = require("../middleware/validate");

/** ------ ROUTER ------ */
const router = express.Router();

/** ------ GET ROUTES ------ */

router.get('/', async (req, res) => {
    const movies = await Movie.find().sort({name: 1});
    res.send(movies);
});

router.get('/:id', validateObjectId, async (req, res) => {
    const movie = await Movie.findById(req.params.id);
    if(!movie) {
        return res.status(404).send("Movie not found!");
    }
    res.send(movie);
});

/** ------ POST ROUTES ------ */

router.post('/', [auth, validate(validateMovie)], async (req, res) => {
    const genre = await Genre.findById(req.body.genreId);
    if(!genre) {
        return res.status(404).send("Genre not found!");
    }

    const movie = new Movie({
        title: req.body.title,
        genre: {
            _id: genre._id,
            name: genre.name
        },
        numberInStock: req.body.numberInStock,
        dailyRentalRate: req.body.dailyRentalRate
    });

    await movie.save();
    res.send(movie);
});

/** ------ PUT ROUTES ------ */

router.put('/:id', [auth, validateObjectId, validate(validateMovie)], async (req, res) => {
    const genre = await Genre.findById(req.body.genreId);
    if(!genre) {
        return res.status(404).send("Genre not found!");
    }

    const updatedMovie = await Movie.findByIdAndUpdate(req.params.id, {
        title: req.body.title,
        genre: {
            _id: genre._id,
            name: genre.name
        },
        numberInStock: req.body.numberInStock,
        dailyRentalRate: req.body.dailyRentalRate
    }, {returnDocument: "after"});

    if(!updatedMovie) {
        return res.status(404).send("Movie not found!");
    }

    res.send(updatedMovie);
});

/** ------ DELETE ROUTES ------ */

router.delete('/:id', [auth, admin, validateObjectId], async (req, res) => {
    const deletedMovie = await Movie.findByIdAndDelete(req.params.id);
    if(!deletedMovie) {
        return res.status(404).send("Movie not found!");
    }

    res.send(deletedMovie);
});

module.exports = router;