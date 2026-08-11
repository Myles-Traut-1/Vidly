const mongoose = require("mongoose");
const moment = require("moment");

const rentalSchema = new mongoose.Schema({
    // CREATE CUSTOM SCHEMAS FOR CUSTOMER AND MOVIE TO ONLY STORE ESSENTIAL DATA
    // NOT ALL DATA FROM CUSTOMER IF WE USED IMPORTED SCHEMA
    customer: {
        type: new mongoose.Schema({
            name: {
                type: String,
                required: true,
                minLength: 5,
                maxLength: 255,
                trim: true
            },
            phone: {
                type: String,
                minLength: 5,
                maxLength: 255,
                required: true
            },
            isGold: {
                type: Boolean,
                default: false
            }
        }),
        required: true
    },
    movie: {
        type: new mongoose.Schema({
            title: {
                type: String,
                minLength: 5,
                maxLength: 255,
                required: true
            },
            dailyRentalRate: {
                type: Number,
                min: 0,
                max: 20,
                required: true
            }
        }),
        required: true
    },
    dateOut: {
        type: Date,
        required: true,
        default: Date.now
    },
    dateReturned: {
        type: Date
    },
    rentalFee: {
        type: Number,
        min: 0
    }
});

// HERE WE INTRODUCE STATIC METHODS. 
// A STATIC METHOD IS AVAILABLE ON A CLASS. IT IS GENERIC AND I SNOT APPLIED TO EACH UNIQUE INSTANCE
// AN INSTANCE METHOD APPLIES TO A SPECIFIC INSTANCE OF A CLASS AND OPERATES ON THAT UNIQUE OBJECT. eg  new User().generateAuthToken()

rentalSchema.statics.lookup = function(customerId, movieId) {
    return this.findOne({
        "customer._id": customerId, 
        "movie._id": movieId
    });
}

// THIS IS AN INSTANCE METHOD
rentalSchema.methods.return = function() {
    this.dateReturned = new Date();
    
    const rentalDays = moment().diff(this.dateOut, "days");   
    this.rentalFee = this.movie.dailyRentalRate * rentalDays;
}

const Rental = mongoose.model("Rental", rentalSchema);

exports.Rental = Rental;
exports.rentalSchema = rentalSchema;