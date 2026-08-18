const express = require("express");
const { Genre } = require("../models/genre");
const { validateGenre } = require("../utils/utils");
const mongoose = require("mongoose");

/** ------ MIDDLEWARE ------*/ 
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const validateObjectId = require("../middleware/validateObjectId");
const validate = require("../middleware/validate");

/** ------ CREATE ROUTER ------ */
const router = express.Router();

/** ------ GET ROUTES ------ */
router.get('/', async (req, res) => {
    const genres = await Genre.find();
    res.send(genres);
});

router.get('/:id', validateObjectId, async (req, res) => {
    const genre = await Genre.findById(req.params.id);
    if(!genre) {
        return res.status(404).send("Genre Not Found!");
    }
    res.send(genre);  
});

/** ------ POST ROUTES ------ */

// YOU MAY ADD A MUIDDLEWARE FUNCTION AS AN OPTIONAL SECOND ARG: IN THIS CASE, AUTH
router.post('/', [auth, validate(validateGenre)], async (req, res) => {
    const genre = new Genre({
        name: (req.body.name).toLowerCase()
    });

    await genre.save();
    res.send(genre);
});

// PUT ROUTES
router.put('/:id', [auth, validateObjectId, validate(validateGenre)], async (req, res) => {
    const genre = await Genre.findByIdAndUpdate(
        req.params.id,
        {$set : {
                name: (req.body.name).toLowerCase()
            }
        },
        {returnDocument: 'after'}
    );

    if(!genre) {
        return res.status(404).send("Genre Not Found!");
    }

    res.send(genre);
});

/** ------ DELETE ROUTES ------ */
router.delete('/:id', [auth, admin, validateObjectId], async (req, res) => {
    const deletedGenre = await Genre.findByIdAndDelete(req.params.id);
    if(!deletedGenre) {
        return res.status(404).send("Genre Not Found!");
    }
    res.send(deletedGenre);
});

module.exports = router;