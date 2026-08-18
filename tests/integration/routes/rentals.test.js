const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const request = require("supertest");

const { Rental } = require("../../../models/rentals");
const { Movie } = require("../../../models/movies");
const { Genre } = require("../../../models/genre");
const { User } = require("../../../models/user");
const { Customer } = require("../../../models/customer");
const moment = require("moment");

let server;
let replset;

describe("/api/rentals", () => {
    let token;
    let newCustomer;
    let newCustomerId;
    let movie1;
    let movie2;
    let movieId_1;
    let movieId_2;
    let rental;
    let rentalId;
    let newGenre;
    let genreId;

    beforeAll(async () => {
        replset = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
        await mongoose.connect(replset.getUri());
    });

    beforeEach(async () => {
        server = require("../../../index");

        newCustomerId = new mongoose.Types.ObjectId();
        genreId = new mongoose.Types.ObjectId();
        rentalId = new mongoose.Types.ObjectId();
        movieId_1 = new mongoose.Types.ObjectId();
        movieId_2 = new mongoose.Types.ObjectId();

        newCustomer = new Customer({
            _id: newCustomerId,
            name: "New Customer",
            phone: "1234567890",
            isGold: true
        });

        await newCustomer.save();

        newGenre = new Genre({
            _id: genreId,
            name: "12345"
        });

        await newGenre.save();
        
        movie1 = new Movie({
            _id: movieId_1,
            title: "new movie 1",
            dailyRentalRate: 10,
            genre: newGenre,
            numberInStock: 10
        });

        movie2 = new Movie({
            _id: movieId_2,
            title: "new movie 2",
            dailyRentalRate: 10,
            genre: newGenre,
            numberInStock: 10
        });

        await movie1.save();
        await movie2.save();
        
        rental = new Rental({
            _id: rentalId,
            customer : newCustomer,
            movie: movie1
        });
        await rental.save();

        token = new User().generateAuthToken();
    });

    afterEach(async () => {
        await server.close();
        await Rental.deleteMany({});
        await Movie.deleteMany({});
        await Genre.deleteMany({});
        await Customer.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await replset.stop();

    });

    describe("GET /", () => {
        let newRental;

        const executeRequest = () => {
            return request(server).get("/api/rentals");
        }

        beforeEach(async () => {
            newRental = new Rental({
                customer : {
                    _id: newCustomerId,
                    name: "12345",
                    phone: "12345"
                },
                movie: movie2
            });

            await newRental.save();
        });

        it("should return 200 status on successful request", async () => {
            const res = await executeRequest();
            expect(res.status).toBe(200);
        });
        it("should return the list of rentals", async () => {
            const res = await executeRequest();
            expect(res.body.length).toBe(2);
            expect(res.body.some(r => r.customer.name === "New Customer")).toBeTruthy();
            expect(res.body.some(r => r.customer.name === "12345")).toBeTruthy();
            expect(res.body.some(r => r.movie.title === "new movie 1")).toBeTruthy();
            expect(res.body.some(r => r.movie.title === "new movie 2")).toBeTruthy();
        });
    });

    describe("GET /:id", () => {

        const executeRequest = () => {
            return request(server).get(`/api/rentals/${rentalId}`);
        }

        it("should return 200 status on valid request", async () => {
            const res = await executeRequest();
            expect(res.status).toBe(200);
        });
        it("should return a 400 status on invalid id", async() => {
            rentalId = "1"

            const res = await executeRequest();
            expect(res.status).toBe(400);
        });
        it("should return a 404 status if no customer found", async() => {
            rentalId = new mongoose.Types.ObjectId().toHexString();

            const res = await executeRequest();
            expect(res.status).toBe(404);
        });
        it("should return the correct rental", async() => {
            const res = await executeRequest();
            expect(res.body.customer).toHaveProperty("name", "New Customer");
            expect(res.body.movie).toHaveProperty("title", "new movie 1");
        });
    });

    describe("POST /", () => {
        const executeRequest = () => {
            return request(server)
            .post("/api/rentals")
            .set("x-auth-token", token)
            .send({
                movieId: movieId_2,
                customerId: newCustomerId
            });
        }
        it("should return 200 status for valid request", async () => {
            const res = await executeRequest();
            expect(res.status).toBe(200);
        });
        it("should return 401 when not logged in", async () => {
            token = "";
            const res = await executeRequest()
            expect(res.status).toBe(401);
        });
        it("should return 400 status for invalid customerId", async () => {
            newCustomerId = "1";
            const res = await executeRequest();
            expect(res.status).toBe(400);
        });
        it("should return 400 status for invalid movieId", async () => {
            movieId_2 = "1";
            const res = await executeRequest();
            expect(res.status).toBe(400);
        });
        it("should return a 404 status if no customer found", async () => {
            await Customer.deleteMany({});

            const res = await executeRequest();
            expect(res.status).toBe(404); 
            expect(res.error.text).toMatch(/not found/i);
        });
        it("should return a 404 status if no movie found", async () => {
            await Movie.deleteMany({});

            const res = await executeRequest();
            expect(res.status).toBe(404); 
            expect(res.error.text).toMatch(/not found/i);
        });
        it("should revert if movie stock is 0", async () => {
            movie2.numberInStock = 1;
            await movie2.save();

            const [res1, res2] = await Promise.all([executeRequest(), executeRequest()]);

            const statuses = [res1.status, res2.status].sort();
            expect(statuses).toEqual([200, 500]);

            const movieInDb = await Movie.findById(movieId_2);

            expect(movieInDb.numberInStock).toEqual(0);
        });
        it("should add the rental to the db on valid input", async () => {
            let movie2NumberInStock = movie2.numberInStock;

            await executeRequest();

            const rentalInDb = await Rental.lookup(newCustomerId, movieId_2);

            expect(rentalInDb).not.toBeNull();

            const diff = new Date() - rentalInDb.dateOut;
            expect(diff).toBeGreaterThan(0);

            expect(rentalInDb.customer.name).toEqual("New Customer");
            expect(rentalInDb.customer.phone).toEqual("1234567890");

            expect(rentalInDb.movie.title).toEqual("new movie 2");

            let movie2InDb = await Movie.findById(movieId_2);
            expect(movie2InDb.numberInStock).toEqual(movie2NumberInStock - 1);
        });
        it("should return the rental to the client", async () => {
            const res = await executeRequest();

            expect(res.body).toHaveProperty("customer.name", "New Customer");
            expect(res.body).toHaveProperty("movie.title", "new movie 2");
            expect(res.body).toHaveProperty("rentalFee");
            expect(res.body).toHaveProperty("dateOut");
        });
    });

    describe("DELETE /:id", () => {
        let authorizedUser;
        let unauthorizedUser;

        const executeRequest = () => {
            return request(server)
            .delete(`/api/rentals/${rentalId}`)
            .set("x-auth-token", token)
        }

        beforeEach(async () => {
            authorizedUser = { _id: new mongoose.Types.ObjectId(), isAdmin: true }
            token = new User(authorizedUser).generateAuthToken();
        });

        it("should return 200 status on successful request", async() => {
            const res = await executeRequest();
            expect(res.status).toBe(200);
        });
        it("should return 400 status on invalid object id", async() => {
            rentalId = "1";

            const res = await executeRequest();
            expect(res.status).toBe(400);
            expect(res.error.text).toMatch(/invalid id/i);
        });
        it("should return 401 status if not logged in", async() => {
            token = "";

            const res = await executeRequest();
            expect(res.status).toBe(401);
            expect(res.error.text).toMatch(/no token provided/i);
        });
        it("should return 403 status if not admin", async() => {
            unauthorizedUser = { _id: new mongoose.Types.ObjectId(), isAdmin: false }
            token = new User(unauthorizedUser).generateAuthToken();

            const res = await executeRequest();
            expect(res.status).toBe(403);
            expect(res.error.text).toMatch(/access denied/i);
        });
        it("should return 404 status if rental not found", async() => {
            rentalId = new mongoose.Types.ObjectId();

            const res = await executeRequest();
            expect(res.status).toBe(404);
            expect(res.error.text).toMatch(/not found/i);
        });
        it("should delete the rental from the db", async() => {
            const foundRental = await Rental.findById(rentalId);
            expect(foundRental).not.toBeNull();

            await executeRequest();

            const deletedRental = await Rental.findById(rentalId);
            
            expect(deletedRental).toBeNull()
        });
        it("should return the deleted rental to the client", async () => {
            const res = await executeRequest();

            expect(Object.keys(res.body))
                .toEqual(expect.arrayContaining(["customer", "movie", "dateOut", "rentalFee"]));
        });
    });
});