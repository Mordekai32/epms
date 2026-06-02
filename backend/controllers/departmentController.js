import Department from "../models/Department.js";

export const create = async (req, res) => {
  try {
    if (req.body.departmentCode === undefined || req.body.departmentCode === "") return res.status(400).json({ message: "Department Code is required." });
    if (req.body.departmentName === undefined || req.body.departmentName === "") return res.status(400).json({ message: "Department Name is required." });
    await Department.create({ department_code: req.body.departmentCode, department_name: req.body.departmentName });
    return res.status(201).json({ message: "Department added successfully." });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Department already exists." });
    }
    return res.status(500).json({ message: "Failed to add department." });
  }
};

export const getAll = async (_req, res) => {
  try {
    const rows = await Department.find().sort({ department_code: -1 }).lean();
    return res.json(rows.map((r) => { const { _id, __v, ...rest } = r; return rest; }));
  } catch {
    return res.status(500).json({ message: "Failed to fetch department records." });
  }
};