const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { notifyDepartmentLeads, getUserIdForEmployee, notifyUser } = require('../utils/notifications');

// Employee submits a complaint
router.post('/', verifyToken, async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ message: 'Complaint message is required.' });
  try {
    const result = await pool.query(
      'INSERT INTO complaints (employee_number, message, status) VALUES ($1, $2, $3) RETURNING *',
      [req.user.employeeNumber, message, 'open']
    );
    const complaint = result.rows[0];

    await notifyDepartmentLeads({
      departmentCode: req.user.departmentCode,
      type: 'complaint_new',
      message: `A new complaint was submitted by ${req.user.employeeNumber}.`,
      link: '/complaints',
      relatedId: complaint.id,
    });

    res.status(201).json(complaint);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Employee sees their OWN complaints
router.get('/my', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM complaints WHERE employee_number = $1 ORDER BY created_at DESC',
      [req.user.employeeNumber]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Manager/admin/deputy sees complaints for their department
router.get('/', verifyToken, requireRole('admin', 'manager', 'deputy_manager'), async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await pool.query(`
        SELECT c.*, e.first_name, e.last_name, e.department_code
        FROM complaints c
        LEFT JOIN employees e ON c.employee_number = e.employee_number
        ORDER BY c.created_at DESC
      `);
    } else {
      result = await pool.query(`
        SELECT c.*, e.first_name, e.last_name, e.department_code
        FROM complaints c
        LEFT JOIN employees e ON c.employee_number = e.employee_number
        WHERE e.department_code = $1
        ORDER BY c.created_at DESC
      `, [req.user.departmentCode]);
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Manager resolves a complaint with a comment
router.put('/:id/resolve', verifyToken, requireRole('admin', 'manager', 'deputy_manager'), async (req, res) => {
  const { id } = req.params;
  const { resolutionComment } = req.body;
  try {
    const result = await pool.query(
      `UPDATE complaints 
       SET status = 'resolved', resolved_by = $1, resolved_at = NOW(), resolution_comment = $2
       WHERE id = $3 RETURNING *`,
      [req.user.id, resolutionComment || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Complaint not found.' });
    const complaint = result.rows[0];

    const employeeUserId = await getUserIdForEmployee(complaint.employee_number);
    if (employeeUserId) {
      await notifyUser({
        userId: employeeUserId,
        type: 'complaint_resolved',
        message: 'Your complaint has been resolved.',
        link: '/my-performance',
        relatedId: complaint.id,
      });
    }

    res.json({ message: 'Complaint resolved.', complaint });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;