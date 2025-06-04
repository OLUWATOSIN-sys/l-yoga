const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true // Ensures consistent case
  },
  password: { 
    type: String, 
    required: true,
    select: false // Never return password in queries
  },
  joinedGroups: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Group' 
  }]
}, { timestamps: true });

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);