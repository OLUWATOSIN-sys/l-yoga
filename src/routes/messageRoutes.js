const express = require('express');
const { check } = require('express-validator');
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Message endpoints
 */

/**
 * @swagger
 * /api/messages/{groupId}:
 *   post:
 *     summary: Send a message to group
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent
 *       403:
 *         description: Not a group member
 *       404:
 *         description: Group not found
 */
router.post(
  '/:groupId',
  [
    authMiddleware,
    check('content', 'Message content is required').not().isEmpty()
  ],
  messageController.sendMessage
);

module.exports = router;