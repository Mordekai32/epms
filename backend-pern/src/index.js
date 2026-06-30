const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
require('./config/db');

const app = express();

// Middleware FIRST
app.use(cors());
app.use(express.json());

// Routes AFTER
const authRoutes = require('./routes/auth');
const departmentRoutes = require('./routes/departments');
const employeeRoutes = require('./routes/employees');
app.use('/employees', employeeRoutes);

app.use('/auth', authRoutes);
app.use('/departments', departmentRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'EIC PMS Backend is running! 🚀' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});