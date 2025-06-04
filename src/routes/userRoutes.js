const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User endpoints
 */

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user info
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User data
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authMiddleware, userController.getCurrentUser);

module.exports = router;