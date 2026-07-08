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
  const [search, setSearch] = useState("");
const [cycles, setCycles] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({ employeeNumber: "", reviewPeriod: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");
    try {
      await api.post("/reviews/request", requestForm);
      setMessage("Self assessment request sent to employee.");
      setShowRequestModal(false);
      setRequestForm({ employeeNumber: "", reviewPeriod: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send request.");
    }
  };

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

useEffect(() => {
  const fetchData = async () => {
    await load();
    await loadEmployees();

    const cycleRes = await api.get("/cycles/active");
    setCycles(cycleRes.data);
  };

  fetchData();
}, []);

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

  const filteredRows = rows.filter(row =>
    !search ||
    `${row.first_name} ${row.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    row.review_period?.toLowerCase().includes(search.toLowerCase())
  );
const indexOfLastRow = currentPage * rowsPerPage;
const indexOfFirstRow = indexOfLastRow - rowsPerPage;

const currentRows = filteredRows.slice(indexOfFirstRow, indexOfLastRow);

const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-ink">Performance Reviews</h2>
          <p className="text-muted text-sm">Final Score = KPI Score × 70% + Goal Score × 30%</p>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          className="rounded-lg bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-sm font-semibold"
        >
          📋 Request Self Assessment
        </button>
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
  <span className="font-medium text-ink">Review Period</span>
  {cycles.length > 0 ? (
    <select
      className="mt-1 w-full rounded-lg border border-line px-3 py-2"
      value={form.reviewPeriod}
      onChange={(e) => setField("reviewPeriod", e.target.value)}
    >
      <option value="">Select cycle</option>
      {cycles.map((c) => (
        <option key={c.id} value={c.name}>
          {c.name} ({String(c.start_date ?? "").slice(0, 10)} → {String(c.end_date ?? "").slice(0, 10)})
        </option>
      ))}
    </select>
  ) : (
    <input
      className="mt-1 w-full rounded-lg border border-line px-3 py-2"
      value={form.reviewPeriod}
      onChange={(e) => setField("reviewPeriod", e.target.value)}
      placeholder="e.g. Q1 2026/27"
    />
  )}
</label>
<label className="block text-sm">
  <span className="font-medium text-ink">KPI Score (0-100)</span>
  <input
    type="number" min="0" max="100"
    className="mt-1 w-full rounded-lg border border-line px-3 py-2"
    value={form.kpiScore}
    onChange={(e) => setField("kpiScore", e.target.value)}
    placeholder="e.g. 85"
  />
</label>
<label className="block text-sm">
  <span className="font-medium text-ink">Goal Score (0-100)</span>
  <input
    type="number" min="0" max="100"
    className="mt-1 w-full rounded-lg border border-line px-3 py-2"
    value={form.goalScore}
    onChange={(e) => setField("goalScore", e.target.value)}
    placeholder="e.g. 75"
  />
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

      <div className="flex gap-3 items-center mb-4">
        <input
          className="rounded-lg border border-line px-3 py-2 text-sm w-64"
          placeholder="Search by employee name or KPI..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-xs text-red-500 hover:underline">Clear</button>
        )}
      </div>

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
              <th className="px-4 py-3">Self KPI</th>
              <th className="px-4 py-3">Self Goal</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr><td colSpan="10" className="px-4 py-8 text-center text-muted">No reviews found.</td></tr>
            ) : currentRows.map((row) => {
              const rating = getRating(row.final_score);
              return (
                <tr key={row.id} className="border-t border-line">
                  <td className="px-4 py-3">{row.first_name} {row.last_name}</td>
                  <td className="px-4 py-3">{row.review_period}</td>
                  <td className="px-4 py-3">{row.kpi_score}</td>
                  <td className="px-4 py-3">{row.goal_score}</td>
                  <td className="px-4 py-3 font-bold">{row.final_score}</td>
                  <td className={`px-4 py-3 font-semibold ${rating.color}`}>{rating.label}</td>
                  <td className="px-4 py-3">{row.comments}</td>
                  <td className="px-4 py-3">{row.self_kpi_score ?? '—'}</td>
                  <td className="px-4 py-3">{row.self_goal_score ?? '—'}</td>
                  <td className={`px-4 py-3 font-semibold text-xs ${
                    row.status === 'approved' ? 'text-green-600' :
                    row.status === 'rejected' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {row.status || 'approved'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
<div className="flex justify-between items-center px-4 py-4">
  <span className="text-sm text-gray-600">
    Showing {currentRows.length} of {filteredRows.length} reviews
  </span>

  <div className="flex gap-2">
    <button
      disabled={currentPage === 1}
      onClick={() => setCurrentPage((p) => p - 1)}
      className="px-3 py-1 border rounded disabled:opacity-50"
    >
      Previous
    </button>

    <span className="px-3 py-1">
      Page {currentPage} of {totalPages}
    </span>

    <button
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage((p) => p + 1)}
      className="px-3 py-1 border rounded disabled:opacity-50"
    >
      Next
    </button>
  </div>
</div>
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-ink">Request Self Assessment</h3>
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <label className="block text-sm">
                <span className="font-medium text-ink">Employee</span>
                <select
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2"
                  value={requestForm.employeeNumber}
                  onChange={(e) => setRequestForm({ ...requestForm, employeeNumber: e.target.value })}
                  required
                >
                  <option value="">Select employee</option>
                  {employees.map((e) => (
                    <option key={e.employee_number} value={e.employee_number}>
                      {e.first_name} {e.last_name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium text-ink">Review Period</span>
                <input
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2"
                  value={requestForm.reviewPeriod}
                  onChange={(e) => setRequestForm({ ...requestForm, reviewPeriod: e.target.value })}
                  placeholder="e.g. Q1 2026/27"
                  required
                />
              </label>
              <div className="flex gap-3">
                <button type="submit" className="rounded-lg bg-accent text-accent-text px-5 py-2 font-semibold">Send Request</button>
                <button type="button" onClick={() => setShowRequestModal(false)} className="rounded-lg border border-line px-5 py-2 font-semibold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
