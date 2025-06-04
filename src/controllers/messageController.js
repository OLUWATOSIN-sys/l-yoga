const Message = require('../models/Message');
const Group = require('../models/Group');
const encryptionService = require('../services/encryptionService');

const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const group = await Group.findById(req.params.groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!group.members.includes(req.user.userId)) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    const { encryptedData, iv } = encryptionService.encrypt(content, group.encryptionKey);
    
    const message = new Message({
      group: group._id,
      sender: req.user.userId,
      encryptedContent: encryptedData,
      iv
    });

    await message.save();
    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getMessages = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (!group.members.includes(req.user.userId)) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    const messages = await Message.find({ group: group._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sender', 'email');

    const decryptedMessages = messages.map(msg => ({
      _id: msg._id,
      content: encryptionService.decrypt(msg.encryptedContent, group.encryptionKey, msg.iv),
      sender: msg.sender,
      createdAt: msg.createdAt
    }));

    res.json(decryptedMessages);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { sendMessage, getMessages };