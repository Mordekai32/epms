const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all departments
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM departments ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Create department
router.post('/', async (req, res) => {
  const { departmentCode, departmentName } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO departments (department_code, department_name) VALUES ($1, $2) RETURNING *',
      [departmentCode, departmentName]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Department code or name already exists.' });
    }
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;