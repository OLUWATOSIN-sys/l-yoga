const User = require('../models/User');
const Group = require('../models/Group');

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getUserGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.userId });
    res.json(groups);
  } catch (error) {
    console.error('Error getting user groups:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const users = await User.find({
      email: { $regex: q, $options: 'i' }
    }).select('email');
    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getCurrentUser, getUserGroups, searchUsers };