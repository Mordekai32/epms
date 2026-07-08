const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { notifyUser } = require('../utils/notifications');

// Checks for goals due within the next 3 days and creates a notification
// for the assigned employee's user account, if one doesn't already exist.
// Runs inline (no cron dependency needed) whenever notifications are fetched.
async function checkUpcomingGoalDeadlines(req) {
  try {
    const upcoming = await pool.query(`
      SELECT g.id, g.goal_title, g.target_date, u.id as user_id
      FROM goals g
      JOIN users u ON u.employee_number = g.employee_number
      WHERE g.target_date IS NOT NULL
        AND g.target_date::date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
    `);
    await Promise.all(
      upcoming.rows.map((g) =>
        notifyUser({
          userId: g.user_id,
          type: 'goal_deadline',
          message: `Goal "${g.goal_title}" is due on ${new Date(g.target_date).toLocaleDateString()}.`,
          link: '/goals',
          relatedId: g.id,
        })
      )
    );
  } catch (err) {
    console.error('Goal deadline check failed:', err.message);
  }
}

// GET my notifications (most recent first)
router.get('/', async (req, res) => {
  try {
    await checkUpcomingGoalDeadlines(req);
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    const unreadCount = result.rows.filter((n) => !n.is_read).length;
    res.json({ notifications: result.rows, unreadCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Mark one notification as read
router.put('/:id/read', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Notification not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Mark all as read
router.put('/read-all', async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false', [req.user.id]);
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = { router };
