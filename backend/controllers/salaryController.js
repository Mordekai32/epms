import Salary from "../models/Salary.js";

const calcNet = (gross, deduction) => {
  const g = Number(gross);
  const d = Number(deduction);
  if (Number.isNaN(g) || Number.isNaN(d)) return null;
  return Math.round((g - d) * 100) / 100;
};

export const create = async (req, res) => {
  try {
    if (req.body.grossSalary === undefined || req.body.grossSalary === "") {
      return res.status(400).json({ message: "Gross Salary is required." });
    }
    if (req.body.totalDeduction === undefined || req.body.totalDeduction === "") {
      return res.status(400).json({ message: "Total Deduction is required." });
    }
    if (!req.body.monthOfPayment) {
      return res.status(400).json({ message: "Month of Payment is required." });
    }
    if (!req.body.employeeNumber) {
      return res.status(400).json({ message: "Employee is required." });
    }
    const netSalary = calcNet(req.body.grossSalary, req.body.totalDeduction);
    if (netSalary === null) {
      return res.status(400).json({ message: "Invalid salary amounts." });
    }
    await Salary.create({
      gross_salary: req.body.grossSalary,
      total_deduction: req.body.totalDeduction,
      net_salary: netSalary,
      month_of_payment: req.body.monthOfPayment,
      employee_number: req.body.employeeNumber,
    });
    return res.status(201).json({ message: "Salary added successfully." });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Salary already exists." });
    }
    return res.status(500).json({ message: "Failed to add salary." });
  }
};

export const getAll = async (_req, res) => {
  try {
    const rows = await Salary.find().sort({ salary_id: -1 }).lean();
    return res.json(rows.map((r) => { const { _id, __v, ...rest } = r; return rest; }));
  } catch {
    return res.status(500).json({ message: "Failed to fetch salary records." });
  }
};

export const update = async (req, res) => {
  try {
    if (req.body.grossSalary === undefined || req.body.grossSalary === "") {
      return res.status(400).json({ message: "Gross Salary is required." });
    }
    if (req.body.totalDeduction === undefined || req.body.totalDeduction === "") {
      return res.status(400).json({ message: "Total Deduction is required." });
    }
    if (!req.body.monthOfPayment) {
      return res.status(400).json({ message: "Month of Payment is required." });
    }
    if (!req.body.employeeNumber) {
      return res.status(400).json({ message: "Employee is required." });
    }
    const netSalary = calcNet(req.body.grossSalary, req.body.totalDeduction);
    if (netSalary === null) {
      return res.status(400).json({ message: "Invalid salary amounts." });
    }
    const updated = await Salary.findOneAndUpdate(
      { salary_id: Number(req.params.id) },
      {
        gross_salary: req.body.grossSalary,
        total_deduction: req.body.totalDeduction,
        net_salary: netSalary,
        month_of_payment: req.body.monthOfPayment,
        employee_number: req.body.employeeNumber,
      },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Salary not found." });
    }
    return res.json({ message: "Salary updated successfully." });
  } catch {
    return res.status(500).json({ message: "Failed to update salary." });
  }
};

export const remove = async (req, res) => {
  try {
    const deleted = await Salary.findOneAndDelete({ salary_id: Number(req.params.id) });
    if (!deleted) {
      return res.status(404).json({ message: "Salary not found." });
    }
    return res.json({ message: "Salary deleted successfully." });
  } catch {
    return res.status(500).json({ message: "Failed to delete salary." });
  }
};
