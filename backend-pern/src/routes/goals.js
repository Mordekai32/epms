const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireRole } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await pool.query(`
        SELECT g.*, e.first_name, e.last_name, e.department_code 
        FROM goals g
        LEFT JOIN employees e ON g.employee_number = e.employee_number
        ORDER BY g.created_at DESC
      `);
    } else if (['manager', 'deputy_manager'].includes(req.user.role)) {
      result = await pool.query(`
        SELECT g.*, e.first_name, e.last_name, e.department_code 
        FROM goals g
        LEFT JOIN employees e ON g.employee_number = e.employee_number
        WHERE e.department_code = $1
        ORDER BY g.created_at DESC
      `, [req.user.departmentCode]);
    } else {
      result = await pool.query(`
        SELECT g.*, e.first_name, e.last_name 
        FROM goals g
        LEFT JOIN employees e ON g.employee_number = e.employee_number
        WHERE g.employee_number = $1
        ORDER BY g.created_at DESC
      `, [req.user.employeeNumber]);
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});
// Update goal progress and status
router.put('/:id/progress', async (req, res) => {
  const { id } = req.params;
  const { progress, status } = req.body;
  try {
    const completedAt = status === 'completed' ? 'NOW()' : 'NULL';
    const result = await pool.query(
      `UPDATE goals SET progress = $1, status = $2, completed_at = ${completedAt} WHERE id = $3 RETURNING *`,
      [progress, status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Goal not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});
router.post('/', requireRole('admin', 'manager', 'deputy_manager'), async (req, res) => {
  const { employeeNumber, goalTitle, description, targetDate } = req.body;
  try {
    if (['manager', 'deputy_manager'].includes(req.user.role)) {
      const empCheck = await pool.query(
        'SELECT department_code FROM employees WHERE employee_number = $1',
        [employeeNumber]
      );
      if (!empCheck.rows.length || empCheck.rows[0].department_code !== req.user.departmentCode) {
        return res.status(403).json({ message: 'You can only add goals for employees in your department.' });
      }
    }
    const result = await pool.query(
      'INSERT INTO goals (employee_number, goal_title, description, target_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [employeeNumber, goalTitle, description, targetDate]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;