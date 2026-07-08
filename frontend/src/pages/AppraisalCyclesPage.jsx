import { useEffect, useState } from "react";
import api from "../api/client.js";

const emptyForm = { name: "", startDate: "", endDate: "" };

const STATUS_COLORS = {
  active: "bg-green-100 text-green-700",
  closed: "bg-red-100 text-red-700",
  draft: "bg-yellow-100 text-yellow-700",
};

export default function AppraisalCyclesPage() {
  const [form, setForm] = useState(emptyForm);
  const [cycles, setCycles] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get("/cycles");
      setCycles(data);
    } catch {
      setError("Failed to load cycles.");
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");
    setLoading(true);
    try {
      await api.post("/cycles", form);
      setMessage("Appraisal cycle created successfully.");
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save.");
    } finally { setLoading(false); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/cycles/${id}/status`, { status });
      setMessage(`Cycle ${status} successfully.`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this cycle?")) return;
    try {
      await api.delete(`/cycles/${id}`);
      setMessage("Cycle deleted.");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete.");
    }
  };

  const inputClass = "mt-1 w-full rounded-lg border border-line px-3 py-2";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">Appraisal Cycles</h2>
        <p className="text-muted text-sm">Define review periods for performance evaluations</p>
      </div>

      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Create Form */}
      <form onSubmit={submit} className="bg-card rounded-xl border border-line p-6 grid gap-4 md:grid-cols-3">
        <label className="block text-sm">
          <span className="font-medium text-ink">Cycle Name</span>
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Q1 2026/27"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Start Date</span>
          <input
            type="date"
            className={inputClass}
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">End Date</span>
          <input
            type="date"
            className={inputClass}
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            required
          />
        </label>
        <div className="md:col-span-3 flex gap-3 items-center">
          <button type="submit" disabled={loading} className="rounded-lg bg-accent text-accent-text px-5 py-2 font-semibold">
            {loading ? "Saving..." : "Create Cycle"}
          </button>
        </div>
      </form>

      {/* Cycles Table */}
      <div className="bg-card rounded-xl border border-line overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left">
            <tr>
              <th className="px-4 py-3">Cycle Name</th>
              <th className="px-4 py-3">Start Date</th>
              <th className="px-4 py-3">End Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cycles.length === 0 ? (
              <tr><td colSpan="5" className="px-4 py-8 text-center text-muted">No cycles yet.</td></tr>
            ) : cycles.map((c) => (
              <tr key={c.id} className="border-t border-line">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3">{String(c.start_date ?? "").slice(0, 10)}</td>
                <td className="px-4 py-3">{String(c.end_date ?? "").slice(0, 10)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[c.status] || ''}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 flex-wrap">
                    {c.status !== 'active' && (
                      <button onClick={() => handleStatusChange(c.id, 'active')} className="text-xs bg-green-500 hover:bg-green-600 text-white font-semibold px-3 py-1.5 rounded-lg">
                        ✅ Activate
                      </button>
                    )}
                    {c.status === 'active' && (
                      <button onClick={() => handleStatusChange(c.id, 'closed')} className="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold px-3 py-1.5 rounded-lg">
                        🔒 Close
                      </button>
                    )}
                    {c.status !== 'draft' && (
                      <button onClick={() => handleStatusChange(c.id, 'draft')} className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-3 py-1.5 rounded-lg">
                         Draft
                      </button>
                    )}
                    <button onClick={() => handleDelete(c.id)} className="text-xs bg-gray-400 hover:bg-gray-500 text-white font-semibold px-3 py-1.5 rounded-lg">
                       Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}