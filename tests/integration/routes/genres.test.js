const request = require("supertest");
const mongoose = require("mongoose");

const { Genre } = require("../../../models/genre");
const { User } = require("../../../models/user");

let server;

describe("/api/genres", () => {
    beforeEach(() => {
        server = require("../../../index");
    });
    afterEach(async () => {
        await Genre.deleteMany({});
        await server.close();
    });
    afterAll(async () => {
        await mongoose.disconnect();
    });

    describe("GET /", () => {
        it("should return all genres", async () => {
            await Genre.collection.insertMany([
                { name: "Genre1" },
                { name: "Genre2" }
            ]);

            const res = await request(server).get("/api/genres");
            
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body.some(g => g.name === "Genre1")).toBeTruthy();
            expect(res.body.some(g => g.name === "Genre2")).toBeTruthy();
        });
    });

    describe("GET /:id", () => {
        it("should return correct genre if a valid Id is passed", async () => {
            const genre = new Genre({name: "Genre1"});
            await genre.save();

            const res = await request(server).get(`/api/genres/${genre._id}`);
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("name", "Genre1");
        });
        it("should return 404 status if genre not found", async () => {
            let res = await request(server).get(`/api/genres/${new mongoose.Types.ObjectId()}`);
            expect(res.status).toBe(404);
            expect(res.error.text).toEqual("Genre Not Found!");

        });
        it("should return 400 status if invalid Id is passed", async () => {
            const invalidId = 1;

            const res = await request(server).get(`/api/genres/${invalidId}`);
            expect(res.status).toBe(400);
            expect(res.error.text).toEqual("Invalid Id");
        });
    });

    describe("POST /", () => {
        let token;
        let name_;

        const executeRequest = async () => {
            return await request(server)
                .post("/api/genres")
                .set("x-auth-token", token)
                .send({name: name_});
        };

        beforeEach(() => {
            token = new User().generateAuthToken();
            name_ = "Genre1";
        });

        it("should return 401 status if user is not authorised", async () => {
            token = "";

            const res = await executeRequest();
            
            expect(res.status).toBe(401);
        });
        it("should return 400 status if genre name is less than 3 characters", async () => {
            name_ = "12";

            const res = await executeRequest();
            
            expect(res.status).toBe(400);
        });
        it("should return 400 status if genre name is greater than 50 characters", async () => {  
            name_ = new Array(52).join("a");

            const res = await executeRequest();
            
            expect(res.status).toBe(400);
        });
        it("should save the genre to the database if it is valid", async () => {
            
            const res = await executeRequest();

            const genre = await Genre.find({name: "Genre1"});
            
            expect(res.status).toBe(200);
            expect(genre).not.toBeNull();
        });
        it("should return the genre to the client in lowercase if it is valid", async () => {
            const res = await executeRequest();
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("_id");
            expect(res.body).toHaveProperty("name", "genre1");
        });
    });

    describe("PUT /:id", () => {
        let token;
        let name_;
        let id;
        let genre;

        beforeEach(async () => {
            genre = new Genre({name: "New Genre"});
            await genre.save();
        });

        const executeRequest = async () => {
            return await request(server)
                .put(`/api/genres/${id}`)
                .set("x-auth-token", token)
                .send({name: name_});
        }

        beforeEach(() => {
            id = genre._id;
            token = new User().generateAuthToken();
            name_ = "Updated Genre"
        });

        it("should return 401 status for missing token", async () => {
            token = "";

            const res = await executeRequest();

            expect(res.status).toBe(401);
        });
        it("should return 400 status for invalid token", async () => {
            token = "a";

            const res = await executeRequest();

            expect(res.status).toBe(400);
        });
        it("should return 400 status for invalid id", async () => {
            id = 1;
            const res = await executeRequest();

            expect(res.status).toBe(400);
        });
        it("should return 404 status if genre not found", async () => {
            id = new mongoose.Types.ObjectId();
            const res = await executeRequest()

            expect(res.status).toBe(404);
        });
        it("should return 400 status and throw if genre name invalid", async () => {
            name_ = ""
            let res = await executeRequest();
            expect(res.status).toBe(400);
            expect(res.error.text).toEqual('"name" is not allowed to be empty');

            name_ = "12"
            res = await executeRequest();
            expect(res.status).toBe(400);
            expect(res.error.text).toEqual('"name" length must be at least 3 characters long');

            name_ = new Array(52).join("a");
            res = await executeRequest();
            expect(res.status).toBe(400);
            expect(res.error.text).toEqual('"name" length must be less than or equal to 50 characters long');
        });
        it("should update the genre in the database with valid id", async () => {
            const res = await executeRequest();

            const updatedGenre = await Genre.findById(genre._id);

            expect(res.status).toBe(200);
            expect(updatedGenre.name).toEqual("updated genre");
        });
        it("should return the updated genre to the client", async () => {
            const res = await executeRequest();

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("name", "updated genre");
        });
    });

    describe("DELETE /:id", () => {
        let id;
        let token;
        let genre;
        const user = {id: 1, isAdmin: true};

        const executeRequest = async () => {
            return await request(server)
                .delete(`/api/genres/${id}`)
                .set("x-auth-token", token);
        }

        beforeEach(async () => {
            genre = new Genre({name: "New Genre"});
            await genre.save();
            id = genre._id;
            token = new User(user).generateAuthToken();
        });

        it("should return 401 status on missing token", async () => {
            token = "";
            const res = await executeRequest();
            expect(res.status).toBe(401);
        });
        it("should return 400 status on invalid token", async () => {
            token = "a";
            const res = await executeRequest();
            expect(res.status).toBe(400);
        });
        it("should return 400 status on invalid id", async () => {
            id = 1;
            const res = await executeRequest();
            expect(res.status).toBe(400);
        });
        it("should return 403 status if user is not admin", async () => {
            token = new User({id: 2, isAdmin: false}).generateAuthToken();
            const res = await executeRequest();
            expect(res.status).toBe(403);
        });
        it("should return 404 if genre not found", async () => {
            id = new mongoose.Types.ObjectId();
            const res = await executeRequest();

            expect(res.status).toBe(404);
        });
        it("should delete the genre form the database with a valid id", async () => {
            const genreId = genre._id;
            const res = await executeRequest();
            expect(res.status).toBe(200);

            const deletedGenre = await Genre.findById(genreId);
            expect(deletedGenre).toBeNull();
        });
        it("should return the deleted genre to the client", async () => {
            const res = await executeRequest();
            expect(res.status).toBe(200);

            expect(res.body).toHaveProperty("name", "New Genre");
        });
    });
});