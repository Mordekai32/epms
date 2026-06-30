const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Get my profile (user + linked employee info if exists)
router.get('/', verifyToken, async (req, res) => {
  try {
    const userResult = await pool.query('SELECT id, username, email, role, employee_number FROM users WHERE id = $1', [req.user.id]);
    const user = userResult.rows[0];
    let employee = null;
    if (user.employee_number) {
      const empResult = await pool.query('SELECT * FROM employees WHERE employee_number = $1', [user.employee_number]);
      employee = empResult.rows[0] || null;
    }
    res.json({ user, employee });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Change my own password
router.put('/change-password', verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Both current and new password are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters.' });
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, req.user.id]);
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;