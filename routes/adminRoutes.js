const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const authMiddleware = require('../middleware/auth');

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

// Get all admins
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    res.json(admins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new admin
router.post('/users', authMiddleware, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = await Admin.create({ username, password: hashedPassword });
    
    res.status(201).json({ 
      success: true, 
      admin: { _id: newAdmin._id, username: newAdmin.username } 
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete admin
router.delete('/users/:id', authMiddleware, async (req, res) => {
  try {
    if (req.admin.id === req.params.id) {
      return res.status(403).json({ success: false, message: 'You cannot delete your own account' });
    }

    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    
    res.json({ success: true, message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
