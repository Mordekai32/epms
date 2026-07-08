import { useEffect, useState } from "react";
import api from "../api/client.js";

const emptyForm = { employeeNumber: "", goalTitle: "", description: "", targetDate: "" };
const STATUSES = ["pending", "in_progress", "completed", "cancelled"];

export default function GoalsPage() {
  const [form, setForm] = useState(emptyForm);
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [editingGoal, setEditingGoal] = useState(null);
  const [progressForm, setProgressForm] = useState({ progress: 0, status: "pending" });

  const load = async () => {
    try {
      const { data } = await api.get("/goals");
      setRows(data);
    } catch { setError("Failed to load goals."); }
  };

  const loadEmployees = async () => {
    try {
      const { data } = await api.get("/employees");
      setEmployees(data);
    } catch {}
  };

  useEffect(() => { load(); loadEmployees(); }, []);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");
    if (!form.employeeNumber || !form.goalTitle || !form.targetDate) {
      setError("Employee, goal title and target date are required."); return;
    }
    setLoading(true);
    try {
      await api.post("/goals", form);
      setMessage("Goal added successfully.");
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save.");
    } finally { setLoading(false); }
  };

  const handleProgressOpen = (goal) => {
    setEditingGoal(goal);
    setProgressForm({ progress: goal.progress || 0, status: goal.status || "pending" });
  };

  const handleProgressSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/goals/${editingGoal.id}/progress`, progressForm);
      setMessage("Goal progress updated successfully.");
      setEditingGoal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update.");
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-600';
      case 'in_progress': return 'bg-blue-100 text-blue-600';
      case 'cancelled': return 'bg-red-100 text-red-600';
      default: return 'bg-yellow-100 text-yellow-600';
    }
  };

  const filteredRows = rows.filter(row =>
    !search ||
    `${row.first_name} ${row.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    row.goal_title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">Goal Management</h2>
        <p className="text-muted text-sm">Set and track goals for employees</p>
      </div>

      <form onSubmit={submit} className="bg-card rounded-xl border border-line p-6 grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-ink">Employee</span>
          <select className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={form.employeeNumber} onChange={(e) => setField("employeeNumber", e.target.value)}>
            <option value="">Select employee</option>
            {employees.map((e) => (
              <option key={e.employee_number} value={e.employee_number}>
                {e.first_name} {e.last_name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Goal Title</span>
          <input className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={form.goalTitle} onChange={(e) => setField("goalTitle", e.target.value)} placeholder="e.g. Complete training program" />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium text-ink">Description</span>
          <input className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="Optional description" />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Target Date</span>
          <input type="date" className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={form.targetDate} onChange={(e) => setField("targetDate", e.target.value)} />
        </label>
        <div className="md:col-span-2 flex gap-3 items-center">
          <button type="submit" disabled={loading} className="rounded-lg bg-accent text-accent-text px-5 py-2 font-semibold">
            {loading ? "Saving..." : "Add Goal"}
          </button>
          {message && <span className="text-sm text-green-600">{message}</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </form>

      {/* Search */}
      <div className="flex gap-3 items-center">
        <input
          className="rounded-lg border border-line px-3 py-2 text-sm w-64"
          placeholder="Search by employee or goal..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && <button onClick={() => setSearch("")} className="text-xs text-red-500 hover:underline">Clear</button>}
        <span className="text-xs text-muted">{filteredRows.length} of {rows.length} goals</span>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-line overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Goal</th>
              <th className="px-4 py-3">Target Date</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr><td colSpan="6" className="px-4 py-8 text-center text-muted">No goals found.</td></tr>
            ) : filteredRows.map((row) => (
              <tr key={row.id} className="border-t border-line">
                <td className="px-4 py-3">{row.first_name} {row.last_name}</td>
                <td className="px-4 py-3">{row.goal_title}</td>
                <td className="px-4 py-3">{String(row.target_date ?? "").slice(0, 10)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${row.progress >= 100 ? 'bg-green-500' : row.progress >= 50 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                        style={{ width: `${Math.min(row.progress || 0, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">{row.progress || 0}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(row.status)}`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleProgressOpen(row)}
                    className="flex items-center gap-1 bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                  >
                     Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Progress Modal */}
      {editingGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-ink">Update Goal — {editingGoal.goal_title}</h3>
            <div className="bg-surface rounded-lg p-3 text-sm">
              <p className="text-muted">Employee: <span className="text-ink font-medium">{editingGoal.first_name} {editingGoal.last_name}</span></p>
              <p className="text-muted mt-1">Target Date: <span className="text-ink font-medium">{String(editingGoal.target_date ?? "").slice(0, 10)}</span></p>
            </div>
            <form onSubmit={handleProgressSubmit} className="space-y-4">
              <label className="block text-sm">
                <span className="font-medium text-ink">Progress ({progressForm.progress}%)</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  className="mt-1 w-full accent-purple-600"
                  value={progressForm.progress}
                  onChange={(e) => setProgressForm({ ...progressForm, progress: parseInt(e.target.value) })}
                />
                <div className="flex justify-between text-xs text-muted mt-1">
                  <span>0%</span>
                  <span className="font-bold text-purple-600">{progressForm.progress}%</span>
                  <span>100%</span>
                </div>
              </label>
              <label className="block text-sm">
                <span className="font-medium text-ink">Status</span>
                <select
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2"
                  value={progressForm.status}
                  onChange={(e) => setProgressForm({ ...progressForm, status: e.target.value })}
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
              <div className="flex gap-3">
                <button type="submit" className="rounded-lg bg-accent text-accent-text px-5 py-2 font-semibold">Save</button>
                <button type="button" onClick={() => setEditingGoal(null)} className="rounded-lg border border-line px-5 py-2 font-semibold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}