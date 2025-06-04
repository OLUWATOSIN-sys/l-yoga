const mongoose = require('mongoose');
const crypto = require('crypto');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['public', 'private'],
    default: 'public'
  },
  description: String,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  encryptionKey: {
    type: String,
    required: true,
    default: function() {
      // Generate a random 256-bit key (32 bytes) and encode as base64
      return crypto.randomBytes(32).toString('base64');
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Automatically add owner as member
groupSchema.pre('save', function(next) {
  if (!this.members.includes(this.owner)) {
    this.members.push(this.owner);
  }
  if (!this.admins.includes(this.owner)) {
    this.admins.push(this.owner);
  }
  next();
});

module.exports = mongoose.model('Group', groupSchema);