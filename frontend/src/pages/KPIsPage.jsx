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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">KPI Management</h2>
        <p className="text-muted text-sm">Define KPIs for employees</p>
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
      <div className="bg-card rounded-xl border border-line overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">KPI Name</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Weight (%)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-line">
                <td className="px-4 py-3">{row.employee_number}</td>
                <td className="px-4 py-3">{row.kpi_name}</td>
                <td className="px-4 py-3">{row.target}</td>
                <td className="px-4 py-3">{row.weight}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}