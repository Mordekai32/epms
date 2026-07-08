import { useEffect, useState } from "react";
import api from "../api/client.js";

const emptyForm = { employeeNumber: "", kpiName: "", target: "", weight: "" };

export default function KPIsPage() {
  const [form, setForm] = useState(emptyForm);
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [editingActual, setEditingActual] = useState(null);
  const [actualValue, setActualValue] = useState("");

  const load = async () => {
    try {
      const { data } = await api.get("/kpis");
      setRows(data);
    } catch { setError("Failed to load KPIs."); }
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
    if (!form.employeeNumber || !form.kpiName || !form.target || !form.weight) {
      setError("All fields are required."); return;
    }
    setLoading(true);
    try {
      await api.post("/kpis", form);
      setMessage("KPI added successfully.");
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save.");
    } finally { setLoading(false); }
  };

  const handleUpdateActual = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/kpis/${editingActual.id}/actual`, { actual: actualValue });
      setMessage("KPI actual value updated successfully.");
      setEditingActual(null);
      setActualValue("");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update.");
    }
  };

  const getAchievementColor = (percentage) => {
    if (percentage >= 100) return "text-green-600 bg-green-100";
    if (percentage >= 75) return "text-blue-600 bg-blue-100";
    if (percentage >= 50) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const filteredRows = rows.filter(row =>
    !search ||
    `${row.first_name} ${row.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    row.kpi_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">KPI Management</h2>
        <p className="text-muted text-sm">Define and track KPIs for employees</p>
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
          <span className="font-medium text-ink">KPI Name</span>
          <input className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={form.kpiName} onChange={(e) => setField("kpiName", e.target.value)} placeholder="e.g. Customer Satisfaction" />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Target</span>
          <input type="number" className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={form.target} onChange={(e) => setField("target", e.target.value)} placeholder="e.g. 90" />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Weight (%)</span>
          <input type="number" className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={form.weight} onChange={(e) => setField("weight", e.target.value)} placeholder="e.g. 30" />
        </label>
        <div className="md:col-span-2 flex gap-3 items-center">
          <button type="submit" disabled={loading} className="rounded-lg bg-accent text-accent-text px-5 py-2 font-semibold">
            {loading ? "Saving..." : "Add KPI"}
          </button>
          {message && <span className="text-sm text-green-600">{message}</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </form>

      {/* Search */}
      <div className="flex gap-3 items-center">
        <input
          className="rounded-lg border border-line px-3 py-2 text-sm w-64"
          placeholder="Search by employee name or KPI..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-xs text-red-500 hover:underline">Clear</button>
        )}
        <span className="text-xs text-muted">{filteredRows.length} of {rows.length} KPIs</span>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-line overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">KPI Name</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Actual</th>
              <th className="px-4 py-3">Achievement</th>
              <th className="px-4 py-3">Weight (%)</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr><td colSpan="7" className="px-4 py-8 text-center text-muted">No KPIs found.</td></tr>
            ) : filteredRows.map((row) => {
              const pct = parseFloat(row.achievement_percentage) || 0;
              return (
                <tr key={row.id} className="border-t border-line">
                  <td className="px-4 py-3">{row.first_name} {row.last_name}</td>
                  <td className="px-4 py-3">{row.kpi_name}</td>
                  <td className="px-4 py-3">{row.target}</td>
                  <td className="px-4 py-3">{row.actual ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${pct >= 100 ? 'bg-green-500' : pct >= 75 ? 'bg-blue-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getAchievementColor(pct)}`}>
                        {pct}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{row.weight}%</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setEditingActual(row); setActualValue(row.actual ?? 0); }}
                      className="flex items-center gap-1 bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                       Update Actual
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Update Actual Modal */}
      {editingActual && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-ink">Update Actual — {editingActual.kpi_name}</h3>
            <div className="bg-surface rounded-lg p-3 text-sm">
              <p className="text-muted">Employee: <span className="text-ink font-medium">{editingActual.first_name} {editingActual.last_name}</span></p>
              <p className="text-muted mt-1">Target: <span className="text-ink font-medium">{editingActual.target}</span></p>
            </div>
            <form onSubmit={handleUpdateActual} className="space-y-4">
              <label className="block text-sm">
                <span className="font-medium text-ink">Actual Achieved Value</span>
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2"
                  value={actualValue}
                  onChange={(e) => setActualValue(e.target.value)}
                  placeholder="e.g. 85"
                  required
                />
              </label>
              {actualValue && editingActual.target && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-purple-800">
                    Achievement: <span className="text-lg font-bold">
                      {((parseFloat(actualValue) / parseFloat(editingActual.target)) * 100).toFixed(1)}%
                    </span>
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <button type="submit" className="rounded-lg bg-accent text-accent-text px-5 py-2 font-semibold">Save</button>
                <button type="button" onClick={() => setEditingActual(null)} className="rounded-lg border border-line px-5 py-2 font-semibold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}