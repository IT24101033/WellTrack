'use strict';

/**
 * middlewares/roleMiddleware.js
 *
 * authorizeRoles(...roles) — Generic factory that restricts an endpoint
 * to users whose role is in the provided list.  Must be used AFTER authenticate.
 *
 * Usage:
 *   router.post('/', authenticate, authorizeRoles('admin'), handler);
 *   router.get('/',  authenticate, authorizeRoles('admin', 'student'), handler);
 */

/**
 * Factory middleware — restricts access to users with one of the given roles.
 *
 * @param  {...string} roles  Allowed role strings (e.g. 'admin', 'student').
 * @returns {Function}        Express middleware function.
 */
const authorizeRoles = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: `Forbidden. Required role(s): ${roles.join(', ')}.`,
        });
    }
    next();
};

module.exports = { authorizeRoles };
