/** THIS IS ONLY REQUIRED IN EXPRESS V4!!!!! */

// HANDLER IS SIMPLY THE ROUTE HANDLER USED. THIS RETURNS A REFERENCE TO THAT ROUTE HANDLER FUNCTION
module.exports =  function (handler) {
    return async (req, res, next) => {
        try {
            await handler(req, res);
        } catch(err) {
            next(err);
        }
    }
}