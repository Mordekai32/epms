const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireRole } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, e.first_name, e.last_name 
      FROM performance_reviews r
      LEFT JOIN employees e ON r.employee_number = e.employee_number
      ORDER BY r.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});
// Create a performance review
router.post('/', requireRole('admin', 'manager'), async (req, res) => {
  const {
    employeeNumber,
    kpiScore,
    goalScore,
    finalScore,
    reviewPeriod,
    comments
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO performance_reviews
      (employee_number, kpi_score, goal_score, final_score, review_period, comments)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        employeeNumber,
        kpiScore,
        goalScore,
        finalScore,
        reviewPeriod,
        comments
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;