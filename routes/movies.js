const mongoose = require("mongoose");
const express = require("express");

const { Movie } = require("../models/movies");
const { Genre } = require("../models/genre");
const { validateMovie } = require("../utils/utils");

const router = express.Router();

/** ------ GET ROUTES ------ */

router.get('/', async (req, res) => {
    const movies = await Movie.find().sort({name: 1});
    res.send(movies);
});

router.get('/:id', async (req, res) => {
    const movie = await Movie.findById(req.params.id);
    if(!movie) {
        res.status(404).send("Movie not found!");
    }
    res.send(movie);
});

/** ------ POST ROUTES ------ */

router.post('/', async (req, res) => {
    const { error } = validateMovie(req.body);
    if(error) {
        res.status(400).send(error.details[0].message);
    }

    const genre = await Genre.findById(req.body.genreId);
    if(!genre) {
        res.status(404).send("Genre not found!");
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

    try{
        const result = await movie.save();
        res.send(result);
    } catch (err) {
        console.error("Database error...", err);
    }
});

/** ------ PUT ROUTES ------ */

router.put('/:id', async (req, res) => {
    const { error } = validateMovieUpdate(req.body);
    if(error) {
        res.status(400).send(error.details[0].message);
    }

    const genre = await Genre.findById(req.body.genreId);
    if(!genre) {
        res.status(404).send("Genre not found!");
    }

    const updatedMovie = await Movie.findByIdAndUpdate(req.params.id, {
        title: req.body.title,
        genre: {
            _id: genre._id,
            name: genre.name
        },
        numberInStock: req.body.numberInStock,
        dailyRentalRate: req.body.dailyRentalRate
    }, {new: true});

    if(!updatedMovie) {
        res.status(404).send("Movie not found!");
    }

    res.send(updatedMovie);
});

/** ------ DELETE ROUTES ------ */

router.delete('/:id', async (req, res) => {
    const deletedMovie = await Movie.findByIdAndDelete(req.params.id);
    if(!deletedMovie) {
        res.status(404).send("Movie not found!");
    }

    res.send(deletedMovie);
});

module.exports = router;