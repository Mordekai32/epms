const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireRole } = require('../middleware/auth');

// Employee performance report
router.get('/employees', requireRole('admin', 'manager', 'deputy_manager'), async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await pool.query(`
        SELECT e.employee_number, e.first_name, e.last_name, e.position, e.department_code,
               COALESCE(AVG(r.final_score), 0) as avg_score,
               COUNT(r.id) as review_count
        FROM employees e
        LEFT JOIN performance_reviews r ON e.employee_number = r.employee_number
        WHERE e.is_active = true
        GROUP BY e.employee_number, e.first_name, e.last_name, e.position, e.department_code
        ORDER BY avg_score DESC
      `);
    } else {
      result = await pool.query(`
        SELECT e.employee_number, e.first_name, e.last_name, e.position, e.department_code,
               COALESCE(AVG(r.final_score), 0) as avg_score,
               COUNT(r.id) as review_count
        FROM employees e
        LEFT JOIN performance_reviews r ON e.employee_number = r.employee_number
        WHERE e.is_active = true AND e.department_code = $1
        GROUP BY e.employee_number, e.first_name, e.last_name, e.position, e.department_code
        ORDER BY avg_score DESC
      `, [req.user.departmentCode]);
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Department performance report
router.get('/departments', requireRole('admin', 'manager', 'deputy_manager'), async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await pool.query(`
        SELECT d.department_code, d.department_name,
               COUNT(DISTINCT e.employee_number) as employee_count,
               COALESCE(AVG(r.final_score), 0) as avg_score
        FROM departments d
        LEFT JOIN employees e ON d.department_code = e.department_code AND e.is_active = true
        LEFT JOIN performance_reviews r ON e.employee_number = r.employee_number
        GROUP BY d.department_code, d.department_name
        ORDER BY avg_score DESC
      `);
    } else {
      result = await pool.query(`
        SELECT d.department_code, d.department_name,
               COUNT(DISTINCT e.employee_number) as employee_count,
               COALESCE(AVG(r.final_score), 0) as avg_score
        FROM departments d
        LEFT JOIN employees e ON d.department_code = e.department_code AND e.is_active = true
        LEFT JOIN performance_reviews r ON e.employee_number = r.employee_number
        WHERE d.department_code = $1
        GROUP BY d.department_code, d.department_name
        ORDER BY avg_score DESC
      `, [req.user.departmentCode]);
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;