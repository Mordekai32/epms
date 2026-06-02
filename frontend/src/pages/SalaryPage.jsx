import { useEffect, useMemo, useState } from "react";
import { getDepartments } from "../api/departmentApi";
import { getEmployees } from "../api/employeeApi";
import { createSalary, deleteSalary, getSalaries, updateSalary } from "../api/salaryApi";

function SalaryPage() {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState({
    employeeId: "",
    departmentId: "",
    grossSalary: "",
    totalDeduction: "",
    month: "",
  });

  const netSalaryPreview = useMemo(
    () => Number(form.grossSalary || 0) - Number(form.totalDeduction || 0),
    [form.grossSalary, form.totalDeduction]
  );

  const loadData = async () => {
    const [deptRes, empRes, salRes] = await Promise.all([getDepartments(), getEmployees(), getSalaries()]);
    setDepartments(deptRes.data);
    setEmployees(empRes.data);
    setSalaries(salRes.data);
  };

  useEffect(() => {
    loadData().catch(() => setMessage("Failed to load salary data"));
  }, []);

  const onChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const resetForm = () => {
    setForm({ employeeId: "", departmentId: "", grossSalary: "", totalDeduction: "", month: "" });
    setEditingId("");
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    const grossSalary = Number(form.grossSalary);
    const totalDeduction = Number(form.totalDeduction);
    const month = String(form.month || "").trim();
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      setMessage("Month must use YYYY-MM format");
      return;
    }
    if (Number.isNaN(grossSalary) || grossSalary < 0 || Number.isNaN(totalDeduction) || totalDeduction < 0) {
      setMessage("Gross salary and deduction must be positive numbers");
      return;
    }
    if (totalDeduction > grossSalary) {
      setMessage("Total deduction cannot exceed gross salary");
      return;
    }
    const payload = {
      ...form,
      month,
      grossSalary,
      totalDeduction,
    };

    try {
      if (editingId) {
        await updateSalary(editingId, {
          grossSalary: payload.grossSalary,
          totalDeduction: payload.totalDeduction,
          month: payload.month,
        });
        setMessage("Salary updated");
      } else {
        await createSalary(payload);
        setMessage("Salary saved");
      }
      resetForm();
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to save salary");
    }
  };

  const onEdit = (item) => {
    setEditingId(item._id);
    setForm({
      employeeId: item.employee?._id || "",
      departmentId: item.department?._id || "",
      grossSalary: item.grossSalary,
      totalDeduction: item.totalDeduction,
      month: item.month,
    });
  };

  const onDelete = async (id) => {
    setMessage("");
    try {
      await deleteSalary(id);
      setMessage("Salary deleted");
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to delete salary");
    }
  };

  return (
    <div className="grid gap-4">
      <section className="rounded-lg bg-white p-4 shadow">
        <h2 className="mb-3 text-lg font-semibold text-blue-900">Salary Form</h2>
        <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-3">
          <select
            name="employeeId"
            className="rounded-md border px-3 py-2"
            value={form.employeeId}
            onChange={onChange}
            required
            disabled={Boolean(editingId)}
          >
            <option value="">Select employee</option>
            {employees.map((item) => (
              <option key={item._id} value={item._id}>
                {item.firstName} {item.lastName}
              </option>
            ))}
          </select>

          <select
            name="departmentId"
            className="rounded-md border px-3 py-2"
            value={form.departmentId}
            onChange={onChange}
            required
            disabled={Boolean(editingId)}
          >
            <option value="">Select department</option>
            {departments.map((item) => (
              <option key={item._id} value={item._id}>
                {item.departmentName}
              </option>
            ))}
          </select>

          <input
            type="month"
            name="month"
            className="rounded-md border px-3 py-2"
            value={form.month}
            onChange={onChange}
            required
          />
          <input
            type="number"
            name="grossSalary"
            className="rounded-md border px-3 py-2"
            placeholder="Gross Salary"
            value={form.grossSalary}
            onChange={onChange}
            min={0}
            required
          />
          <input
            type="number"
            name="totalDeduction"
            className="rounded-md border px-3 py-2"
            placeholder="Total Deduction"
            value={form.totalDeduction}
            onChange={onChange}
            min={0}
            required
          />
          <input
            className="rounded-md border bg-slate-100 px-3 py-2"
            value={`Net Salary: ${netSalaryPreview}`}
            readOnly
          />

          <div className="md:col-span-3 flex gap-2">
            <button className="rounded-md bg-blue-700 px-3 py-2 font-medium text-white hover:bg-blue-800">
              {editingId ? "Update Salary" : "Save Salary"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md bg-slate-600 px-3 py-2 font-medium text-white hover:bg-slate-700"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
        {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
      </section>

      <section className="rounded-lg bg-white p-4 shadow">
        <h2 className="mb-3 text-lg font-semibold text-blue-900">Salary Records</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-2 text-left">Employee</th>
                <th className="p-2 text-left">Department</th>
                <th className="p-2 text-left">Month</th>
                <th className="p-2 text-right">Gross</th>
                <th className="p-2 text-right">Deduction</th>
                <th className="p-2 text-right">Net</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {salaries.map((item) => (
                <tr key={item._id} className="border-b">
                  <td className="p-2">
                    {item.employee?.firstName} {item.employee?.lastName}
                  </td>
                  <td className="p-2">{item.department?.departmentName}</td>
                  <td className="p-2">{item.month}</td>
                  <td className="p-2 text-right">{item.grossSalary}</td>
                  <td className="p-2 text-right">{item.totalDeduction}</td>
                  <td className="p-2 text-right">{item.netSalary}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="rounded bg-amber-500 px-2 py-1 text-white hover:bg-amber-600"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item._id)}
                        className="rounded bg-red-600 px-2 py-1 text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default SalaryPage;
