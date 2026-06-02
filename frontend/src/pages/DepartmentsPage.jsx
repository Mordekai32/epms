import { useEffect, useState } from "react";
import api from "../api/client.js";

const emptyForm = { departmentCode: "", departmentName: "" };

const validateDepartment = (form) => {
  const errors = {};
  if (!form.departmentCode.trim()) errors.departmentCode = "Department code is required.";
  else if (form.departmentCode.trim().length < 2) errors.departmentCode = "Code must be at least 2 characters.";
  if (!form.departmentName.trim()) errors.departmentName = "Department name is required.";
  return errors;
};

export default function DepartmentsPage() {
  const [form, setForm] = useState(emptyForm);
  const [rows, setRows] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get("/departments");
      setRows(data);
    } catch {
      setError("Failed to load departments.");
    }
  };

  useEffect(() => { load(); }, []);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const errors = validateDepartment(form);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setLoading(true);
    try {
      await api.post("/departments", form);
      setMessage("Department added successfully.");
      setForm(emptyForm);
      setFieldErrors({});
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (key) =>
    `mt-1 w-full rounded-lg border px-3 py-2 ${fieldErrors[key] ? "border-red-500" : "border-line"}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">Departments</h2>
        <p className="text-muted text-sm">Add department records before registering employees</p>
      </div>
      <form onSubmit={submit} className="bg-card rounded-xl border border-line p-6 grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-ink">Department Code</span>
          <input
            className={inputClass("departmentCode")}
            value={form.departmentCode}
            onChange={(e) => setField("departmentCode", e.target.value.toUpperCase())}
            placeholder="e.g. IT01"
          />
          {fieldErrors.departmentCode && <p className="text-red-600 text-xs mt-1">{fieldErrors.departmentCode}</p>}
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Department Name</span>
          <input
            className={inputClass("departmentName")}
            value={form.departmentName}
            onChange={(e) => setField("departmentName", e.target.value)}
            placeholder="e.g. Information Technology"
          />
          {fieldErrors.departmentName && <p className="text-red-600 text-xs mt-1">{fieldErrors.departmentName}</p>}
        </label>
        <div className="md:col-span-2 flex flex-wrap gap-3 items-center">
          <button type="submit" disabled={loading} className="rounded-lg bg-accent text-accent-text px-5 py-2 font-semibold">
            {loading ? "Saving..." : "Add Department"}
          </button>
          {message && <span className="text-sm text-green-600">{message}</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </form>
      <div className="bg-card rounded-xl border border-line overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Name</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.department_code} className="border-t border-line">
                <td className="px-4 py-3">{row.department_code}</td>
                <td className="px-4 py-3">{row.department_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
