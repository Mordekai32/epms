import { useEffect, useState } from "react";
import api from "../api/client.js";

const calcNet = (gross, deduction) => {
  const g = Number(gross);
  const d = Number(deduction);
  if (gross === "" || deduction === "" || Number.isNaN(g) || Number.isNaN(d)) return "";
  if (d > g) return "invalid";
  return String(Math.round((g - d) * 100) / 100);
};

const validateSalary = (form, employees) => {
  const errors = {};
  if (!form.employeeNumber) errors.employeeNumber = "Select an employee from the list.";
  else if (!employees.some((e) => e.employee_number === form.employeeNumber)) {
    errors.employeeNumber = "Selected employee is not valid.";
  }
  if (form.grossSalary === "" || Number.isNaN(Number(form.grossSalary))) {
    errors.grossSalary = "Gross salary is required.";
  } else if (Number(form.grossSalary) < 0) errors.grossSalary = "Gross salary cannot be negative.";
  if (form.totalDeduction === "" || Number.isNaN(Number(form.totalDeduction))) {
    errors.totalDeduction = "Total deduction is required.";
  } else if (Number(form.totalDeduction) < 0) errors.totalDeduction = "Deduction cannot be negative.";
  if (!errors.grossSalary && !errors.totalDeduction) {
    const net = calcNet(form.grossSalary, form.totalDeduction);
    if (net === "invalid") errors.totalDeduction = "Deduction cannot exceed gross salary.";
  }
  if (!form.monthOfPayment) errors.monthOfPayment = "Select month of payment.";
  return errors;
};

export default function SalariesPage() {
  const [form, setForm] = useState({
    grossSalary: "",
    totalDeduction: "",
    netSalary: "",
    monthOfPayment: "",
    employeeNumber: "",
  });
  const [employees, setEmployees] = useState([]);
  const [rows, setRows] = useState([]);
  const [editId, setEditId] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadSalaries = async () => {
    try {
      const { data } = await api.get("/salaries");
      setRows(data);
    } catch {
      setError("Failed to load salary records.");
    }
  };

  const loadEmployees = async () => {
    try {
      const { data } = await api.get("/employees");
      setEmployees(data);
    } catch {
      setError("Failed to load employees.");
    }
  };

  useEffect(() => {
    loadSalaries();
    loadEmployees();
  }, []);

  const updateAmounts = (key, value) => {
    const next = { ...form, [key]: value };
    const net = calcNet(
      key === "grossSalary" ? value : next.grossSalary,
      key === "totalDeduction" ? value : next.totalDeduction
    );
    next.netSalary = net === "invalid" ? "" : net;
    setForm(next);
    setFieldErrors((prev) => ({ ...prev, [key]: "", netSalary: "" }));
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const errors = validateSalary(form, employees);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    const net = calcNet(form.grossSalary, form.totalDeduction);
    const payload = { ...form, netSalary: net };
    try {
      if (editId) {
        await api.put(`/salaries/${editId}`, payload);
        setMessage("Salary updated.");
      } else {
        await api.post("/salaries", payload);
        setMessage("Salary added.");
      }
      setForm({ grossSalary: "", totalDeduction: "", netSalary: "", monthOfPayment: "", employeeNumber: "" });
      setFieldErrors({});
      setEditId(null);
      loadSalaries();
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed.");
    }
  };

  const startEdit = (row) => {
    setEditId(row.salary_id);
    setFieldErrors({});
    setForm({
      grossSalary: String(row.gross_salary ?? ""),
      totalDeduction: String(row.total_deduction ?? ""),
      netSalary: String(row.net_salary ?? ""),
      monthOfPayment: row.month_of_payment ?? "",
      employeeNumber: row.employee_number ?? "",
    });
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    try {
      await api.delete(`/salaries/${id}`);
      loadSalaries();
    } catch {
      setError("Delete failed.");
    }
  };

  const employeeLabel = (number) => {
    const emp = employees.find((e) => e.employee_number === number);
    if (!emp) return number;
    return `${emp.first_name} ${emp.last_name} (${number})`;
  };

  const inputClass = (key) =>
    `mt-1 w-full rounded-lg border px-3 py-2 ${fieldErrors[key] ? "border-red-500" : "border-line"}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">Salary Records</h2>
        <p className="text-muted text-sm">Select employee, enter amounts — net salary is calculated automatically</p>
      </div>
      {employees.length === 0 && (
        <p className="text-amber-700 text-sm bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          Add employees before recording salary payments.
        </p>
      )}
      <form onSubmit={submit} className="bg-card rounded-xl border border-line p-6 grid gap-4 md:grid-cols-2">
        <label className="block text-sm md:col-span-2">
          <span className="font-medium text-ink">Employee</span>
          <select
            className={inputClass("employeeNumber")}
            value={form.employeeNumber}
            onChange={(e) => setField("employeeNumber", e.target.value)}
            disabled={employees.length === 0}
          >
            <option value="">Select employee</option>
            {employees.map((emp) => (
              <option key={emp.employee_number} value={emp.employee_number}>
                {emp.employee_number} — {emp.first_name} {emp.last_name} ({emp.position})
              </option>
            ))}
          </select>
          {fieldErrors.employeeNumber && <p className="text-red-600 text-xs mt-1">{fieldErrors.employeeNumber}</p>}
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Gross Salary</span>
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputClass("grossSalary")}
            value={form.grossSalary}
            onChange={(e) => updateAmounts("grossSalary", e.target.value)}
          />
          {fieldErrors.grossSalary && <p className="text-red-600 text-xs mt-1">{fieldErrors.grossSalary}</p>}
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Total Deduction</span>
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputClass("totalDeduction")}
            value={form.totalDeduction}
            onChange={(e) => updateAmounts("totalDeduction", e.target.value)}
          />
          {fieldErrors.totalDeduction && <p className="text-red-600 text-xs mt-1">{fieldErrors.totalDeduction}</p>}
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Net Salary</span>
          <input
            type="text"
            readOnly
            className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-muted"
            value={form.netSalary}
            placeholder="Auto-calculated"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Month of Payment</span>
          <input
            type="month"
            className={inputClass("monthOfPayment")}
            value={form.monthOfPayment}
            onChange={(e) => setField("monthOfPayment", e.target.value)}
          />
          {fieldErrors.monthOfPayment && <p className="text-red-600 text-xs mt-1">{fieldErrors.monthOfPayment}</p>}
        </label>
        <div className="md:col-span-2 flex flex-wrap gap-3 items-center">
          <button
            type="submit"
            disabled={employees.length === 0}
            className="rounded-lg bg-accent text-accent-text px-5 py-2 font-semibold disabled:opacity-50"
          >
            {editId ? "Update" : "Add"}
          </button>
          {editId && (
            <button
              type="button"
              onClick={() => {
                setEditId(null);
                setFieldErrors({});
                setForm({ grossSalary: "", totalDeduction: "", netSalary: "", monthOfPayment: "", employeeNumber: "" });
              }}
              className="rounded-lg border border-line px-5 py-2"
            >
              Cancel
            </button>
          )}
          {message && <span className="text-sm text-green-600">{message}</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </form>
      <div className="bg-card rounded-xl border border-line overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface">
            <tr>
              <th className="px-4 py-3 text-left">Employee</th>
              <th className="px-4 py-3 text-left">Gross</th>
              <th className="px-4 py-3 text-left">Deduction</th>
              <th className="px-4 py-3 text-left">Net</th>
              <th className="px-4 py-3 text-left">Month</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.salary_id} className="border-t border-line">
                <td className="px-4 py-3">{employeeLabel(row.employee_number)}</td>
                <td className="px-4 py-3">{row.gross_salary}</td>
                <td className="px-4 py-3">{row.total_deduction}</td>
                <td className="px-4 py-3">{row.net_salary}</td>
                <td className="px-4 py-3">{row.month_of_payment}</td>
                <td className="px-4 py-3 space-x-2">
                  <button type="button" onClick={() => startEdit(row)} className="text-accent font-medium">Edit</button>
                  <button type="button" onClick={() => remove(row.salary_id)} className="text-red-600 font-medium">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
