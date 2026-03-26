'use strict';

/**
 * controllers/wellnessController.js
 *
 * Handles all CRUD operations for the WellnessTip resource.
 *
 * Admin-only  : createTip, updateTip, deleteTip, getAllTipsAdmin
 * Student+All : getApprovedTips, getTipById
 */

const WellnessTip = require('../models/WellnessTip');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build a MongoDB filter object from query parameters.
 * @param {object} query          - req.query
 * @param {boolean} adminView     - whether to include non-approved tips
 */
const buildFilter = (query, adminView = false) => {
    const filter = {};

    // Students always see only approved tips
    if (!adminView) filter.status = 'approved';

    // Category filter
    if (query.category) {
        const validCats = ['diet', 'workout', 'mental'];
        if (validCats.includes(query.category.toLowerCase())) {
            filter.category = query.category.toLowerCase();
        }
    }

    // Status filter (admin only — already skipped for students above)
    if (adminView && query.status) {
        const validStatuses = ['approved', 'pending'];
        if (validStatuses.includes(query.status.toLowerCase())) {
            filter.status = query.status.toLowerCase();
        }
    }

    // Full-text keyword search
    if (query.search && query.search.trim()) {
        filter.$text = { $search: query.search.trim() };
    }

    return filter;
};

/**
 * Parse pagination params from req.query.
 * @returns {{ page: number, limit: number, skip: number }}
 */
const parsePagination = (query) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    return { page, limit, skip: (page - 1) * limit };
};

// ── Controller functions ──────────────────────────────────────────────────────

/**
 * POST /api/wellness
 * Admin only — create a new wellness tip.
 */
const createTip = async (req, res, next) => {
    try {
        const { title, description, category, tags, status, time, duration } = req.body;

        const tip = await WellnessTip.create({
            title,
            description,
            category,
            tags: Array.isArray(tags) ? tags : [],
            time: time || '',
            duration: duration || '',
            status: status === 'approved' ? 'approved' : 'pending',
            createdBy: req.user.id,
        });

        return res.status(201).json({
            success: true,
            message: 'Wellness tip created successfully.',
            data: tip,
        });
    } catch (err) {
        // Mongoose validation errors → 400
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((e) => e.message);
            return res.status(400).json({ success: false, message: messages.join(' ') });
        }
        next(err);
    }
};

/**
 * GET /api/wellness
 * Students — list approved tips with pagination, category filter, and keyword search.
 *
 * Query params:
 *   category  — diet | workout | mental
 *   search    — keyword for full-text search
 *   page      — page number (default: 1)
 *   limit     — results per page (default: 10, max: 100)
 */
const getApprovedTips = async (req, res, next) => {
    try {
        const { page, limit, skip } = parsePagination(req.query);
        const filter = buildFilter(req.query, false);

        // Determine sort: text-score when searching, otherwise newest first
        const sort = filter.$text
            ? { score: { $meta: 'textScore' }, createdAt: -1 }
            : { createdAt: -1 };

        const projection = filter.$text ? { score: { $meta: 'textScore' } } : {};

        const [tips, total] = await Promise.all([
            WellnessTip.find(filter, projection)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('createdBy', 'fullName email'),
            WellnessTip.countDocuments(filter),
        ]);

        return res.json({
            success: true,
            data: tips,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1,
            },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/wellness/admin
 * Admin only — list ALL tips (any status) with pagination, category/status filter, keyword search.
 */
const getAllTipsAdmin = async (req, res, next) => {
    try {
        const { page, limit, skip } = parsePagination(req.query);
        const filter = buildFilter(req.query, true);

        const sort = filter.$text
            ? { score: { $meta: 'textScore' }, createdAt: -1 }
            : { createdAt: -1 };

        const projection = filter.$text ? { score: { $meta: 'textScore' } } : {};

        const [tips, total] = await Promise.all([
            WellnessTip.find(filter, projection)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('createdBy', 'fullName email'),
            WellnessTip.countDocuments(filter),
        ]);

        return res.json({
            success: true,
            data: tips,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1,
            },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/wellness/:id
 * Students — get a single approved tip by ID.
 */
const getTipById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const tip = await WellnessTip.findById(id).populate('createdBy', 'fullName email');

        if (!tip) {
            return res.status(404).json({ success: false, message: 'Wellness tip not found.' });
        }

        // Students may only view approved tips
        const isAdmin = req.user && req.user.role === 'admin';
        if (!isAdmin && tip.status !== 'approved') {
            return res.status(404).json({ success: false, message: 'Wellness tip not found.' });
        }

        return res.json({ success: true, data: tip });
    } catch (err) {
        // Invalid ObjectId format
        if (err.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid tip ID format.' });
        }
        next(err);
    }
};

/**
 * PUT /api/wellness/:id
 * Admin only — update an existing wellness tip.
 */
const updateTip = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, category, tags, status, time, duration } = req.body;

        // Build only the fields that were actually sent
        const updates = {};
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (category !== undefined) updates.category = category;
        if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags : [];
        if (time !== undefined) updates.time = time;
        if (duration !== undefined) updates.duration = duration;
        if (status !== undefined) {
            const validStatuses = ['approved', 'pending'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Status must be either approved or pending.',
                });
            }
            updates.status = status;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: 'No update fields provided.' });
        }

        const tip = await WellnessTip.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        ).populate('createdBy', 'fullName email');

        if (!tip) {
            return res.status(404).json({ success: false, message: 'Wellness tip not found.' });
        }

        return res.json({
            success: true,
            message: 'Wellness tip updated successfully.',
            data: tip,
        });
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid tip ID format.' });
        }
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((e) => e.message);
            return res.status(400).json({ success: false, message: messages.join(' ') });
        }
        next(err);
    }
};

/**
 * DELETE /api/wellness/:id
 * Admin only — remove a wellness tip.
 */
const deleteTip = async (req, res, next) => {
    try {
        const { id } = req.params;

        const tip = await WellnessTip.findByIdAndDelete(id);

        if (!tip) {
            return res.status(404).json({ success: false, message: 'Wellness tip not found.' });
        }

        return res.json({
            success: true,
            message: 'Wellness tip deleted successfully.',
            data: { id: tip._id },
        });
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid tip ID format.' });
        }
        next(err);
    }
};

module.exports = {
    createTip,
    getApprovedTips,
    getAllTipsAdmin,
    getTipById,
    updateTip,
    deleteTip,
};
