import Department from "../models/Department.js";
import Employee from "../models/Employee.js";
import Salary from "../models/Salary.js";

const clean = (rows) => rows.map((r) => {
  const copy = { ...r };
  delete copy._id;
  delete copy.__v;
  return copy;
});

const monthBounds = (month) => {
  const start = new Date(`${month}-01T00:00:00`);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

export const getReports = async (req, res) => {
  try {
    const period = req.query.period || "daily";
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const month = req.query.month || date.slice(0, 7);

    let employees;
    let salaries;

    if (period === "daily") {
      const start = new Date(`${date}T00:00:00`);
      const end = new Date(`${date}T23:59:59`);
      employees = clean(await Employee.find({ hired_date: { $gte: start, $lte: end } }).lean());
      salaries = clean(await Salary.find({ month_of_payment: month }).lean());
    } else if (period === "weekly") {
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required for weekly reports." });
      }
      const start = new Date(`${startDate}T00:00:00`);
      const end = new Date(`${endDate}T23:59:59`);
      employees = clean(await Employee.find({ hired_date: { $gte: start, $lte: end } }).lean());
      salaries = clean(
        await Salary.find({
          month_of_payment: { $gte: startDate.slice(0, 7), $lte: endDate.slice(0, 7) },
        }).lean()
      );
    } else {
      const { start, end } = monthBounds(month);
      employees = clean(await Employee.find({ hired_date: { $gte: start, $lte: end } }).lean());
      salaries = clean(await Salary.find({ month_of_payment: month }).lean());
    }

    const departments = clean(await Department.find().lean());
    return res.json({ period, reports: { employees, departments, salaries } });
  } catch {
    return res.status(500).json({ message: "Failed to generate reports." });
  }
};
