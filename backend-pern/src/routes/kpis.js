const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { requireRole } = require('../middleware/auth');
const { getUserIdForEmployee, notifyUser } = require('../utils/notifications');

router.get('/', async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await pool.query(`
        SELECT k.*, e.first_name, e.last_name, e.department_code 
        FROM kpis k
        LEFT JOIN employees e ON k.employee_number = e.employee_number
        ORDER BY k.created_at DESC
      `);
    } else if (['manager', 'deputy_manager'].includes(req.user.role)) {
      result = await pool.query(`
        SELECT k.*, e.first_name, e.last_name, e.department_code 
        FROM kpis k
        LEFT JOIN employees e ON k.employee_number = e.employee_number
        WHERE e.department_code = $1
        ORDER BY k.created_at DESC
      `, [req.user.departmentCode]);
    } else {
      result = await pool.query(`
        SELECT k.*, e.first_name, e.last_name 
        FROM kpis k
        LEFT JOIN employees e ON k.employee_number = e.employee_number
        WHERE k.employee_number = $1
        ORDER BY k.created_at DESC
      `, [req.user.employeeNumber]);
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});
// Update actual value for a KPI
router.put('/:id/actual', requireRole('admin', 'manager', 'deputy_manager'), async (req, res) => {
  const { id } = req.params;
  const { actual } = req.body;
  try {
    const result = await pool.query(
      'UPDATE kpis SET actual = $1 WHERE id = $2 RETURNING *',
      [actual, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'KPI not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});
router.post('/', requireRole('admin', 'manager', 'deputy_manager'), async (req, res) => {
  const { employeeNumber, kpiName, target, weight } = req.body;
  try {
    if (['manager', 'deputy_manager'].includes(req.user.role)) {
      const empCheck = await pool.query(
        'SELECT department_code FROM employees WHERE employee_number = $1',
        [employeeNumber]
      );
      if (!empCheck.rows.length || empCheck.rows[0].department_code !== req.user.departmentCode) {
        return res.status(403).json({ message: 'You can only add KPIs for employees in your department.' });
      }
    }
    const result = await pool.query(
      'INSERT INTO kpis (employee_number, kpi_name, target, weight) VALUES ($1, $2, $3, $4) RETURNING *',
      [employeeNumber, kpiName, target, weight]
    );
    const kpi = result.rows[0];

    const employeeUserId = await getUserIdForEmployee(employeeNumber);
    if (employeeUserId) {
      await notifyUser({
        userId: employeeUserId,
        type: 'kpi_assigned',
        message: `A new KPI "${kpiName}" has been assigned to you.`,
        link: '/my-performance',
        relatedId: kpi.id,
      });
    }

    res.status(201).json(kpi);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;