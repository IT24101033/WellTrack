'use strict';

/**
 * controllers/userController.js
 * All user-related business logic: auth, profile CRUD, admin management.
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Otp = require('../models/otpModel');
const { sendEmail, sendSMS } = require('../utils/notificationService');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
            phoneNumber: user.phoneNumber,
        },
    });
};

// ── 1. Register ────────────────────────────────────────────────────────────────
/**
 * POST /api/users/register
 * Body: { fullName, email, password, confirmPassword, role }
 */
const registerUser = async (req, res, next) => {
    try {
        const { fullName, email, password, confirmPassword, role, adminPin, phoneNumber } = req.body;

        // Basic validation
        if (!fullName || !email || !password || !confirmPassword) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match.' });
        }
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSymbol = /[^a-zA-Z0-9]/.test(password);
        
        if (password.length < 6 || !hasLetter || !hasNumber || !hasSymbol) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters and contain letters, numbers, and symbols.' });
        }

        const exists = await User.findOne({ email: email.toLowerCase() });
        if (exists) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }

        // Admin PIN Verification
        if (role === 'admin') {
            if (!adminPin) {
                return res.status(400).json({ success: false, message: 'Admin Registration requires a 6-digit PIN.' });
            }
            const otpRecord = await Otp.findOne({ email: email.toLowerCase() });
            if (!otpRecord) {
                return res.status(400).json({ success: false, message: 'PIN expired or not requested.' });
            }
            const isMatch = await otpRecord.compareOtp(adminPin);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: 'Invalid Admin PIN.' });
            }
            // Delete OTP after successful use
            await Otp.deleteOne({ email: email.toLowerCase() });
        }

        const user = await User.create({ 
            fullName, 
            email, 
            password, 
            role: role || 'student',
            phoneNumber: phoneNumber || '',
            activityLog: [{ action: 'registered', details: 'Account created' }]
        });

        respondWithToken(res, user, 201);
    } catch (err) {
        console.error('[registerUser] FATAL ERROR:', err.stack || err);
        if (err.name === 'ValidationError') {
            const msg = Object.values(err.errors).map((e) => e.message).join(' ');
            return res.status(400).json({ success: false, message: msg });
        }
        res.status(500).json({ success: false, message: `Server error during registration: ${err.message}` });
    }
};

// ── 1.5 Send Admin PIN ────────────────────────────────────────────────────────
/**
 * POST /api/users/send-pin
 * Body: { email, phoneNumber }
 */
const sendAdminPin = async (req, res, next) => {
    try {
        const { email, phoneNumber } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required to send PIN.' });
        }
        if (!phoneNumber) {
            return res.status(400).json({ success: false, message: 'Phone Number is required to send Admin PIN.' });
        }

        console.log(`[sendAdminPin] Request for: ${email}, Phone: ${phoneNumber}`);

        // Check if an account with this email already exists
        const exists = await User.findOne({ email: email.toLowerCase() });
        if (exists) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }

        // Generate 6 digit pin
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(pin, 10);
        
        // Delete any existing OTP for this email
        await Otp.deleteMany({ email: email.toLowerCase() });
        await Otp.create({ email: email.toLowerCase(), otpHash });
        
        const message = `Your HealthPredict Admin Registration PIN is: ${pin}. It expires in 10 minutes.`;
        
        // Normalize phone number (Twilio requires E.164)
        // For Sri Lanka: 07XXXXXXXX -> +947XXXXXXXX
        let formattedPhone = phoneNumber.trim();
        if (formattedPhone.startsWith('0') && formattedPhone.length === 10) {
            formattedPhone = '+94' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('+')) {
            // Assume +94 if not provided
            formattedPhone = '+94' + formattedPhone;
        }

        console.log(`[sendAdminPin] Sending to: Email=${email}, SMS=${formattedPhone}`);

        // Send Email & SMS in parallel
        const [emailSuccess, smsSuccess] = await Promise.all([
            sendEmail(email, 'Admin Registration PIN', message),
            sendSMS(formattedPhone, message)
        ]);
        
        console.log(`[sendAdminPin] Delivery Results for ${email}: Email=${emailSuccess}, SMS=${smsSuccess}`);
        console.log(`[sendAdminPin] PIN is: ${pin} (for debugging)`);
        
        if (!emailSuccess && !smsSuccess) {
            console.error(`[sendAdminPin] Both Email and SMS failed for ${email}`);
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to deliver PIN via Email or SMS. Please check your contact details or try again later.' 
            });
        }

        let deliveryMsg = 'PIN sent successfully.';
        if (!emailSuccess) deliveryMsg = 'PIN sent via SMS (Email delivery failed).';
        if (!smsSuccess) deliveryMsg = 'PIN sent via Email (SMS delivery failed).';

        res.status(200).json({ success: true, message: deliveryMsg });
    } catch (err) {
        console.error('[sendAdminPin] Critical Error:', err);
        next(err);
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
        // Max log entries
        if (user.activityLog.length > 50) user.activityLog = user.activityLog.slice(-50);
        await user.save();

        respondWithToken(res, user);
    } catch (err) {
        console.error('[loginUser] FATAL ERROR:', err.stack || err);
        res.status(500).json({ success: false, message: `Server error during login: ${err.message}` });
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
        const { fullName, age, gender, height, weight, universityId, phone, phoneNumber, username, dob, bloodGroup, bio } = req.body;

        const allowedUpdates = {};
        if (fullName !== undefined) allowedUpdates.fullName = fullName;
        if (age !== undefined) allowedUpdates.age = Number(age);
        if (gender !== undefined) allowedUpdates.gender = gender;
        if (height !== undefined) allowedUpdates.height = Number(height);
        if (weight !== undefined) allowedUpdates.weight = Number(weight);
        if (universityId !== undefined) allowedUpdates.universityId = universityId;
        if (username !== undefined) allowedUpdates.username = username;
        if (dob !== undefined) allowedUpdates.dob = dob;
        if (bloodGroup !== undefined) allowedUpdates.bloodGroup = bloodGroup;
        if (bio !== undefined) allowedUpdates.bio = bio;
        
        const parsedPhone = phone !== undefined ? phone : phoneNumber;
        if (parsedPhone !== undefined) allowedUpdates.phoneNumber = parsedPhone;

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
        const hasLetter = /[a-zA-Z]/.test(newPassword);
        const hasNumber = /\d/.test(newPassword);
        const hasSymbol = /[^a-zA-Z0-9]/.test(newPassword);
        
        if (newPassword.length < 6 || !hasLetter || !hasNumber || !hasSymbol) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters and contain letters, numbers, and symbols.' });
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

// ── 12. Forgot Password ────────────────────────────────────────────────────────
/**
 * POST /api/users/forgot-password
 * Body: { email }
 */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Please provide an email.' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ success: false, message: 'There is no user with that email.' });
        }

        // Generate token
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // Hash token and set to resetPasswordToken field
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        
        // Set expire to 10 minutes
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
        await user.save({ validateBeforeSave: false });

        // Build reset URL
        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a POST request to: \n\n ${resetUrl}`;

        // Send email
        const emailSent = await sendEmail(user.email, 'Password Reset Token', message);
        if (!emailSent) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ success: false, message: 'Email could not be sent.' });
        }

        res.status(200).json({ success: true, message: 'Email sent' });
    } catch (err) {
        console.error('[forgotPassword]', err);
        res.status(500).json({ success: false, message: 'Server error during forgot password.' });
    }
};

// ── 13. Reset Password ─────────────────────────────────────────────────────────
/**
 * POST /api/users/reset-password/:token
 * Body: { password, confirmPassword }
 */
const resetPassword = async (req, res) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
        }

        const { password, confirmPassword } = req.body;
        if (!password || !confirmPassword) {
            return res.status(400).json({ success: false, message: 'Please provide both passwords.' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match.' });
        }

        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSymbol = /[^a-zA-Z0-9]/.test(password);
        
        if (password.length < 6 || !hasLetter || !hasNumber || !hasSymbol) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters and contain letters, numbers, and symbols.' });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        respondWithToken(res, user);
    } catch (err) {
        console.error('[resetPassword]', err);
        res.status(500).json({ success: false, message: 'Server error resetting password.' });
    }
};

module.exports = {
    registerUser,
    sendAdminPin,
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
    forgotPassword,
    resetPassword,
    googleLogin: async (req, res) => {
        try {
            const { credential, role, adminPin } = req.body;
            if (!credential) {
                return res.status(400).json({ success: false, message: 'Google credential is required.' });
            }

            // Verify Google ID Token
            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            const { email, name, picture, sub: googleId } = payload;

            // Find or create user
            let user = await User.findOne({ email: email.toLowerCase() });

            if (!user) {
                // Determine role
                let targetRole = 'student';
                if (role === 'admin') {
                    if (!adminPin) {
                        return res.status(400).json({ success: false, message: 'Admin registration via Google requires a verification PIN.' });
                    }
                    // Verify Admin PIN
                    const otpRecord = await Otp.findOne({ email: email.toLowerCase() });
                    if (!otpRecord) {
                        return res.status(400).json({ success: false, message: 'PIN expired or not requested for this email.' });
                    }
                    const isMatch = await otpRecord.compareOtp(adminPin);
                    if (!isMatch) {
                        return res.status(400).json({ success: false, message: 'Invalid Admin PIN.' });
                    }
                    targetRole = 'admin';
                    await Otp.deleteOne({ email: email.toLowerCase() });
                }

                // Create new user
                user = await User.create({
                    fullName: name,
                    email: email.toLowerCase(),
                    profileImage: picture,
                    googleId,
                    role: targetRole,
                    isActive: true,
                    activityLog: [{ action: 'registered', details: `Account created via Google Sign-In as ${targetRole}` }]
                });
            } else {
                // User exists - just log in
                // If they explicitly requested Admin role but are currently a student, we don't auto-upgrade them.
                // If they are already an admin, fine.
                
                if (!user.googleId) {
                    user.googleId = googleId;
                }
                
                if (!user.isActive) {
                    return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact admin.' });
                }
                
                user.activityLog.push({ action: 'login', details: 'Logged in via Google Sign-In' });
                if (user.activityLog.length > 50) user.activityLog = user.activityLog.slice(-50);
                await user.save();
            }

            respondWithToken(res, user);
        } catch (err) {
            console.error('[googleLogin] FATAL ERROR:', err);
            res.status(500).json({ success: false, message: `Google Login failed: ${err.message}` });
        }
    }
};
