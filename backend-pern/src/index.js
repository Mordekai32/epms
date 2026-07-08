const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware
const { verifyToken } = require('./middleware/auth');

// Routes
const authRoutes = require('./routes/auth');
const departmentRoutes = require('./routes/departments');
const employeeRoutes = require('./routes/employees');
const kpiRoutes = require('./routes/kpis');
const goalRoutes = require('./routes/goals');
const reviewRoutes = require('./routes/reviews');
const profileRoutes = require('./routes/profile');
const reportRoutes = require('./routes/reports');
const complaintRoutes = require('./routes/complaints');
const { router: notificationRoutes } = require('./routes/notifications');
const appraisalCycleRoutes = require('./routes/appraisalCycles');

const userRoutes = require('./routes/users');
app.use('/users', verifyToken, userRoutes);
app.use('/complaints', complaintRoutes);
app.use('/reports-data', verifyToken, reportRoutes);
app.use('/profile', profileRoutes);
// Public routes
app.use('/auth', authRoutes);

// Protected routes
app.use('/departments', verifyToken, departmentRoutes);
app.use('/employees', verifyToken, employeeRoutes);
app.use('/kpis', verifyToken, kpiRoutes);
app.use('/goals', verifyToken, goalRoutes);
app.use('/reviews', verifyToken, reviewRoutes);
app.use('/notifications', verifyToken, notificationRoutes);
app.use('/cycles', verifyToken, appraisalCycleRoutes);
// Test route
app.get('/', (req, res) => {
  res.json({ message: 'EIC PMS Backend is running! 🚀' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});