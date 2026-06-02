import mongoose from "mongoose";


const schema = new mongoose.Schema({
  employee_number: { type: String, required: true, unique: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  address: { type: String, required: true },
  position: { type: String, required: true },
  telephone: { type: String, required: true },
  gender: { type: String, required: true },
  hired_date: { type: Date, required: true },
  department_code: { type: String, required: true }
}, { collection: "employees" });



export default mongoose.model("Employee", schema);
