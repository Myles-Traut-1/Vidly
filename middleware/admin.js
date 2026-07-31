
module.exports = function(req, res, next) {
    if(!req.user.isAdmin) {
        // 403 -> FORBIDDEN -> VALID TOKEN BUT NO PERMISSIONS
        // 401 -> UNAUTHORISED -> INVALID TOKEN
        return res.status(403).send("Access Denied!");
    }

    next();
}