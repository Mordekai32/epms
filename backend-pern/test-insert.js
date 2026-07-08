require('dotenv').config();
const pool = require('./src/config/db');

pool.query(
  "INSERT INTO activity_logs (actor_user_id, action, details) VALUES (1, 'test_action', 'manual test insert')"
)
  .then(() => {
    console.log('SUCCESS');
    process.exit();
  })
  .catch((err) => {
    console.error('FAILED:', err.message);
    process.exit(1);
  });
  