const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all employees
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM employees ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Create employee
router.post('/', async (req, res) => {
  const { employeeNumber, firstName, lastName, address, position, telephone, gender, hiredDate, departmentCode } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO employees 
      (employee_number, first_name, last_name, address, position, telephone, gender, hired_date, department_code) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [employeeNumber, firstName, lastName, address, position, telephone, gender, hiredDate, departmentCode]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Employee number already exists.' });
    }
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;