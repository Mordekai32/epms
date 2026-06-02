import mongoose from "mongoose";


const schema = new mongoose.Schema({
  department_code: { type: String, required: true, unique: true },
  department_name: { type: String, required: true }
}, { collection: "departments" });



export default mongoose.model("Department", schema);
