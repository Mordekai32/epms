import { useEffect, useState } from "react";
import { createDepartment, getDepartments, seedDepartments } from "../api/departmentApi";

function DepartmentPage() {
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    departmentCode: "",
    departmentName: "",
    grossSalary: "",
    totalDeduction: "",
  });
  const [message, setMessage] = useState("");

  const loadDepartments = async () => {
    const response = await getDepartments();
    setDepartments(response.data);
  };

  useEffect(() => {
    loadDepartments().catch(() => setMessage("Failed to load departments"));
  }, []);

  const onChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    const code = form.departmentCode.trim().toUpperCase();
    const name = form.departmentName.trim();
    const gross = Number(form.grossSalary);
    const deduction = Number(form.totalDeduction);
    if (!/^[A-Z0-9]{2,10}$/.test(code)) {
      setMessage("Department code must be 2-10 uppercase letters or numbers");
      return;
    }
    if (name.length < 2) {
      setMessage("Department name must be at least 2 characters");
      return;
    }
    if (Number.isNaN(gross) || gross < 0 || Number.isNaN(deduction) || deduction < 0) {
      setMessage("Gross salary and deduction must be positive numbers");
      return;
    }
    if (deduction > gross) {
      setMessage("Total deduction cannot exceed gross salary");
      return;
    }
    try {
      await createDepartment({
        departmentCode: code,
        departmentName: name,
        grossSalary: gross,
        totalDeduction: deduction,
      });
      setMessage("Department saved");
      setForm({ departmentCode: "", departmentName: "", grossSalary: "", totalDeduction: "" });
      await loadDepartments();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to save department");
    }
  };

  const onSeed = async () => {
    setMessage("");
    try {
      await seedDepartments();
      setMessage("Starter departments loaded");
      await loadDepartments();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to seed departments");
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-lg bg-white p-4 shadow">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-blue-900">Department Form</h2>
          <button
            type="button"
            onClick={onSeed}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700"
          >
            Seed Defaults
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            name="departmentCode"
            className="w-full rounded-md border px-3 py-2"
            placeholder="Department Code"
            value={form.departmentCode}
            onChange={onChange}
            pattern="[A-Za-z0-9]{2,10}"
            title="Use 2-10 letters or numbers"
            required
          />
          <input
            name="departmentName"
            className="w-full rounded-md border px-3 py-2"
            placeholder="Department Name"
            value={form.departmentName}
            onChange={onChange}
            minLength={2}
            required
          />
          <input
            type="number"
            name="grossSalary"
            className="w-full rounded-md border px-3 py-2"
            placeholder="Gross Salary"
            value={form.grossSalary}
            onChange={onChange}
            min={0}
            required
          />
          <input
            type="number"
            name="totalDeduction"
            className="w-full rounded-md border px-3 py-2"
            placeholder="Total Deduction"
            value={form.totalDeduction}
            onChange={onChange}
            min={0}
            required
          />
          <button className="w-full rounded-md bg-blue-700 px-3 py-2 font-medium text-white hover:bg-blue-800">
            Save Department
          </button>
        </form>
        {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
      </section>

      <section className="rounded-lg bg-white p-4 shadow">
        <h2 className="mb-3 text-lg font-semibold text-blue-900">Saved Departments</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-2 text-left">Code</th>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-right">Gross</th>
                <th className="p-2 text-right">Deduction</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((item) => (
                <tr key={item._id} className="border-b">
                  <td className="p-2">{item.departmentCode}</td>
                  <td className="p-2">{item.departmentName}</td>
                  <td className="p-2 text-right">{item.grossSalary}</td>
                  <td className="p-2 text-right">{item.totalDeduction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default DepartmentPage;
