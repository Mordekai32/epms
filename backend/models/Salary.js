import mongoose from "mongoose";
import Counter from "./Counter.js";

const schema = new mongoose.Schema({
  salary_id: { type: Number, unique: true },
  gross_salary: { type: Number, required: true },
  total_deduction: { type: Number, required: true },
  net_salary: { type: Number, required: true },
  month_of_payment: { type: String, required: true },
  employee_number: { type: String, required: true }
}, { collection: "salaries" });

schema.pre("save", async function () {
  if (this.isNew && (this.salary_id === undefined || this.salary_id === null)) {
    this.salary_id = await Counter.getNext("salary_id");
  }
});

export default mongoose.model("Salary", schema);
