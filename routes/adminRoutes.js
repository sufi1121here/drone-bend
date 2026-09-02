const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

const router = express.Router();

// Auto-seed function to ensure a default admin exists in the DB so you don't get locked out
const seedDefaultAdmin = async () => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin', salt);
      await Admin.create({ username: 'admin', password: hashedPassword });
      console.log('Default admin seeded to Database with bcrypt hash.');
    }
  } catch (error) {
    console.error('Failed to seed default admin:', error);
  }
};
// We call this here so it runs whenever this route file is loaded by index.js
seedDefaultAdmin();


// Admin login route (DB + bcrypt)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Find the admin user in the MongoDB database
    const user = await Admin.findOne({ username });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // 2. Safely compare the passwords using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // 3. Generate a secure JWT token
    const token = jwt.sign(
      { id: user._id, role: 'admin' },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token: token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

module.exports = router;
