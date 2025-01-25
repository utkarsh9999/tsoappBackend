const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const passport = require('passport');
const crypto = require('crypto');
// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    const user = await User.create({ name, email, password });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});
// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});
// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    
    // Here you would typically send an email with the reset link
    // For this example, we'll just return the token
    res.json({ message: 'Password reset token generated', token });
  } catch (error) {
    res.status(500).json({ message: 'Error processing request', error: error.message });
  }
});
// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    console.log(token, newPassword);
    // Add validation for required fields
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    // Add debug logs
    console.log('\nSearching for user with token:', token);
    console.log('\nCurrent timestamp:', Date.now());
    
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    // Add more detailed error message
    if (!user) {
      const expiredUser = await User.findOne({ resetPasswordToken: token });
      if (expiredUser) {
        return res.status(400).json({ 
          message: 'Reset token has expired. Please request a new password reset.',
          expired: true 
        });
      }
      return res.status(400).json({ 
        message: 'Invalid reset token. Please request a new password reset.',
        invalid: true 
      });
    }
    
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ 
      message: 'Error resetting password', 
      error: error.message,
      details: 'An unexpected error occurred during password reset'
    });
  }
});
// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.redirect(`${process.env.FRONTEND_URL}?token=${token}`);
  }
);
module.exports = router; 