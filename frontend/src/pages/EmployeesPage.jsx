import { useEffect, useState } from "react";
import api from "../api/client.js";

const GENDERS = ["Male", "Female"];

const emptyForm = {
  employeeNumber: "",
  firstName: "",
  lastName: "",
  address: "",
  position: "",
  telephone: "",
  gender: "",
  hiredDate: "",
  departmentCode: "",
};

const validateEmployee = (form, departments) => {
  const errors = {};
  if (!form.employeeNumber.trim()) errors.employeeNumber = "Employee number is required.";
  if (!form.firstName.trim()) errors.firstName = "First name is required.";
  if (!form.lastName.trim()) errors.lastName = "Last name is required.";
  if (!form.address.trim()) errors.address = "Address is required.";
  if (!form.position.trim()) errors.position = "Position is required.";
  if (!form.telephone.trim()) errors.telephone = "Telephone is required.";
  else if (!/^[0-9+\-\s]{7,15}$/.test(form.telephone.trim())) {
    errors.telephone = "Enter a valid phone number (7–15 digits).";
  }
  if (!form.gender) errors.gender = "Select gender.";
  else if (!GENDERS.includes(form.gender)) errors.gender = "Select Male or Female.";
  if (!form.hiredDate) errors.hiredDate = "Hired date is required.";
  if (!form.departmentCode) errors.departmentCode = "Select a department from the list.";
  else if (!departments.some((d) => d.department_code === form.departmentCode)) {
    errors.departmentCode = "Selected department is not valid.";
  }
  return errors;
};

export default function EmployeesPage() {
  const [form, setForm] = useState(emptyForm);
  const [departments, setDepartments] = useState([]);
  const [rows, setRows] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadEmployees = async () => {
    try {
      const { data } = await api.get("/employees");
      setRows(data);
    } catch {
      setError("Failed to load employees.");
    }
  };

  const loadDepartments = async () => {
    try {
      const { data } = await api.get("/departments");
      setDepartments(data);
    } catch {
      setError("Failed to load departments.");
    }
  };

  useEffect(() => {
    loadEmployees();
    loadDepartments();
  }, []);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const errors = validateEmployee(form, departments);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setLoading(true);
    try {
      await api.post("/employees", form);
      setMessage("Employee added successfully.");
      setForm(emptyForm);
      setFieldErrors({});
      loadEmployees();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  const deptLabel = (code) => {
    const d = departments.find((x) => x.department_code === code);
    return d ? `${d.department_name} (${code})` : code;
  };

  const inputClass = (key) =>
    `mt-1 w-full rounded-lg border px-3 py-2 ${fieldErrors[key] ? "border-red-500" : "border-line"}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">Employees</h2>
        <p className="text-muted text-sm">Add employee records — select department and gender from the list</p>
      </div>
      {departments.length === 0 && (
        <p className="text-amber-700 text-sm bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          Add at least one department before registering employees.
        </p>
      )}
      <form onSubmit={submit} className="bg-card rounded-xl border border-line p-6 grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-ink">Employee Number</span>
          <input className={inputClass("employeeNumber")} value={form.employeeNumber} onChange={(e) => setField("employeeNumber", e.target.value)} />
          {fieldErrors.employeeNumber && <p className="text-red-600 text-xs mt-1">{fieldErrors.employeeNumber}</p>}
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">First Name</span>
          <input className={inputClass("firstName")} value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} />
          {fieldErrors.firstName && <p className="text-red-600 text-xs mt-1">{fieldErrors.firstName}</p>}
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Last Name</span>
          <input className={inputClass("lastName")} value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} />
          {fieldErrors.lastName && <p className="text-red-600 text-xs mt-1">{fieldErrors.lastName}</p>}
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Telephone</span>
          <input className={inputClass("telephone")} value={form.telephone} onChange={(e) => setField("telephone", e.target.value)} placeholder="e.g. 0788123456" />
          {fieldErrors.telephone && <p className="text-red-600 text-xs mt-1">{fieldErrors.telephone}</p>}
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium text-ink">Address</span>
          <input className={inputClass("address")} value={form.address} onChange={(e) => setField("address", e.target.value)} />
          {fieldErrors.address && <p className="text-red-600 text-xs mt-1">{fieldErrors.address}</p>}
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Position</span>
          <input className={inputClass("position")} value={form.position} onChange={(e) => setField("position", e.target.value)} />
          {fieldErrors.position && <p className="text-red-600 text-xs mt-1">{fieldErrors.position}</p>}
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Gender</span>
          <select className={inputClass("gender")} value={form.gender} onChange={(e) => setField("gender", e.target.value)}>
            <option value="">Select gender</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          {fieldErrors.gender && <p className="text-red-600 text-xs mt-1">{fieldErrors.gender}</p>}
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Hired Date</span>
          <input type="date" className={inputClass("hiredDate")} value={form.hiredDate} onChange={(e) => setField("hiredDate", e.target.value)} />
          {fieldErrors.hiredDate && <p className="text-red-600 text-xs mt-1">{fieldErrors.hiredDate}</p>}
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Department</span>
          <select
            className={inputClass("departmentCode")}
            value={form.departmentCode}
            onChange={(e) => setField("departmentCode", e.target.value)}
            disabled={departments.length === 0}
          >
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d.department_code} value={d.department_code}>
                {d.department_code} — {d.department_name}
              </option>
            ))}
          </select>
          {fieldErrors.departmentCode && <p className="text-red-600 text-xs mt-1">{fieldErrors.departmentCode}</p>}
        </label>
        <div className="md:col-span-2 flex flex-wrap gap-3 items-center">
          <button type="submit" disabled={loading || departments.length === 0} className="rounded-lg bg-accent text-accent-text px-5 py-2 font-semibold disabled:opacity-50">
            {loading ? "Saving..." : "Add Employee"}
          </button>
          {message && <span className="text-sm text-green-600">{message}</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </form>
      <div className="bg-card rounded-xl border border-line overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left">
            <tr>
              <th className="px-4 py-3">Number</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Position</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Hired</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.employee_number} className="border-t border-line">
                <td className="px-4 py-3">{row.employee_number}</td>
                <td className="px-4 py-3">{row.first_name} {row.last_name}</td>
                <td className="px-4 py-3">{row.position}</td>
                <td className="px-4 py-3">{row.gender}</td>
                <td className="px-4 py-3">{deptLabel(row.department_code)}</td>
                <td className="px-4 py-3">{String(row.hired_date ?? "").slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
