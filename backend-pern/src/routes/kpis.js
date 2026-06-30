const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireRole } = require('../middleware/auth');

// Get all KPIs
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM kpis ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Create a new KPI
router.post('/', requireRole('admin', 'manager'), async (req, res) => {
  const { employeeNumber, kpiName, target, weight } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO kpis
      (employee_number, kpi_name, target, weight)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [employeeNumber, kpiName, target, weight]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;