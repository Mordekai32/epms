const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { createNotification } = require('./notifications');
const { requireRole ,verifyToken} = require('../middleware/auth');
const { notifyDepartmentLeads, getUserIdForEmployee, notifyUser } = require('../utils/notifications');

router.get('/', async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await pool.query(`
        SELECT r.*, e.first_name, e.last_name, e.department_code
        FROM performance_reviews r
        LEFT JOIN employees e ON r.employee_number = e.employee_number
        ORDER BY r.created_at DESC
      `);
    } else if (['manager', 'deputy_manager'].includes(req.user.role)) {
      result = await pool.query(`
        SELECT r.*, e.first_name, e.last_name, e.department_code
        FROM performance_reviews r
        LEFT JOIN employees e ON r.employee_number = e.employee_number
        WHERE e.department_code = $1
        ORDER BY r.created_at DESC
      `, [req.user.departmentCode]);
    } else {
      result = await pool.query(`
        SELECT r.*, e.first_name, e.last_name
        FROM performance_reviews r
        LEFT JOIN employees e ON r.employee_number = e.employee_number
        WHERE r.employee_number = $1
        ORDER BY r.created_at DESC
      `, [req.user.employeeNumber]);
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

router.post('/', requireRole('admin', 'manager', 'deputy_manager'), async (req, res) => {
  const { employeeNumber, kpiScore, goalScore, finalScore, reviewPeriod, comments } = req.body;
  try {
    if (['manager', 'deputy_manager'].includes(req.user.role)) {
      const empCheck = await pool.query(
        'SELECT department_code FROM employees WHERE employee_number = $1',
        [employeeNumber]
      );
      if (!empCheck.rows.length || empCheck.rows[0].department_code !== req.user.departmentCode) {
        return res.status(403).json({ message: 'You can only review employees in your department.' });
      }
    }

    // Deputy submits as pending, manager submits as approved directly
    const status = req.user.role === 'deputy_manager' ? 'pending' : 'approved';

    const result = await pool.query(
      `INSERT INTO performance_reviews 
      (employee_number, kpi_score, goal_score, final_score, review_period, comments, status, submitted_by) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [employeeNumber, kpiScore, goalScore, finalScore, reviewPeriod, comments, status, req.user.id]
    );
    const review = result.rows[0];

    const empRow = await pool.query('SELECT department_code FROM employees WHERE employee_number = $1', [employeeNumber]);
    const departmentCode = empRow.rows[0]?.department_code || null;

    if (status === 'pending') {
      // Deputy submitted — notify managers/admin who need to approve it
      await notifyDepartmentLeads({
        departmentCode,
        type: 'review_pending',
        message: `A performance review for ${employeeNumber} (${reviewPeriod}) is awaiting your approval.`,
        link: '/approvals',
        relatedId: review.id,
      });
    } else {
      // Manager submitted directly as approved — let the employee know
      const employeeUserId = await getUserIdForEmployee(employeeNumber);
      if (employeeUserId) {
        await notifyUser({
          userId: employeeUserId,
          type: 'review_approved',
          message: `Your performance review for ${reviewPeriod} has been completed.`,
          link: '/my-performance',
          relatedId: review.id,
        });
      }
    }

    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Manager approves a pending review — admin only or manager of same department
router.put('/:id/approve', requireRole('admin', 'manager'), async (req, res) => {
  const { id } = req.params;
  try {
    if (req.user.role === 'manager') {
      const check = await pool.query(`
        SELECT e.department_code FROM performance_reviews r
        LEFT JOIN employees e ON r.employee_number = e.employee_number
        WHERE r.id = $1
      `, [id]);
      if (!check.rows.length || check.rows[0].department_code !== req.user.departmentCode) {
        return res.status(403).json({ message: 'You can only approve reviews in your department.' });
      }
    }
    const result = await pool.query(
      `UPDATE performance_reviews 
       SET status = 'approved', approved_by = $1, approved_at = NOW() 
       WHERE id = $2 RETURNING *`,
      [req.user.id, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Review not found.' });
    const review = result.rows[0];

    const employeeUserId = await getUserIdForEmployee(review.employee_number);
    if (employeeUserId) {
      await notifyUser({
        userId: employeeUserId,
        type: 'review_approved',
        message: `Your performance review for ${review.review_period} has been approved.`,
        link: '/my-performance',
        relatedId: review.id,
      });
    }

    res.json({ message: 'Review approved successfully.', review });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Manager rejects a pending review
router.put('/:id/reject', requireRole('admin', 'manager'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE performance_reviews SET status = 'rejected' WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Review not found.' });
    const review = result.rows[0];

    // Notify whoever submitted it (usually the deputy manager) that it needs revision
    if (review.submitted_by) {
      await notifyUser({
        userId: review.submitted_by,
        type: 'review_rejected',
        message: `The review you submitted for ${review.employee_number} (${review.review_period}) was rejected and needs revision.`,
        link: '/reviews',
        relatedId: review.id,
      });
    }

    res.json({ message: 'Review rejected.', review });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});
// Employee submits self assessment
router.put('/:id/self-assess', verifyToken, async (req, res) => {
  const { selfKpiScore, selfGoalScore, selfComments } = req.body;
  const { id } = req.params;
  try {
    // Verify this review belongs to this employee
    const check = await pool.query(
      'SELECT * FROM performance_reviews WHERE id = $1 AND employee_number = $2',
      [id, req.user.employeeNumber]
    );
    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'You can only self-assess your own reviews.' });
    }
    const result = await pool.query(
      `UPDATE performance_reviews 
       SET self_kpi_score = $1, self_goal_score = $2, self_comments = $3, 
           self_submitted_at = NOW(), status = 'self_assessed'
       WHERE id = $4 RETURNING *`,
      [selfKpiScore, selfGoalScore, selfComments, id]
    );
    res.json({ message: 'Self assessment submitted successfully.', review: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Manager creates a review request for self assessment
router.post('/request', requireRole('admin', 'manager', 'deputy_manager'), async (req, res) => {
  const { employeeNumber, reviewPeriod } = req.body;
  try {
    if (['manager', 'deputy_manager'].includes(req.user.role)) {
      const empCheck = await pool.query(
        'SELECT department_code FROM employees WHERE employee_number = $1',
        [employeeNumber]
      );
      if (!empCheck.rows.length || empCheck.rows[0].department_code !== req.user.departmentCode) {
        return res.status(403).json({ message: 'You can only request reviews for employees in your department.' });
      }
    }
    const result = await pool.query(
      `INSERT INTO performance_reviews 
       (employee_number, kpi_score, goal_score, final_score, review_period, status, submitted_by)
       VALUES ($1, 0, 0, 0, $2, 'self_assessment', $3) RETURNING *`,
      [employeeNumber, reviewPeriod, req.user.id]
    );
    // Notify employee
    const empUser = await pool.query(
      'SELECT id FROM users WHERE employee_number = $1',
      [employeeNumber]
    );
    if (empUser.rows.length > 0) {
  await notifyUser({
    userId: empUser.rows[0].id,
    type: 'self_assessment_request',
    message: `You have a new self-assessment request for ${reviewPeriod}. Please submit your scores.`,
    link: '/my-performance',
    relatedId: result.rows[0].id,
  });
}
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});
module.exports = router;
