const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const register = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const normalizedEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    
    if (!normalizedEmail || !cleanPassword) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (cleanPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }


    const existingUser = await User.findOne({ 
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
    });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(cleanPassword, salt);

    
    const user = new User({ 
      email: normalizedEmail, 
      password: hashedPassword 
    });
    
    await user.save();

    
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({ 
      success: true,
      token, 
      userId: user._id
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    
    const normalizedEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    
    if (!normalizedEmail || !cleanPassword) {
      return res.status(400).json({ message: 'Email and password are required' });
    }


    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    
    const isMatch = await bcrypt.compare(cleanPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

  
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ 
      success: true,
      token, 
      userId: user._id 
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};

module.exports = { register, login };