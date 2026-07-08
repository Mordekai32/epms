const pool = require('../config/db');

/**
 * Create a notification for a single user.
 * Safe to call inline — failures are logged but never break the calling request.
 */
async function notifyUser({ userId, type, message, link = null, relatedId = null }) {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, type, message, link, related_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, type, related_id) DO NOTHING`,
      [userId, type, message, link, relatedId]
    );
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
}

/**
 * Create the same notification for every admin, plus every manager/deputy_manager
 * in the given department (pass null departmentCode to only notify admins).
 */
async function notifyDepartmentLeads({ departmentCode, type, message, link = null, relatedId = null }) {
  try {
    const result = await pool.query(
      `SELECT id FROM users
       WHERE role = 'admin'
          OR (role IN ('manager', 'deputy_manager') AND department_code = $1)`,
      [departmentCode]
    );
    await Promise.all(
      result.rows.map((u) =>
        notifyUser({ userId: u.id, type, message, link, relatedId })
      )
    );
  } catch (err) {
    console.error('Failed to notify department leads:', err.message);
  }
}

/**
 * Look up the user_id linked to an employee_number (employees don't always have a login).
 */
async function getUserIdForEmployee(employeeNumber) {
  try {
    const result = await pool.query('SELECT id FROM users WHERE employee_number = $1', [employeeNumber]);
    return result.rows[0]?.id || null;
  } catch (err) {
    console.error('Failed to look up user for employee:', err.message);
    return null;
  }
}

module.exports = { notifyUser, notifyDepartmentLeads, getUserIdForEmployee };
