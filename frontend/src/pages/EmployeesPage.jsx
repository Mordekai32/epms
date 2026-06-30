import { useEffect, useState } from "react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

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
  createLogin: false,
  loginPassword: "",
};

export default function EmployeesPage() {
  const [form, setForm] = useState(emptyForm);
  const [departments, setDepartments] = useState([]);
  const [rows, setRows] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState(emptyForm);
  const { user } = useAuth();
const [showResetModal, setShowResetModal] = useState(false);
const [resetEmployee, setResetEmployee] = useState(null);
const [resetPassword, setResetPassword] = useState("");
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
    } catch {}
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
    setError(""); setMessage("");
    if (!form.employeeNumber || !form.firstName || !form.lastName || !form.position || !form.telephone || !form.gender || !form.hiredDate || !form.departmentCode) {
      setError("All fields are required."); return;
    }
    setLoading(true);
    try {
      const res = await api.post("/employees", form);
      if (res.data.loginCreated) {
        setMessage(`Employee added successfully. Login created — Username: ${form.employeeNumber.toLowerCase()}`);
      } else {
        setMessage("Employee added successfully.");
      }
      setForm(emptyForm);
      loadEmployees();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save.");
    } finally { setLoading(false); }
  };
const handleResetOpen = (emp) => {
  setResetEmployee(emp);
  setResetPassword("");
  setShowResetModal(true);
};

const handleResetSubmit = async (e) => {
  e.preventDefault();
  try {
    const res = await api.put(`/employees/${resetEmployee.employee_number}/reset-password`, { newPassword: resetPassword });
    setMessage(res.data.message);
    setShowResetModal(false);
  } catch (err) {
    setError(err.response?.data?.message || "Failed to reset password.");
  }
};
  const handleDelete = async (employeeNumber) => {
    if (!window.confirm(`Are you sure you want to Deactivate employee ${employeeNumber}?`)) return;
    try {
      await api.delete(`/employees/${employeeNumber}`);
      setMessage("Employee deactivated successfully.");
      loadEmployees();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete.");
    }
  };

  const handleEditOpen = (emp) => {
    setEditingEmployee(emp);
    setEditForm({
      firstName: emp.first_name,
      lastName: emp.last_name,
      address: emp.address,
      position: emp.position,
      telephone: emp.telephone,
      gender: emp.gender,
      hiredDate: String(emp.hired_date ?? "").slice(0, 10),
      departmentCode: emp.department_code,
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/employees/${editingEmployee.employee_number}`, editForm);
      setMessage("Employee updated successfully.");
      setShowEditModal(false);
      loadEmployees();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update.");
    }
  };

  const inputClass = "mt-1 w-full rounded-lg border border-line px-3 py-2";

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
          <input className={inputClass} value={form.employeeNumber} onChange={(e) => setField("employeeNumber", e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">First Name</span>
          <input className={inputClass} value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Last Name</span>
          <input className={inputClass} value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Telephone</span>
          <input className={inputClass} value={form.telephone} onChange={(e) => setField("telephone", e.target.value)} placeholder="e.g. 0788123456" />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium text-ink">Address</span>
          <input className={inputClass} value={form.address} onChange={(e) => setField("address", e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Position</span>
          <input className={inputClass} value={form.position} onChange={(e) => setField("position", e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Gender</span>
          <select className={inputClass} value={form.gender} onChange={(e) => setField("gender", e.target.value)}>
            <option value="">Select gender</option>
            {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Hired Date</span>
          <input type="date" className={inputClass} value={form.hiredDate} onChange={(e) => setField("hiredDate", e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Department</span>
          <select className={inputClass} value={form.departmentCode} onChange={(e) => setField("departmentCode", e.target.value)} disabled={departments.length === 0}>
            <option value="">Select department</option>
            {departments.map((d) => <option key={d.department_code} value={d.department_code}>{d.department_code} — {d.department_name}</option>)}
          </select>
        </label>

        <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={form.createLogin}
              onChange={(e) => setField("createLogin", e.target.checked)}
            />
            Create login account for this employee
          </label>
          {form.createLogin && (
            <div className="mt-3">
              <label className="block text-sm">
                <span className="font-medium text-ink">Set Password</span>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2"
                  value={form.loginPassword}
                  onChange={(e) => setField("loginPassword", e.target.value)}
                  placeholder="e.g. welcome123"
                />
              </label>
              <p className="text-xs text-muted mt-1">
                Username will be: <strong>{form.employeeNumber.toLowerCase() || "employeenumber"}</strong>
              </p>
            </div>
          )}
        </div>

        <div className="md:col-span-2 flex gap-3 items-center">
          <button type="submit" disabled={loading || departments.length === 0} className="rounded-lg bg-accent text-accent-text px-5 py-2 font-semibold disabled:opacity-50">
            {loading ? "Saving..." : "Add Employee"}
          </button>
          {message && <span className="text-sm text-green-600">{message}</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </form>

      {/* Table */}
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
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.employee_number} className="border-t border-line">
                <td className="px-4 py-3">{row.employee_number}</td>
                <td className="px-4 py-3">{row.first_name} {row.last_name}</td>
                <td className="px-4 py-3">{row.position}</td>
                <td className="px-4 py-3">{row.gender}</td>
                <td className="px-4 py-3">{row.department_code}</td>
                <td className="px-4 py-3">{String(row.hired_date ?? "").slice(0, 10)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {(user?.role === 'admin' || user?.role === 'manager') && (
                      <button onClick={() => handleEditOpen(row)} className="flex items-center gap-1 bg-orange-400 hover:bg-orange-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
                        ✏️ Edit
                      </button>
                    )}
                    {user?.role === 'admin' && (
                      <button onClick={() => handleDelete(row.employee_number)} className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
                        🚫 Deactivate
                      </button>
                    )}
                    {user?.role === 'admin' && (
  <button onClick={() => handleResetOpen(row)} className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
    🔑 Reset
  </button>
)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-ink">Edit Employee — {editingEmployee.employee_number}</h3>
            <form onSubmit={handleEditSubmit} className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium">First Name</span>
                <input className={inputClass} value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Last Name</span>
                <input className={inputClass} value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Position</span>
                <input className={inputClass} value={editForm.position} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })} />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Telephone</span>
                <input className={inputClass} value={editForm.telephone} onChange={(e) => setEditForm({ ...editForm, telephone: e.target.value })} />
              </label>
              <label className="block text-sm md:col-span-2">
                <span className="font-medium">Address</span>
                <input className={inputClass} value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Gender</span>
                <select className={inputClass} value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}>
                  {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium">Hired Date</span>
                <input type="date" className={inputClass} value={editForm.hiredDate} onChange={(e) => setEditForm({ ...editForm, hiredDate: e.target.value })} />
              </label>
              <label className="block text-sm md:col-span-2">
                <span className="font-medium">Department</span>
                <select className={inputClass} value={editForm.departmentCode} onChange={(e) => setEditForm({ ...editForm, departmentCode: e.target.value })}>
                  {departments.map((d) => <option key={d.department_code} value={d.department_code}>{d.department_code} — {d.department_name}</option>)}
                </select>
              </label>
              <div className="md:col-span-2 flex gap-3">
                <button type="submit" className="rounded-lg bg-accent text-accent-text px-5 py-2 font-semibold">Save Changes</button>
                <button type="button" onClick={() => setShowEditModal(false)} className="rounded-lg border border-line px-5 py-2 font-semibold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
        
      )}
      {showResetModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl space-y-4">
      <h3 className="text-lg font-bold text-ink">Reset Password — {resetEmployee.employee_number}</h3>
      <form onSubmit={handleResetSubmit} className="space-y-4">
        <label className="block text-sm">
          <span className="font-medium">New Password</span>
          <input
            type="text"
            className={inputClass}
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            placeholder="e.g. newpass123"
            required
          />
        </label>
        <div className="flex gap-3">
          <button type="submit" className="rounded-lg bg-accent text-accent-text px-5 py-2 font-semibold">Reset Password</button>
          <button type="button" onClick={() => setShowResetModal(false)} className="rounded-lg border border-line px-5 py-2 font-semibold">Cancel</button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
}