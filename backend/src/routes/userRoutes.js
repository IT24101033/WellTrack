'use strict';

/**
 * routes/userRoutes.js
 * All /api/users endpoints for auth, profile management, and admin control.
 */

const express = require('express');
const router = express.Router();

const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
    changePassword,
    deleteProfile,
    getAllUsers,
    getUserById,
    deactivateUser,
    changeUserRole,
    permanentDeleteUser,
} = require('../controllers/userController');

// ── Public Routes ──────────────────────────────────────────────────────────────
router.post('/register', registerUser);  // POST   /api/users/register
router.post('/login', loginUser);        // POST   /api/users/login

// ── Protected: Own Profile ─────────────────────────────────────────────────────
router.get('/profile', authenticate, getProfile);                             // GET    /api/users/profile
router.put('/profile', authenticate, upload.single('profileImage'), updateProfile); // PUT    /api/users/profile
router.put('/profile/password', authenticate, changePassword);                // PUT    /api/users/profile/password
router.delete('/profile', authenticate, deleteProfile);                       // DELETE /api/users/profile (soft)

// ── Admin: User Management ─────────────────────────────────────────────────────
router.get('/admin/users', authenticate, authorizeAdmin, getAllUsers);                        // GET    /api/users/admin/users
router.get('/admin/users/:id', authenticate, authorizeAdmin, getUserById);                   // GET    /api/users/admin/users/:id
router.patch('/admin/users/:id/status', authenticate, authorizeAdmin, deactivateUser);       // PATCH  /api/users/admin/users/:id/status
router.patch('/admin/users/:id/role', authenticate, authorizeAdmin, changeUserRole);         // PATCH  /api/users/admin/users/:id/role
router.delete('/admin/users/:id', authenticate, authorizeAdmin, permanentDeleteUser);        // DELETE /api/users/admin/users/:id

module.exports = router;
