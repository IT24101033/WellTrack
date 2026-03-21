'use strict';

/**
 * middlewares/authMiddleware.js
 *
 * authenticate   — Verifies a Bearer JWT and attaches req.user = { id, role }
 * authorizeAdmin — Allows only users whose role === 'admin'
 */

const jwt = require('jsonwebtoken');

// ─── Token extraction helper ──────────────────────────────────────────────────
const extractToken = (req) => {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    return authHeader.split(' ')[1];
};

// ─── authenticate ─────────────────────────────────────────────────────────────
/**
 * Middleware: verify JWT and populate req.user.
 * Expected header:  Authorization: Bearer <token>
 * JWT payload must contain:  { id: Number, role: 'admin'|'user' }
 */
const authenticate = (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No token provided.',
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            id: decoded.id,
            role: decoded.role || 'user',
        };
        next();
    } catch (err) {
        const message =
            err.name === 'TokenExpiredError'
                ? 'Token has expired. Please log in again.'
                : 'Invalid token.';

        return res.status(401).json({ success: false, message });
    }
};

// ─── authorizeAdmin ───────────────────────────────────────────────────────────
/**
 * Middleware: restrict endpoint to admin role only.
 * Must be used AFTER authenticate.
 */
const authorizeAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Forbidden. Admin access required.',
        });
    }
    next();
};

module.exports = { authenticate, authorizeAdmin };
