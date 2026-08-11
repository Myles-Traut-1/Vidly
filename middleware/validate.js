module.exports = (validator) => { // Validator is the specific validator function that is passed
    return (req, res, next) => {
        const { error } = validator(req.body);
        if( error ) {
            return res.status(400).send(error.details[0].message);
        }
        next();
    }
}