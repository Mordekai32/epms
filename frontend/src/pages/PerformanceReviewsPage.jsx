import { useEffect, useState } from "react";
import api from "../api/client.js";

const emptyForm = { employeeNumber: "", kpiScore: "", goalScore: "", reviewPeriod: "", comments: "" };

export default function PerformanceReviewsPage() {
  const [form, setForm] = useState(emptyForm);
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get("/reviews");
      setRows(data);
    } catch { setError("Failed to load reviews."); }
  };

  const loadEmployees = async () => {
    try {
      const { data } = await api.get("/employees");
      setEmployees(data);
    } catch {}
  };

  useEffect(() => { load(); loadEmployees(); }, []);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const finalScore = () => {
    const kpi = parseFloat(form.kpiScore) || 0;
    const goal = parseFloat(form.goalScore) || 0;
    return (kpi * 0.7 + goal * 0.3).toFixed(2);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");
    if (!form.employeeNumber || !form.kpiScore || !form.goalScore || !form.reviewPeriod) {
      setError("All fields except comments are required."); return;
    }
    setLoading(true);
    try {
      await api.post("/reviews", { ...form, finalScore: finalScore() });
      setMessage("Performance review added successfully.");
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save.");
    } finally { setLoading(false); }
  };

  const getRating = (score) => {
    if (score >= 90) return { label: "Excellent", color: "text-green-600" };
    if (score >= 75) return { label: "Good", color: "text-blue-600" };
    if (score >= 60) return { label: "Satisfactory", color: "text-yellow-600" };
    return { label: "Needs Improvement", color: "text-red-600" };
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">Performance Reviews</h2>
        <p className="text-muted text-sm">Final Score = KPI Score × 70% + Goal Score × 30%</p>
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
          <span className="font-medium text-ink">Review Period</span>
          <input className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={form.reviewPeriod} onChange={(e) => setField("reviewPeriod", e.target.value)} placeholder="e.g. Q1 2026" />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">KPI Score (0-100)</span>
          <input type="number" min="0" max="100" className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={form.kpiScore} onChange={(e) => setField("kpiScore", e.target.value)} placeholder="e.g. 85" />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Goal Score (0-100)</span>
          <input type="number" min="0" max="100" className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={form.goalScore} onChange={(e) => setField("goalScore", e.target.value)} placeholder="e.g. 75" />
        </label>
        {/* Live Score Preview */}
        {(form.kpiScore || form.goalScore) && (
          <div className="md:col-span-2 bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
            <p className="text-sm font-medium text-purple-800">
              Final Score Preview: <span className="text-xl font-bold">{finalScore()}</span>
              <span className={`ml-3 ${getRating(finalScore()).color} font-semibold`}>
                — {getRating(finalScore()).label}
              </span>
            </p>
          </div>
        )}
        <label className="block text-sm md:col-span-2">
          <span className="font-medium text-ink">Comments</span>
          <input className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={form.comments} onChange={(e) => setField("comments", e.target.value)} placeholder="Optional comments" />
        </label>
        <div className="md:col-span-2 flex gap-3 items-center">
          <button type="submit" disabled={loading} className="rounded-lg bg-accent text-accent-text px-5 py-2 font-semibold">
            {loading ? "Saving..." : "Submit Review"}
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
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">KPI Score</th>
              <th className="px-4 py-3">Goal Score</th>
              <th className="px-4 py-3">Final Score</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Comments</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rating = getRating(row.final_score);
              return (
                <tr key={row.id} className="border-t border-line">
                  <td className="px-4 py-3">{row.employee_number}</td>
                  <td className="px-4 py-3">{row.review_period}</td>
                  <td className="px-4 py-3">{row.kpi_score}</td>
                  <td className="px-4 py-3">{row.goal_score}</td>
                  <td className="px-4 py-3 font-bold">{row.final_score}</td>
                  <td className={`px-4 py-3 font-semibold ${rating.color}`}>{rating.label}</td>
                  <td className="px-4 py-3">{row.comments}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}