const express = require("express");
const { Genre } = require("../models/genre");
const { validateGenre } = require("../utils/utils");

/** ------ MIDDLEWARE ------*/ 
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

/** ------ CREATE ROUTER ------ */
const router = express.Router();

/** ------ GET ROUTES ------ */
router.get('/', async (req, res) => {
    try{
        const genres = await Genre.find();
        if(genres.length === 0) {
            return res.status(404).send("No Genres Found!");
        }
        res.send(genres);
    } catch(err) {
        console.error("An error occured fetch data...", err);
    }
});

router.get('/:id', async (req, res) => {
    // FIND THE GENRE
    // IF NOT EXISTS RETURN NOT FOUND STATUS AND EXIT
    try{
        const genre = await Genre.findById(req.params.id);
        if(!genre) {
            return res.status(404).send("Genre Not Found!");
        }
        res.send(genre);
    } catch(err) {
        console.error("An error occured fetch data...", err);
    }

    
});

/** ------ POST ROUTES ------ */

// YOU MAY ADD A MUIDDLEWARE FUNCTION AS AN OPTIONAL SECOND ARG: IN THIS CASE, AUTH
router.post('/', auth, async (req, res) => {
    const { error } = validateGenre(req.body);
    if( error ) {
        return res.status(400).send(error.details[0].message);
    }

    const genre = new Genre({
        name: (req.body.name).toLowerCase()
    });

    try{
        await genre.save();
        res.send(genre);
    } catch(err) {
        console.error("An error occured fetch data...", err);
    }
});

// PUT ROUTES
router.put('/:id', async (req, res) => {
    const { error } = validateGenre(req.body);
    if( error ) {
        return res.status(400).send(error.details[0].message);
    }

    try {
        const genre = await Genre.findByIdAndUpdate(
            req.params.id,
            {$set : {
                    name: (req.body.name).toLowerCase()
                }
            },
            {new: true}
        );

        if(!genre) {
            return res.status(404).send("Genre Not Found!");
        }

        res.send(genre);
    } catch(err) {
        console.error("An error occured fetch data...", err);
    }
});

/** ------ DELETE ROUTES ------ */
router.delete('/:id', [auth, admin], async (req, res) => {
    try{
        const deletedGenre = await Genre.findByIdAndDelete(req.params.id);
        if(!deletedGenre) {
            return res.status(404).send("Genre Not Found!");
        }
        res.send(deletedGenre);
    } catch(err) {
        console.error("An error occured fetch data...", err);
    }
});

module.exports = router;