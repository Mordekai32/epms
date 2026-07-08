import { useEffect, useState } from "react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const emptyForm = { departmentCode: "", departmentName: "" };

export default function DepartmentsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [editName, setEditName] = useState("");

  const load = async () => {
    try {
      const { data } = await api.get("/departments");
      setRows(data);
    } catch {
      setError("Failed to load departments.");
    }
  };

  useEffect(() => { load(); }, []);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");
    if (!form.departmentCode.trim() || !form.departmentName.trim()) {
      setError("Both fields are required."); return;
    }
    setLoading(true);
    try {
      await api.post("/departments", form);
      setMessage("Department added successfully.");
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save.");
    } finally { setLoading(false); }
  };

  const handleDelete = async (code) => {
    if (!window.confirm(`Delete department ${code}?`)) return;
    try {
      await api.delete(`/departments/${code}`);
      setMessage("Department deleted successfully.");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete.");
    }
  };

  const handleEditOpen = (dept) => {
    setEditingDept(dept);
    setEditName(dept.department_name);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/departments/${editingDept.department_code}`, { departmentName: editName });
      setMessage("Department updated successfully.");
      setShowEditModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">Departments</h2>
        <p className="text-muted text-sm">Add department records before registering employees</p>
      </div>

      {/* Add Form — admin only */}
      {user?.role === 'admin' && (
        <form onSubmit={submit} className="bg-card rounded-xl border border-line p-6 grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-ink">Department Code</span>
            <input className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={form.departmentCode} onChange={(e) => setField("departmentCode", e.target.value.toUpperCase())} placeholder="e.g. IT01" />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ink">Department Name</span>
            <input className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={form.departmentName} onChange={(e) => setField("departmentName", e.target.value)} placeholder="e.g. Information Technology" />
          </label>
          <div className="md:col-span-2 flex gap-3 items-center">
            <button type="submit" disabled={loading} className="rounded-lg bg-accent text-accent-text px-5 py-2 font-semibold">
              {loading ? "Saving..." : "Add Department"}
            </button>
            {message && <span className="text-sm text-green-600">{message}</span>}
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </form>
      )}

      {message && !user?.role === 'admin' && <p className="text-sm text-green-600">{message}</p>}
      {error && !user?.role === 'admin' && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-card rounded-xl border border-line overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Name</th>
              {user?.role === 'admin' && <th className="px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.department_code} className="border-t border-line">
                <td className="px-4 py-3">{row.department_code}</td>
                <td className="px-4 py-3">{row.department_name}</td>
                {user?.role === 'admin' && (
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEditOpen(row)} className="flex items-center gap-1 bg-orange-400 hover:bg-orange-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
                         Edit
                      </button>
                      <button onClick={() => handleDelete(row.department_code)} className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
                         Delete
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-ink">Edit Department — {editingDept.department_code}</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <label className="block text-sm">
                <span className="font-medium">Department Name</span>
                <input className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </label>
              <div className="flex gap-3">
                <button type="submit" className="rounded-lg bg-accent text-accent-text px-5 py-2 font-semibold">Save Changes</button>
                <button type="button" onClick={() => setShowEditModal(false)} className="rounded-lg border border-line px-5 py-2 font-semibold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}