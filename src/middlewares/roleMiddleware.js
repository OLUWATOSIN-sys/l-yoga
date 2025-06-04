const Group = require('../models/Group');

module.exports = (roles) => {
  return async (req, res, next) => {
    try {
      const group = await Group.findById(req.params.id);
      
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      // Checks if user has any of the required roles
      const hasRole = roles.some(role => {
        if (role === 'owner') return group.owner.equals(req.user.userId);
        if (role === 'admin') return group.admins?.includes(req.user.userId);
        return false;
      });

      if (!hasRole) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  };
};