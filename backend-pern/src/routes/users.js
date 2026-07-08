const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireRole } = require('../middleware/auth');

// Get all users — admin only
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.username, u.email, u.role, u.department_code, u.employee_number,
             e.first_name, e.last_name
      FROM users u
      LEFT JOIN employees e ON u.employee_number = e.employee_number
      ORDER BY u.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});
router.put('/:id', requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { role, departmentCode, employeeNumber } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users 
       SET role = $1, department_code = $2, employee_number = $3
       WHERE id = $4 RETURNING id, username, email, role, department_code, employee_number`,
      [role, departmentCode || null, employeeNumber || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;