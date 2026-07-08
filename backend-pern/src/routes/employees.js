const express = require('express');
const router = express.Router();
const pool = require('../config/db');

const bcrypt = require('bcryptjs');
// GET — all roles can view active employees
const { requireRole, scopeToOwnDepartment } = require('../middleware/auth');

// GET — everyone sees something appropriate to their role
router.get('/', async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await pool.query('SELECT * FROM employees WHERE is_active = true ORDER BY created_at DESC');
    } else if (['manager', 'deputy_manager'].includes(req.user.role)) {
      if (!req.user.departmentCode) return res.json([]);
      result = await pool.query(
        'SELECT * FROM employees WHERE is_active = true AND department_code = $1 ORDER BY created_at DESC',
        [req.user.departmentCode]
      );
    } else {
      result = await pool.query('SELECT * FROM employees WHERE is_active = true ORDER BY created_at DESC');
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

router.post('/', requireRole('admin', 'manager', 'deputy_manager'), async (req, res) => {
  const { employeeNumber, firstName, lastName, address, position, telephone, gender, hiredDate, departmentCode, createLogin, loginPassword } = req.body;

  // Manager/deputy can only add to their own department
  if (['manager', 'deputy_manager'].includes(req.user.role) && departmentCode !== req.user.departmentCode) {
    return res.status(403).json({ message: 'You can only add employees to your own department.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const empResult = await client.query(
      `INSERT INTO employees (employee_number, first_name, last_name, address, position, telephone, gender, hired_date, department_code) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [employeeNumber, firstName, lastName, address, position, telephone, gender, hiredDate, departmentCode]
    );
    let loginCreated = false;
    if (createLogin && loginPassword) {
      const username = employeeNumber.toLowerCase();
      const email = `${username}@eic.com`;
      const hashedPassword = await bcrypt.hash(loginPassword, 10);
      await client.query(
        'INSERT INTO users (username, email, password, role, employee_number, department_code) VALUES ($1, $2, $3, $4, $5, $6)',
        [username, email, hashedPassword, 'employee', employeeNumber, departmentCode]
      );
      loginCreated = true;
    }
    await client.query('COMMIT');
    res.status(201).json({ employee: empResult.rows[0], loginCreated });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(400).json({ message: 'Employee number or login already exists.' });
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  } finally {
    client.release();
  }
});

// PUT — admin and manager only
router.put('/:employeeNumber', requireRole('admin', 'manager'), async (req, res) => {
  const { employeeNumber } = req.params;
  const { firstName, lastName, address, position, telephone, gender, hiredDate, departmentCode } = req.body;
  try {
    const result = await pool.query(
      `UPDATE employees SET first_name=$1, last_name=$2, address=$3, position=$4, telephone=$5, gender=$6, hired_date=$7, department_code=$8 WHERE employee_number=$9 RETURNING *`,
      [firstName, lastName, address, position, telephone, gender, hiredDate, departmentCode, employeeNumber]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Employee not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE — admin only (deactivate)
router.delete('/:employeeNumber', requireRole('admin'), async (req, res) => {
  const { employeeNumber } = req.params;
  try {
    await pool.query('UPDATE employees SET is_active = false WHERE employee_number = $1', [employeeNumber]);
    res.json({ message: 'Employee deactivated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});


// Reset password for an employee's login account — admin only
router.put('/:employeeNumber/reset-password', requireRole('admin'), async (req, res) => {
  const { employeeNumber } = req.params;
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters.' });
  }
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE employee_number = $2 RETURNING username',
      [hashedPassword, employeeNumber]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No login account found for this employee.' });
    }
    res.json({ message: `Password reset successfully for ${result.rows[0].username}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});
module.exports = router;