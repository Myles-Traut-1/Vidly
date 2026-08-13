const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const request = require("supertest");

const { Movie } = require("../../../models/movies");
const { Genre } = require("../../../models/genre");
const { User } = require("../../../models/user");

let server;
let replset;

describe("/api/movies", () => {
    let genreId_;
    let genre_;
    let title_;
    let numberInStock_
    let dailyRentalRate_
    let movieId;
    let movie;

    beforeAll(async () => {
        replset = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
        await mongoose.connect(replset.getUri());
    });
    beforeEach(async () => {
        server = require("../../../index");
        genreId_ = new mongoose.Types.ObjectId();
        title_ = "new movie"
        numberInStock_ = 20;
        dailyRentalRate_ = 20;

        genre_ = new Genre({
            _id: genreId_,
            name: "New Genre"
        });

        await genre_.save();

        movieId = new mongoose.Types.ObjectId();

        movie = new Movie({
            _id: movieId,
            title: title_,
            genre: genre_,
            numberInStock: numberInStock_,
            dailyRentalRate: dailyRentalRate_
        });

        await movie.save();
    });

    afterEach(async () => {
        await Movie.deleteMany({});
        await Genre.deleteMany({});
        await server.close();
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await replset.stop();

    });

    describe("GET /", () => {
        let newMovie1 = {
            _id: new mongoose.Types.ObjectId(),
            title: 'New Movie 1',
            genre: genre_,
            numberInStock: 20,
            dailyRentalRate: 20
            }
        let newMovie2 = {
            _id: new mongoose.Types.ObjectId(),
            title: 'New Movie 2',
            genre: genre_,
            numberInStock: 30,
            dailyRentalRate: 30
        }

        it("should return the entire movies collection", async () => {
            await Movie.collection.insertMany([newMovie1, newMovie2]);

            const res = await request(server).get("/api/movies/");

            expect(res.status).toBe(200);
            
            expect(res.body.length).toEqual(3);
            expect(res.body.some(m => m.title === "new movie")).toBeTruthy();
            expect(res.body.some(m => m.title === "New Movie 1")).toBeTruthy();
            expect(res.body.some(m => m.title === "New Movie 2")).toBeTruthy();
        });
    });

    describe("GET /:id", () => {
        const executeRequest = () => {
            return request(server).get(`/api/movies/${movieId}`)
        }

        it("should return 400 status for invalid id", async () => {
            movieId = "1";

            const res = await executeRequest();

            expect(res.status).toBe(400);
            expect(res.error.text).toMatch(/invalid id/i)
        });
        it("should return 404 status if movie not found", async () => {
            movieId = new mongoose.Types.ObjectId();

            const res = await executeRequest();

            expect(res.status).toBe(404);
            expect(res.error.text).toMatch(/Movie not found/)
        });
        it("should return 200 status on valid input", async () => {
            const res = await executeRequest();

            expect(res.status).toBe(200);
        });
        it("should return the correct movie on valid input", async () => {
            const res = await executeRequest();

            expect(Object.keys(res.body))
                .toEqual(expect.arrayContaining(["title", "genre", "numberInStock", "dailyRentalRate"]));
        });
    });

    describe("POST /", () => {  
        let token;

        beforeEach(async () => {
            token = new User().generateAuthToken();
        });
        
        const executeRequest = () => {
            return request(server)
                .post("/api/movies/")
                .set("x-auth-token", token)
                .send({
                    title: title_,
                    genreId: genreId_,
                    numberInStock: numberInStock_,
                    dailyRentalRate: dailyRentalRate_
                });
        }

        it("should return 401 status if not logged in", async () => {
            token = "";

            const res = await executeRequest();

            expect(res.status).toBe(401);
            expect(res.error.text).toMatch(/Access denied/);
        });
        it("should return 400 status on invalid genreId", async () => {
            genreId_ = "1";

            const res = await executeRequest();

            expect(res.status).toBe(400);
            expect(res.error.text).toMatch(/fails to match the required pattern/);
        });
        it("should return 404 status if genre not found", async () => {
            genreId_ = new mongoose.Types.ObjectId();

            const res = await executeRequest();

            expect(res.status).toBe(404);
            expect(res.error.text).toMatch(/Genre not found/);
        });
        it("should return 200 status on valid input", async () => {
            const res = await executeRequest();
            expect(res.status).toBe(200);
        });
        it("should add the new movie to the db on valid input", async () => {
            const res = await executeRequest();

            const movieInDb = await Movie.findOne({title: title_});

            expect(movieInDb).not.toBeNull();
            expect(movieInDb.title).toBe(title_);
        });
        it("should return the movie in the result", async () => {
            const res = await executeRequest();

            const movieInDb = await Movie.findOne({title: title_});
            expect(res.body.title).toEqual(movieInDb.title);
        });
    });

    describe("PUT /:id", () => {
        let updatedTitle;
        let updatedNumberInStock;

        beforeEach(async () => {
            token = new User().generateAuthToken();
            updatedTitle = "Update Movie";
            updatedNumberInStock = numberInStock_ / 2;
        });

        const executeRequest = () => {
            return request(server)
                .put(`/api/movies/${movieId}`)
                .set("x-auth-token", token)
                .send({
                    title: updatedTitle,
                    genreId: genreId_,
                    numberInStock: updatedNumberInStock,
                    dailyRentalRate: dailyRentalRate_
                });
        }
        
        it("should return 400 status if invalid input", async () => {
            updatedTitle = "";

            const res = await executeRequest();

            expect(res.status).toBe(400);
            expect(res.error.text).toMatch(/not allowed to be empty/i);
        });
        it("should return 400 status if invalid objectId", async () => {
            movieId = "1";

            const res = await executeRequest();

            expect(res.status).toBe(400);
            expect(res.error.text).toMatch(/invalid id/i)
        });
        it("should return 401 status if not logged in", async () => {
            token = "";
            const res = await executeRequest();
            expect(res.status).toBe(401);
            expect(res.error.text).toMatch(/Access denied/i);
        });
        it("should return 404 status if genre not found", async () => {
            genreId_ = new mongoose.Types.ObjectId();

            const res = await executeRequest();

            expect(res.status).toBe(404);
            expect(res.error.text).toMatch(/not found/i);
        });
        it("should return 404 status if movie not found", async () => {
            movieId = new mongoose.Types.ObjectId();

            const res = await executeRequest();

            expect(res.status).toBe(404);
            expect(res.error.text).toMatch(/not found/i);
        });
        it("should update the movie in the db on a valid input", async () => {
            const res = await executeRequest();

            expect(res.status).toBe(200);
            
            let movieInDb = await Movie.findById(movieId);

            expect(movieInDb.title).toBe(updatedTitle);
            expect(movieInDb.numberInStock).toEqual(updatedNumberInStock);
            expect(movieInDb.dailyRentalRate).toEqual(dailyRentalRate_);
        });
        it("should return the updated movie in the response", async () => {
            const res = await executeRequest();

            expect(res.body.title).toMatch(updatedTitle);
            expect(res.body.numberInStock).toEqual(updatedNumberInStock);   
        });
    });

    describe("DELETE /:id", () => {
        let token;
        let user;

        beforeEach(() => {
            user = {_id: new mongoose.Types.ObjectId(), isAdmin: true};
            token = new User(user).generateAuthToken();
        });

        const executeRequest = () => {
            return request(server).delete(`/api/movies/${movieId}`).set("x-auth-token", token);
        }

        it("should return 400 status on invalid id", async () => {
            movieId = "1";
            
            const res = await executeRequest();
            expect(res.status).toBe(400);
        });
        it("should return 401 status if not logged in", async () => {
            token = "";
            
            const res = await executeRequest();
            expect(res.status).toBe(401);
        });
        it("should return 403 status if not admin", async () => {
            user = {_id: new mongoose.Types.ObjectId(), isAdmin: false};
            token = new User(user).generateAuthToken();
            
            const res = await executeRequest();
            expect(res.status).toBe(403);
        });
        it("should return 404 status if movie not found", async () => {
            await Movie.deleteMany({});
            
            const res = await executeRequest();
            
            expect(res.status).toBe(404);
        });
        it("should return 200 status for valid input", async () => {
            const res = await executeRequest();
            
            expect(res.status).toBe(200);
        });
        it("should delete the movie from the db on valid input", async () => {
            let id = movie._id;

            const res = await executeRequest();

            const deletedMovie = await Movie.findById(id);
            
            expect(deletedMovie).toBe(null);
        });
        it("should return the deleted movie in the response", async () => {
            const res = await executeRequest();
  
            expect(Object.keys(res.body))
                .toEqual(expect.arrayContaining(["title", "genre", "numberInStock", "dailyRentalRate"]));
        });
    });
});