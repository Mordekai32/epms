import { useEffect, useState } from "react";
import api from "../api/client.js";

const emptyForm = { employeeNumber: "", goalTitle: "", description: "", targetDate: "" };

export default function GoalsPage() {
  const [form, setForm] = useState(emptyForm);
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">Goal Management</h2>
        <p className="text-muted text-sm">Set goals for employees</p>
      </div>
      <form onSubmit={submit} className="bg-card rounded-xl border border-line p-6 grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-ink">Employee</span>
          <select className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={form.employeeNumber} onChange={(e) => setField("employeeNumber", e.target.value)}>
            <option value="">Select employee</option>
            {employees.map((e) => (
              <option key={e.employee_number} value={e.employee_number}>
                {e.employee_number} — {e.first_name} {e.last_name}
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
      <div className="bg-card rounded-xl border border-line overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Goal Title</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Target Date</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-line">
                <td className="px-4 py-3">{row.employee_number}</td>
                <td className="px-4 py-3">{row.goal_title}</td>
                <td className="px-4 py-3">{row.description}</td>
                <td className="px-4 py-3">{String(row.target_date ?? "").slice(0, 10)}</td>
                <td className="px-4 py-3">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}