const Group = require('../models/Group');
const JoinRequest = require('../models/JoinRequest');
const User = require('../models/User');
const { validationResult } = require('express-validator');

const createGroup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, type, description, maxMembers, encryptionKey } = req.body;

    const existingGroup = await Group.findOne({ name });
    if (existingGroup) {
      return res.status(400).json({ message: 'Group name already exists' });
    }

    const group = new Group({
      name,
      type,
      description,
      maxMembers,
      owner: req.user.userId,
      members: [req.user.userId],
      admins: [req.user.userId],
    });

    await group.save();

    await User.findByIdAndUpdate(req.user.userId, {
      $push: { joinedGroups: group._id },
    });

    res.status(201).json({
      message: 'Group created successfully',
      group: {
        id: group._id,
        name: group.name,
        type: group.type,
        description: group.description,
        owner: group.owner,
      },
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.owner.equals(req.user.userId)) {
      return res.status(403).json({ message: 'Only the owner can delete the group' });
    }

    await Message.deleteMany({ group: group._id });

    await JoinRequest.deleteMany({ group: group._id });

    await Group.findByIdAndDelete(group._id);

    await User.updateMany(
      { joinedGroups: group._id },
      { $pull: { joinedGroups: group._id } }
    );

    res.status(200).json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const discoverGroups = async (req, res) => {
  try {
    const { search } = req.query;
    const query = { type: 'public' };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const groups = await Group.find(query)
      .select('-members -admins -encryptionKey -__v')
      .limit(20)
      .lean();

    const groupsWithCount = groups.map(group => ({
      ...group,
      memberCount: group.members?.length || 0,
    }));

    res.json(groupsWithCount);
  } catch (error) {
    console.error('Error discovering groups:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const joinGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.members.includes(req.user.userId)) {
      return res.status(400).json({ message: 'Already a member of this group' });
    }

    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ message: 'Group is full' });
    }

    if (group.type === 'public') {
      group.members.push(req.user.userId);
      await group.save();

      await User.findByIdAndUpdate(req.user.userId, {
        $push: { joinedGroups: group._id },
      });

      return res.json({ message: 'Successfully joined the group' });
    }

    const existingRequest = await JoinRequest.findOne({
      group: group._id,
      user: req.user.userId,
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Join request already sent' });
    }

    const request = new JoinRequest({
      group: group._id,
      user: req.user.userId,
      status: 'pending',
    });

    await request.save();

    res.json({ message: 'Join request sent successfully' });
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getGroupDetails = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .select('-encryptionKey -__v')
      .populate('owner', 'email firstName lastName')
      .populate('admins', 'email firstName lastName')
      .lean();

    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (
      group.type === 'private' &&
      !group.members.includes(req.user.userId) &&
      !group.admins.includes(req.user.userId) &&
      !group.owner.equals(req.user.userId)
    ) {
      return res.status(403).json({ message: 'Not authorized to view this group' });
    }

    const isMember = group.members.includes(req.user.userId);
    const isAdmin = group.admins.includes(req.user.userId);
    const isOwner = group.owner._id.equals(req.user.userId);

    let joinRequestStatus = null;
    if (!isMember && group.type === 'private') {
      const request = await JoinRequest.findOne({
        group: group._id,
        user: req.user.userId,
      });
      joinRequestStatus = request?.status;
    }

    res.json({
      ...group,
      memberCount: group.members.length,
      userRole: isOwner ? 'owner' : isAdmin ? 'admin' : isMember ? 'member' : 'none',
      joinRequestStatus,
      permissions: {
        canPost: isMember,
        canInvite: isOwner || isAdmin || group.allowMemberInvites,
        canManage: isOwner || isAdmin,
      },
    });
  } catch (error) {
    console.error('Error getting group details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const listMembers = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'email firstName lastName')
      .populate('admins', 'email firstName lastName')
      .populate('owner', 'email firstName lastName');

    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isMember = group.members.some(member =>
      member._id.equals(req.user.userId)
    );

    if (!isMember && group.type === 'private') {
      return res.status(403).json({ message: 'Not authorized to view members' });
    }

    res.json({
      owner: group.owner,
      admins: group.admins,
      members: group.members,
      totalMembers: group.members.length,
    });
  } catch (error) {
    console.error('Error listing members:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (!group.members.includes(req.user.userId)) {
      return res.status(400).json({ message: 'Not a member of this group' });
    }

    if (group.owner.equals(req.user.userId)) {
      return res.status(400).json({
        message: 'Group owner cannot leave without transferring ownership',
      });
    }

    group.members.pull(req.user.userId);
    group.admins.pull(req.user.userId);
    await group.save();

    await User.findByIdAndUpdate(req.user.userId, {
      $pull: { joinedGroups: group._id },
    });

    res.json({ message: 'Successfully left the group' });
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const transferOwnership = async (req, res) => {
  try {
    const { newOwnerId } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (!group.owner.equals(req.user.userId)) {
      return res.status(403).json({ message: 'Only group owner can transfer ownership' });
    }

    const newOwner = await User.findById(newOwnerId);
    if (!newOwner) return res.status(404).json({ message: 'New owner not found' });

    if (!group.members.includes(newOwnerId)) {
      return res.status(400).json({ message: 'New owner must be a group member' });
    }

    group.owner = newOwnerId;

    if (!group.admins.includes(newOwnerId)) group.admins.push(newOwnerId);
    if (!group.members.includes(newOwnerId)) group.members.push(newOwnerId);

    await group.save();

    res.json({
      message: 'Ownership transferred successfully',
      newOwner: {
        id: newOwner._id,
        email: newOwner.email,
        name: `${newOwner.firstName} ${newOwner.lastName}`,
      },
    });
  } catch (error) {
    console.error('Error transferring ownership:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateMemberRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isOwner = group.owner.equals(req.user.userId);
    const isAdmin = group.admins.includes(req.user.userId);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to manage roles' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!group.members.includes(userId)) {
      return res.status(400).json({ message: 'User is not a group member' });
    }

    switch (role) {
      case 'admin':
        if (!group.admins.includes(userId)) group.admins.push(userId);
        break;
      case 'member':
        if (group.owner.equals(userId)) {
          return res.status(400).json({ message: 'Cannot change owner role' });
        }
        group.admins.pull(userId);
        break;
      default:
        return res.status(400).json({ message: 'Invalid role specified' });
    }

    await group.save();

    res.json({
      message: 'Member role updated successfully',
      user: {
        id: user._id,
        email: user.email,
        newRole: role,
      },
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const requestJoinPrivateGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.type !== 'private') {
      return res.status(400).json({ message: 'This group is not private' });
    }

    if (group.members.includes(req.user.userId)) {
      return res.status(400).json({ message: 'Already a member of this group' });
    }

    const existingRequest = await JoinRequest.findOne({
      group: group._id,
      user: req.user.userId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Join request already pending' });
    }

    const request = new JoinRequest({
      group: group._id,
      user: req.user.userId,
      status: 'pending'
    });

    await request.save();
    res.status(200).json({ message: 'Join request submitted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const approveJoinRequest = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const request = await JoinRequest.findOne({
      group: group._id,
      user: req.params.userId,
      status: 'pending'
    });

    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (!group.members.includes(req.params.userId)) {
      group.members.push(req.params.userId);
      await group.save();
    }

    request.status = 'approved';
    await request.save();

    await User.findByIdAndUpdate(req.params.userId, {
      $push: { joinedGroups: group._id }
    });

    res.status(200).json({ message: 'Join request approved' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const declineJoinRequest = async (req, res) => {
  try {
    const request = await JoinRequest.findOneAndUpdate(
      {
        group: req.params.id,
        user: req.params.userId,
        status: 'pending'
      },
      { status: 'rejected' },
      { new: true }
    );

    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.status(200).json({ message: 'Join request declined' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const banishUser = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    if (group.owner.equals(req.params.userId)) {
      return res.status(400).json({ message: 'Cannot banish group owner' });
    }

    group.members.pull(req.params.userId);
    group.admins.pull(req.params.userId);
    await group.save();

    await User.findByIdAndUpdate(req.params.userId, {
      $pull: { joinedGroups: group._id }
    });

    res.status(200).json({ message: 'User banished successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateSettings = async (req, res) => {
  return res.status(501).json({ message: 'updateSettings not implemented yet.' });
};

// SEND MESSAGE TO GROUP
const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const groupId = req.params.id;
    const userId = req.user.userId;

    // Validate input
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Check if user is a member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.members.includes(userId)) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    // Create and save the message
    const message = new Message({
      content: content.trim(),
      sender: userId,
      group: groupId,
    });

    await message.save();

    // Populate sender info for response
    const populatedMessage = await Message.populate(message, {
      path: 'sender',
      select: 'firstName lastName email',
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: populatedMessage,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET GROUP MESSAGES
const getMessages = async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user.userId;
    const { limit = 50, before } = req.query;

    // Check if user is a member of the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.members.includes(userId)) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    const query = { group: groupId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('sender', 'firstName lastName email')
      .lean();

    res.status(200).json({
      message: 'Messages retrieved successfully',
      data: messages.reverse(), 
      count: messages.length,
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// POST /groups/:groupId/members/:userId
const addMemberToGroup = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const requestingUserId = req.user.userId; // from JWT middleware

    // Find group and user
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const userToAdd = await User.findById(userId);
    if (!userToAdd) return res.status(404).json({ message: 'User not found' });

    // Check if requester is owner or admin
    const isOwner = group.owner.equals(requestingUserId);
    const isAdmin = group.admins.includes(requestingUserId);
    if (!isOwner && !isAdmin) {
      return res.status(401).json({ message: 'Unauthorized: only owner or admin can add members' });
    }

    // Check if user already member
    if (group.members.includes(userId)) {
      return res.status(400).json({ message: 'User already a member of the group' });
    }

    // Check max members limit if you want (optional)
    if (group.maxMembers && group.members.length >= group.maxMembers) {
      return res.status(400).json({ message: 'Group member limit reached' });
    }

    // Add member to group and update user joinedGroups
    group.members.push(userId);
    await group.save();

    userToAdd.joinedGroups.push(group._id);
    await userToAdd.save();

    return res.status(200).json({ message: 'Member added to group successfully' });
  } catch (error) {
    console.error('Error in addMemberToGroup:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /groups/:groupId/members/:userId
const removeMember = async (req, res) => {
  try {
    const groupId = req.params.id;
    const memberId = req.params.memberId;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isOwner = group.owner.equals(req.user.userId);
    const isAdmin = group.admins.includes(req.user.userId);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to remove members' });
    }

    if (!group.members.includes(memberId)) {
      return res.status(400).json({ message: 'User is not a member of this group' });
    }

    // Prevent removing the group owner
    if (group.owner.equals(memberId)) {
      return res.status(400).json({ message: 'Cannot remove the group owner' });
    }

    group.members.pull(memberId);
    group.admins.pull(memberId); // Also remove from admins if applicable
    await group.save();

    await User.findByIdAndUpdate(memberId, {
      $pull: { joinedGroups: group._id }
    });

    res.status(200).json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// EXPORT
module.exports = {
  createGroup,
  discoverGroups,
  joinGroup,
  getGroupDetails,
  listMembers,
  leaveGroup,
  transferOwnership,
  updateMemberRole,
  updateSettings,
  requestJoinPrivateGroup,
  approveJoinRequest,
  declineJoinRequest,
  banishUser,
  sendMessage,
  getMessages,
  deleteGroup,
  addMemberToGroup, 
  removeMember, 
};
