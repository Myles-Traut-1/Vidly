const errorMiddleware = require("../../../middleware/error");
const logger = require("../../../utils/logger");

describe("error middleware", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should log the error", () => {
        const err = new Error("Something broke ....");
        const req = {};
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
        const next = jest.fn();

        jest.spyOn(logger, "error").mockImplementation(() => {});

        errorMiddleware(err, req, res, next);

        expect(logger.error).toHaveBeenCalledWith(err);
    });
    it("should return a 500 status and an error message", () => {
        const err = new Error("Something Broke");
        const req = {};
        const res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
        const next = {};

        errorMiddleware(err, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith("An error occured fetching data...");
    });
});