const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const request = require("supertest");

const { Rental } = require("../../../models/rentals");
const { Movie } = require("../../../models/movies");
const { User } = require("../../../models/user");
const moment = require("moment");

let server;
let replset;

describe("/api/returns", () => {
    let token;
    let customerId;
    let movieId;
    let rental;
    let movie;

    let payload;

    const executeRequest = async () => {
        return await request(server)
            .post("/api/returns")
            .set('x-auth-token', token)
            .send(payload);
    }
    beforeAll(async () => {
        replset = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
        await mongoose.connect(replset.getUri());
    });

    beforeEach(async () => {
        server = require("../../../index");

        customerId = new mongoose.Types.ObjectId();
        movieId = new mongoose.Types.ObjectId();
        
        movie = new Movie({
            _id: movieId,
            title: "12345",
            dailyRentalRate: 10,
            genre: { name: "12345" },
            numberInStock: 10
        });

        await movie.save();
        
        rental = new Rental({
            customer : {
                _id: customerId,
                name: "12345",
                phone: "12345"
            },
            movie: {
                _id: movieId,
                title: "12345",
                dailyRentalRate: 10
            }
        });
        await rental.save();

        payload = { customerId, movieId };
        token = new User().generateAuthToken();
    });

    afterEach(async () => {
        await server.close();
        await Rental.deleteMany({});
        await Movie.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await replset.stop();

    });

    describe("POST /", () => {
        it("should return 401 when not logged in", async () => {
            token = "";
            const res = await executeRequest()
            expect(res.status).toBe(401);
        });
        it("should return 400 status for invalid customerId", async () => {
            payload = { movieId };
            const res = await executeRequest();
            expect(res.status).toBe(400);
        });
        it("should return 400 status for invalid movieId", async () => {
            payload = { customerId };
            const res = await executeRequest();
            expect(res.status).toBe(400);
        });
        it("should return a 404 status if no rental found", async () => {
            await Rental.deleteMany({});

            const res = await executeRequest();
            expect(res.status).toBe(404); 
        });
        it("should return a 400 status if rental already processed", async () => {
            rental.dateReturned = new Date();
            await rental.save();

            const res = await executeRequest();

            expect(res.status).toBe(400); 
        });
        it("should return a 200 status for a valid request", async () => {
            const res = await executeRequest();

            expect(res.status).toBe(200); 
        });
        it("should set the return date on the rental", async () => {
            const res = await executeRequest();

            const rentalInDb = await Rental.findById(rental._id);

            const diff = new Date() - rentalInDb.dateReturned;

            expect(diff).toBeLessThan(10 * 1000);
        });
        it("should return the correct rental fee", async () => {
            rental.dateOut = moment().add(-7, "days").toDate();
            await rental.save();

            const res = await executeRequest();

            const rentalInDb = await Rental.findById(rental._id);

            expect(rentalInDb.rentalFee).toEqual(70); // 7 days * R10 
        });
        it("should increase the number of movies in stock", async () => {
            const res = await executeRequest();

            const movieInDb = await Movie.findById(rental.movie._id);

            expect(movieInDb.numberInStock).toEqual(movie.numberInStock + 1);

        });
        it("should return the rental in the body of the response", async () => {
            const res = await executeRequest();

            expect(Object.keys(res.body))
                .toEqual(expect.arrayContaining(["rentalFee", "dateOut", "dateReturned", "customer", "movie"]));

        });
        
    });
});