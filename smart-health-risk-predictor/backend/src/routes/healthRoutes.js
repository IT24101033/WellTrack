'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');

const {
    createEntry,
    getEntries,
    getEntry,
    updateEntry,
    deleteEntry,
    getAIInput,
} = require('../controllers/healthController');

// All routes require JWT authentication
router.use(authenticate);

// ⚠️ Named routes MUST come before /:id wildcard
router.get('/ai-input', getAIInput);   // GET /api/health/ai-input

router.post('/', createEntry);          // POST   /api/health
router.get('/', getEntries);            // GET    /api/health
router.get('/:id', getEntry);           // GET    /api/health/:id
router.put('/:id', updateEntry);        // PUT    /api/health/:id
router.delete('/:id', deleteEntry);     // DELETE /api/health/:id

module.exports = router;
