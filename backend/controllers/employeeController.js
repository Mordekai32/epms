import Employee from "../models/Employee.js";
import Department from "../models/Department.js";

const ALLOWED_GENDERS = ["Male", "Female"];

export const create = async (req, res) => {
  try {
    if (req.body.employeeNumber === undefined || req.body.employeeNumber === "") return res.status(400).json({ message: "Employee Number is required." });
    if (req.body.firstName === undefined || req.body.firstName === "") return res.status(400).json({ message: "First Name is required." });
    if (req.body.lastName === undefined || req.body.lastName === "") return res.status(400).json({ message: "Last Name is required." });
    if (req.body.address === undefined || req.body.address === "") return res.status(400).json({ message: "Address is required." });
    if (req.body.position === undefined || req.body.position === "") return res.status(400).json({ message: "Position is required." });
    if (req.body.telephone === undefined || req.body.telephone === "") return res.status(400).json({ message: "Telephone is required." });
    if (req.body.gender === undefined || req.body.gender === "") return res.status(400).json({ message: "Gender is required." });
    if (!ALLOWED_GENDERS.includes(req.body.gender)) {
      return res.status(400).json({ message: "Select a valid gender (Male or Female)." });
    }
    if (req.body.hiredDate === undefined || req.body.hiredDate === "") return res.status(400).json({ message: "Hired Date is required." });
    if (req.body.departmentCode === undefined || req.body.departmentCode === "") return res.status(400).json({ message: "Select a department from the list." });
    const dept = await Department.findOne({ department_code: req.body.departmentCode });
    if (!dept) return res.status(400).json({ message: "Selected department does not exist." });
    await Employee.create({ employee_number: req.body.employeeNumber, first_name: req.body.firstName, last_name: req.body.lastName, address: req.body.address, position: req.body.position, telephone: req.body.telephone, gender: req.body.gender, hired_date: req.body.hiredDate, department_code: req.body.departmentCode });
    return res.status(201).json({ message: "Employee added successfully." });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Employee already exists." });
    }
    return res.status(500).json({ message: "Failed to add employee." });
  }
};

export const getAll = async (_req, res) => {
  try {
    const rows = await Employee.find().sort({ employee_number: -1 }).lean();
    return res.json(rows.map((r) => { const { _id, __v, ...rest } = r; return rest; }));
  } catch {
    return res.status(500).json({ message: "Failed to fetch employee records." });
  }
};