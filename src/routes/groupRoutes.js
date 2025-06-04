const express = require('express');
const { check } = require('express-validator');
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Groups
 *   description: Group management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Group:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the group
 *           example: 507f1f77bcf86cd799439011
 *         name:
 *           type: string
 *           description: The name of the group
 *           example: Yoga Group
 *         type:
 *           type: string
 *           enum: [public, private]
 *           description: The privacy type of the group
 *           example: public
 *         description:
 *           type: string
 *           description: Description of the group
 *           example: A group for yoga
 *         maxMembers:
 *           type: integer
 *           description: Maximum number of members allowed
 *           example: 100
 *         owner:
 *           $ref: '#/components/schemas/User'
 *         members:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/User'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the group was created
 *           example: 2023-01-01T00:00:00Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the group was last updated
 *           example: 2023-01-01T00:00:00Z
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 60a7b9bfe6f12c001c8e4b9f
 *         username:
 *           type: string
 *           example: mryoga
 *         email:
 *           type: string
 *           example: john@learningyogi.com
 *     Message:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 60a7b9bfe6f12c001c8e4ba0
 *         content:
 *           type: string
 *           example: Hello everyone!
 *         sender:
 *           $ref: '#/components/schemas/User'
 *         group:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2023-01-01T00:00:00Z
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/groups:
 *   post:
 *     summary: Create a new group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 example: Yoga Group
 *               type:
 *                 type: string
 *                 enum: [public, private]
 *                 example: public
 *               description:
 *                 type: string
 *                 example: Group for yoga
 *               maxMembers:
 *                 type: integer
 *                 example: 100
 *     responses:
 *       201:
 *         description: Group created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  [
    authMiddleware,
    check('name', 'Group name is required').not().isEmpty(),
    check('type', 'Group type must be public or private').isIn(['public', 'private'])
  ],
  groupController.createGroup
);

/**
 * @swagger
 * /api/groups/discover:
 *   get:
 *     summary: Discover public groups
 *     tags: [Groups]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for group names
 *         example: yoga
 *     responses:
 *       200:
 *         description: List of discoverable groups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Group'
 *       500:
 *         description: Server error
 */
router.get('/discover', groupController.discoverGroups);

/**
 * @swagger
 * /api/groups/{id}/members:
 *   get:
 *     summary: List group members
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Member list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       403:
 *         description: Not authorized to view members
 *       404:
 *         description: Group not found
 */
router.get('/:id/members', authMiddleware, groupController.listMembers);

/**
 * @swagger
 * /api/groups/{id}/join:
 *   post:
 *     summary: Join a group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Joined group successfully
 *       403:
 *         description: Not allowed to join
 *       404:
 *         description: Group not found
 */
router.post('/:id/join', authMiddleware, groupController.joinGroup);

/**
 * @swagger
 * /api/groups/{id}:
 *   get:
 *     summary: Get group details
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Group not found
 */
router.get('/:id', authMiddleware, groupController.getGroupDetails);

/**
 * @swagger
 * /api/groups/{id}/leave:
 *   post:
 *     summary: Leave a group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully left group
 *       400:
 *         description: Cannot leave group
 *       404:
 *         description: Group not found
 */
router.post('/:id/leave', authMiddleware, groupController.leaveGroup);

/**
 * @swagger
 * /api/groups/{id}/transfer:
 *   post:
 *     summary: Transfer group ownership
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - newOwnerId
 *             properties:
 *               newOwnerId:
 *                 type: string
 *                 example: 60a7b9bfe6f12c001c8e4b9f
 *     responses:
 *       200:
 *         description: Ownership transferred successfully
 *       403:
 *         description: Not authorized to transfer ownership
 *       404:
 *         description: Group or user not found
 */
router.post('/:id/transfer', authMiddleware, checkRole(['owner']), groupController.transferOwnership);

/**
 * @swagger
 * /api/groups/{id}/settings:
 *   patch:
 *     summary: Update group settings (Owner/Admin only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Group Name
 *               type:
 *                 type: string
 *                 enum: [public, private]
 *                 example: private
 *               description:
 *                 type: string
 *                 example: Updated group description
 *               maxMembers:
 *                 type: integer
 *                 example: 150
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       400:
 *         description: Invalid settings
 *       403:
 *         description: Not authorized to update settings
 *       404:
 *         description: Group not found
 */
router.patch(
  '/:id/settings',
  [authMiddleware, checkRole(['owner', 'admin'])],
  groupController.updateSettings
);

/**
 * @swagger
 * /api/groups/{id}/request-join:
 *   post:
 *     summary: Request to join a private group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Join request submitted
 *       400:
 *         description: Already requested or member
 *       404:
 *         description: Group not found
 */
router.post('/:id/request-join', authMiddleware, groupController.requestJoinPrivateGroup);

/**
 * @swagger
 * /api/groups/{id}/join-requests/{userId}/approve:
 *   post:
 *     summary: Approve a join request (Owner only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *         example: 507f1f77bcf86cd799439011
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to approve
 *         example: 60a7b9bfe6f12c001c8e4b9f
 *     responses:
 *       200:
 *         description: Join request approved
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Group or request not found
 */
router.post('/:id/join-requests/:userId/approve', [authMiddleware, checkRole(['owner'])], groupController.approveJoinRequest);

/**
 * @swagger
 * /api/groups/{id}/join-requests/{userId}/decline:
 *   post:
 *     summary: Decline a join request (Owner only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *         example: 507f1f77bcf86cd799439011
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to decline
 *         example: 60a7b9bfe6f12c001c8e4b9f
 *     responses:
 *       200:
 *         description: Join request declined
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Group or request not found
 */
router.post('/:id/join-requests/:userId/decline', [authMiddleware, checkRole(['owner'])], groupController.declineJoinRequest);

/**
 * @swagger
 * /api/groups/{id}/banish/{userId}:
 *   post:
 *     summary: Banish a user from group (Owner only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *         example: 507f1f77bcf86cd799439011
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to banish
 *         example: 60a7b9bfe6f12c001c8e4b9f
 *     responses:
 *       200:
 *         description: User banished successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Group or user not found
 */
router.post('/:id/banish/:userId', [authMiddleware, checkRole(['owner'])], groupController.banishUser);

/**
 * @swagger
 * /api/groups/{id}/messages:
 *   post:
 *     summary: Send a message to group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *         example: 507f1f77bcf86cd799439011
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
 *                 example: Hello everyone!
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       403:
 *         description: Not a member of the group
 *       404:
 *         description: Group not found
 */
router.post('/:id/messages', authMiddleware, groupController.sendMessage);

/**
 * @swagger
 * /api/groups/{id}/messages:
 *   get:
 *     summary: Get group messages
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *         example: 507f1f77bcf86cd799439011
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of messages to return
 *         example: 20
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *         description: Get messages before this timestamp
 *         example: 2023-01-01T00:00:00Z
 *     responses:
 *       200:
 *         description: List of messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       403:
 *         description: Not a member of the group
 *       404:
 *         description: Group not found
 */
router.get('/:id/messages', authMiddleware, groupController.getMessages);

/**
 * @swagger
 * /api/groups/{id}:
 *   delete:
 *     summary: Delete a group (Owner only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Group deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Group not found
 */
router.delete('/:id', [authMiddleware, checkRole(['owner'])], groupController.deleteGroup);


/**
 * @swagger
 * /api/groups/{id}/members/{userId}/role:
 *   patch:
 *     summary: Update a member's role (Owner/Admin only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to update role
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, member]
 *                 description: New role for the user
 *                 example: admin
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       400:
 *         description: Invalid role or cannot change owner
 *       403:
 *         description: Not authorized to update roles
 *       404:
 *         description: Group or user not found
 */
router.patch(
  '/:id/members/:userId/role',
  [authMiddleware, checkRole(['owner', 'admin'])],
  groupController.updateMemberRole
);

/**
 * @swagger
 * /api/groups/{id}/members/{userId}:
 *   post:
 *     summary: Add a member to group (Owner/Admin only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to add
 *     responses:
 *       200:
 *         description: Member added successfully
 *       400:
 *         description: User already member or group full
 *       403:
 *         description: Not authorized to add members
 *       404:
 *         description: Group or user not found
 */
router.post(
  '/:id/members/:userId',
  [authMiddleware, checkRole(['owner', 'admin'])],
  groupController.addMemberToGroup
);

/**
 * @swagger
 * /api/groups/{id}/members/{userId}:
 *   delete:
 *     summary: Remove a member from group (Owner/Admin only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to remove
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       400:
 *         description: Cannot remove owner or user not member
 *       403:
 *         description: Not authorized to remove members
 *       404:
 *         description: Group or user not found
 */
router.delete(
  '/:id/members/:userId',
  [authMiddleware, checkRole(['owner', 'admin'])],
  groupController.removeMember
);

module.exports = router;
