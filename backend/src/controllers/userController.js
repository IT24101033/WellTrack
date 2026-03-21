'use strict';

/**
 * controllers/userController.js
 * All user-related business logic: auth, profile CRUD, admin management.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ── Helpers ────────────────────────────────────────────────────────────────────
const signToken = (id, role) =>
    jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

const respondWithToken = (res, user, statusCode = 200) => {
    const token = signToken(user._id, user.role);
    res.status(statusCode).json({
        success: true,
        token,
        user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            isActive: user.isActive,
        },
    });
};

// ── 1. Register ────────────────────────────────────────────────────────────────
/**
 * POST /api/users/register
 * Body: { fullName, email, password, confirmPassword, role }
 */
const registerUser = async (req, res) => {
    try {
        const { fullName, email, password, confirmPassword, role } = req.body;

        // Basic validation
        if (!fullName || !email || !password || !confirmPassword) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
        }

        const exists = await User.findOne({ email: email.toLowerCase() });
        if (exists) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }

        const user = await User.create({ fullName, email, password, role: role || 'student' });
        user.activityLog.push({ action: 'registered', details: 'Account created' });
        await user.save();

        respondWithToken(res, user, 201);
    } catch (err) {
        console.error('[registerUser]', err);
        if (err.name === 'ValidationError') {
            const msg = Object.values(err.errors).map((e) => e.message).join(' ');
            return res.status(400).json({ success: false, message: msg });
        }
        res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
};

// ── 2. Login ───────────────────────────────────────────────────────────────────
/**
 * POST /api/users/login
 * Body: { email, password }
 */
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        // Must explicitly select password (select: false in schema)
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact admin.' });
        }

        user.activityLog.push({ action: 'login', details: 'Logged in' });
        await user.save();

        respondWithToken(res, user);
    } catch (err) {
        console.error('[loginUser]', err);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
};

// ── 3. Get own profile ─────────────────────────────────────────────────────────
/**
 * GET /api/users/profile
 * Auth: authenticate
 */
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Account is deactivated.' });
        }
        res.json({ success: true, user });
    } catch (err) {
        console.error('[getProfile]', err);
        res.status(500).json({ success: false, message: 'Server error fetching profile.' });
    }
};

// ── 4. Update profile ──────────────────────────────────────────────────────────
/**
 * PUT /api/users/profile
 * Auth: authenticate
 * Body: { fullName, age, gender, height, weight, universityId }
 * File (optional): profileImage
 */
const updateProfile = async (req, res) => {
    try {
        const { fullName, age, gender, height, weight, universityId } = req.body;

        const allowedUpdates = {};
        if (fullName !== undefined) allowedUpdates.fullName = fullName;
        if (age !== undefined) allowedUpdates.age = Number(age);
        if (gender !== undefined) allowedUpdates.gender = gender;
        if (height !== undefined) allowedUpdates.height = Number(height);
        if (weight !== undefined) allowedUpdates.weight = Number(weight);
        if (universityId !== undefined) allowedUpdates.universityId = universityId;

        // Multer attaches file info to req.file
        if (req.file) {
            allowedUpdates.profileImage = `/uploads/${req.file.filename}`;
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        Object.assign(user, allowedUpdates);
        user.activityLog.push({ action: 'profile_updated', details: 'Profile information updated' });
        await user.save();

        res.json({ success: true, message: 'Profile updated successfully.', user });
    } catch (err) {
        console.error('[updateProfile]', err);
        if (err.name === 'ValidationError') {
            const msg = Object.values(err.errors).map((e) => e.message).join(' ');
            return res.status(400).json({ success: false, message: msg });
        }
        res.status(500).json({ success: false, message: 'Server error updating profile.' });
    }
};

// ── 5. Change password ─────────────────────────────────────────────────────────
/**
 * PUT /api/users/profile/password
 * Auth: authenticate
 * Body: { currentPassword, newPassword, confirmPassword }
 */
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ success: false, message: 'All password fields are required.' });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'New passwords do not match.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
        }

        const user = await User.findById(req.user.id).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
        }

        user.password = newPassword; // pre-save hook will hash it
        user.activityLog.push({ action: 'password_changed', details: 'Password changed' });
        await user.save();

        res.json({ success: true, message: 'Password changed successfully.' });
    } catch (err) {
        console.error('[changePassword]', err);
        res.status(500).json({ success: false, message: 'Server error changing password.' });
    }
};

// ── 6. Soft delete (deactivate self) ──────────────────────────────────────────
/**
 * DELETE /api/users/profile
 * Auth: authenticate
 * Sets isActive = false (soft delete)
 */
const deleteProfile = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { isActive: false },
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        res.json({ success: true, message: 'Account deactivated successfully.' });
    } catch (err) {
        console.error('[deleteProfile]', err);
        res.status(500).json({ success: false, message: 'Server error deactivating account.' });
    }
};

// ── 7. Admin: Get all users ────────────────────────────────────────────────────
/**
 * GET /api/users/admin/users?search=&role=&page=&limit=
 * Auth: authenticate + authorizeAdmin
 */
const getAllUsers = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.role && ['student', 'admin'].includes(req.query.role)) {
            filter.role = req.query.role;
        }
        if (req.query.search) {
            const regex = new RegExp(req.query.search, 'i');
            filter.$or = [{ fullName: regex }, { email: regex }, { universityId: regex }];
        }

        const [users, total] = await Promise.all([
            User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            User.countDocuments(filter),
        ]);

        res.json({
            success: true,
            data: users,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (err) {
        console.error('[getAllUsers]', err);
        res.status(500).json({ success: false, message: 'Server error fetching users.' });
    }
};

// ── 8. Admin: Get user by ID ───────────────────────────────────────────────────
/**
 * GET /api/users/admin/users/:id
 * Auth: authenticate + authorizeAdmin
 */
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        res.json({ success: true, user });
    } catch (err) {
        console.error('[getUserById]', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── 9. Admin: Deactivate / reactivate user ─────────────────────────────────────
/**
 * PATCH /api/users/admin/users/:id/status
 * Auth: authenticate + authorizeAdmin
 * Body: { isActive: boolean }
 */
const deactivateUser = async (req, res) => {
    try {
        const { isActive } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive: Boolean(isActive) },
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        const action = user.isActive ? 'reactivated' : 'deactivated';
        res.json({ success: true, message: `User account ${action}.`, user });
    } catch (err) {
        console.error('[deactivateUser]', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── 10. Admin: Change user role ────────────────────────────────────────────────
/**
 * PATCH /api/users/admin/users/:id/role
 * Auth: authenticate + authorizeAdmin
 * Body: { role: 'student' | 'admin' }
 */
const changeUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!['student', 'admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role.' });
        }
        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        res.json({ success: true, message: `Role updated to ${role}.`, user });
    } catch (err) {
        console.error('[changeUserRole]', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// ── 11. Admin: Permanently delete user ────────────────────────────────────────
/**
 * DELETE /api/users/admin/users/:id
 * Auth: authenticate + authorizeAdmin
 */
const permanentDeleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        res.json({ success: true, message: 'User permanently deleted.' });
    } catch (err) {
        console.error('[permanentDeleteUser]', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

module.exports = {
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
};
