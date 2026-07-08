import { useEffect, useState } from "react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

function MyComplaintsSection() {
  const [complaints, setComplaints] = useState([]);
  const [complaint, setComplaint] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  const load = async () => {
    try {
      const { data } = await api.get("/complaints/my");
      setComplaints(data);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  // Auto-dismiss the success message after a few seconds
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 4000);
    return () => clearTimeout(t);
  }, [message]);

  const submitComplaint = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError(""); setMessage("");
    if (!complaint.trim()) { setError("Please write your complaint first."); return; }
    setSubmitting(true);
    try {
      await api.post("/complaints", { message: complaint });
      setMessage("Complaint submitted successfully.");
      setComplaint("");
      setPage(1);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(complaints.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const visibleComplaints = complaints.slice(startIdx, startIdx + PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Submit complaint form */}
      <div className="bg-card rounded-xl border border-line p-6">
        <h3 className="font-bold text-ink mb-4">Submit a Complaint</h3>
        <p className="text-muted text-sm mb-4">If you disagree with your review or have concerns, submit them here.</p>
        <form onSubmit={submitComplaint} className="space-y-3">
          <textarea
            className="w-full rounded-lg border border-line px-3 py-2 text-sm h-28 resize-none"
            placeholder="Write your complaint or concern here..."
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            disabled={submitting}
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-accent text-accent-text px-5 py-2 font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Complaint"}
            </button>
            {message && <span className="text-sm text-green-600">{message}</span>}
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </form>
      </div>

      {/* My complaints history */}
      {complaints.length > 0 && (
        <div className="bg-card rounded-xl border border-line p-6">
          <h3 className="font-bold text-ink mb-4">My Complaint History</h3>
          <div className="space-y-4">
            {visibleComplaints.map((c) => (
              <div key={c.id} className="border border-line rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-medium text-ink">{String(c.created_at ?? "").slice(0, 10)}</p>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    c.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                  }`}>{c.status}</span>
                </div>
                <p className="text-sm text-ink mb-2">{c.message}</p>
                {c.resolution_comment && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                    <p className="text-xs font-medium text-green-700 mb-1">Manager Response:</p>
                    <p className="text-sm text-green-800">{c.resolution_comment}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {complaints.length > PAGE_SIZE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 pt-4 border-t border-line">
              <p className="text-xs text-muted">
                Showing <span className="font-semibold text-ink">{startIdx + 1}</span>
                {"–"}
                <span className="font-semibold text-ink">{Math.min(startIdx + PAGE_SIZE, complaints.length)}</span>
                {" of "}
                <span className="font-semibold text-ink">{complaints.length}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface"
                >
                  ← Previous
                </button>
                <span className="text-xs text-muted px-2">
                  Page {safePage} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Extracted outside parent component to resolve scope and structure issues
function SelfAssessmentForm({ review, onSubmitted }) {
  const [form, setForm] = useState({ selfKpiScore: "", selfGoalScore: "", selfComments: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError(""); setMessage("");
    setSubmitting(true);
    try {
      await api.put(`/reviews/${review.id}/self-assess`, form);
      setMessage("Self assessment submitted!");
      setSubmitted(true);
      // Give the user a moment to see the confirmation before the list refreshes
      // and this form disappears (since the review's status will change).
      setTimeout(() => onSubmitted(), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit.");
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-yellow-300 p-4 mb-3">
      <p className="font-medium text-ink text-sm mb-3">Period: {review.review_period}</p>
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="font-medium">My KPI Score (0-100)</span>
          <input
            type="number" min="0" max="100"
            className="mt-1 w-full rounded-lg border border-line px-3 py-2"
            value={form.selfKpiScore}
            onChange={(e) => setForm({ ...form, selfKpiScore: e.target.value })}
            placeholder="e.g. 80"
            required
            disabled={submitted}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">My Goal Score (0-100)</span>
          <input
            type="number" min="0" max="100"
            className="mt-1 w-full rounded-lg border border-line px-3 py-2"
            value={form.selfGoalScore}
            onChange={(e) => setForm({ ...form, selfGoalScore: e.target.value })}
            placeholder="e.g. 75"
            required
            disabled={submitted}
          />
        </label>
        <label className="block text-sm col-span-2">
          <span className="font-medium">Comments</span>
          <textarea
            className="mt-1 w-full rounded-lg border border-line px-3 py-2 h-20 resize-none"
            value={form.selfComments}
            onChange={(e) => setForm({ ...form, selfComments: e.target.value })}
            placeholder="Describe your achievements..."
            disabled={submitted}
          />
        </label>
        <div className="col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting || submitted}
            className="rounded-lg bg-accent text-accent-text px-5 py-2 font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : submitted ? "Submitted" : "Submit Self Assessment"}
          </button>
          {message && <span className="text-sm text-green-600">{message}</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </form>
    </div>
  );
}

export default function MyPerformancePage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Extracted load out of useEffect so it can be passed as a prop
  const loadPerformanceData = async () => {
    if (!user?.employeeNumber) return;
    try {
      const [reviewRes, kpiRes, goalRes] = await Promise.all([
        api.get("/reviews"),
        api.get("/kpis"),
        api.get("/goals"),
      ]);
      setReviews(reviewRes.data.filter(r => r.employee_number === user?.employeeNumber));
      setKpis(kpiRes.data.filter(k => k.employee_number === user?.employeeNumber));
      setGoals(goalRes.data.filter(g => g.employee_number === user?.employeeNumber));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPerformanceData();
    // Only re-run when the employee number actually changes, not on every
    // re-render of the auth context (avoids potential refetch loops if
    // `user` is a new object reference each render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.employeeNumber]);

  const getRating = (score) => {
    if (score >= 90) return { label: "Excellent", color: "text-green-600", bg: "bg-green-100" };
    if (score >= 75) return { label: "Good", color: "text-blue-600", bg: "bg-blue-100" };
    if (score >= 60) return { label: "Satisfactory", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { label: "Needs Improvement", color: "text-red-600", bg: "bg-red-100" };
  };

  if (loading) return <div className="text-muted">Loading your performance...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">My Performance</h2>
        <p className="text-muted text-sm">Your KPIs, Goals and Performance Reviews</p>
      </div>

      {/* KPIs Table */}
      <div className="bg-card rounded-xl border border-line p-6">
        <h3 className="font-bold text-ink mb-4">My KPIs</h3>
        {kpis.length === 0 ? (
          <p className="text-muted text-sm">No KPIs assigned yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface text-left">
              <tr>
                <th className="px-4 py-3">KPI Name</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Actual</th>
                <th className="px-4 py-3">Achievement</th>
                <th className="px-4 py-3">Weight (%)</th>
              </tr>
            </thead>
            <tbody>
              {kpis.map((k) => {
                const pct = parseFloat(k.achievement_percentage) || 0;
                return (
                  <tr key={k.id} className="border-t border-line">
                    <td className="px-4 py-3">{k.kpi_name}</td>
                    <td className="px-4 py-3">{k.target}</td>
                    <td className="px-4 py-3">{k.actual ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${pct >= 100 ? 'bg-green-500' : pct >= 75 ? 'bg-blue-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{k.weight}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Goals Table */}
      <div className="bg-card rounded-xl border border-line p-6">
        <h3 className="font-bold text-ink mb-4">My Goals</h3>
        {goals.length === 0 ? (
          <p className="text-muted text-sm">No goals assigned yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface text-left">
              <tr>
                <th className="px-4 py-3">Goal</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Target Date</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {goals.map((g) => (
                <tr key={g.id} className="border-t border-line">
                  <td className="px-4 py-3">{g.goal_title}</td>
                  <td className="px-4 py-3">{g.description}</td>
                  <td className="px-4 py-3">{String(g.target_date ?? "").slice(0, 10)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${g.progress >= 100 ? 'bg-green-500' : g.progress >= 50 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                          style={{ width: `${Math.min(g.progress || 0, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{g.progress || 0}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize">{g.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Performance Reviews */}
      <div className="bg-card rounded-xl border border-line p-6">
        <h3 className="font-bold text-ink mb-4">My Performance Reviews</h3>
        {reviews.length === 0 ? (
          <p className="text-muted text-sm">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => {
              const rating = getRating(r.final_score);
              return (
                <div key={r.id} className="flex items-center justify-between border-b border-line pb-3 last:border-0">
                  <div>
                    <p className="font-medium text-ink text-sm">{r.review_period}</p>
                    <p className="text-xs text-muted">KPI: {r.kpi_score} · Goal: {r.goal_score}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-ink">{r.final_score}</p>
                    <p className={`text-xs font-medium ${rating.color}`}>{rating.label}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      r.status === 'approved' ? 'bg-green-100 text-green-600' :
                      r.status === 'rejected' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>{r.status || 'approved'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Self Assessments Section */}
      {reviews.filter(r => r.status === 'self_assessment').length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-4">
          <h4 className="font-bold text-yellow-800 mb-3">⚠️ Pending Self Assessments</h4>
          {reviews.filter(r => r.status === 'self_assessment').map(r => (
            <SelfAssessmentForm key={r.id} review={r} onSubmitted={loadPerformanceData} />
          ))}
        </div>
      )}

      {/* My Complaints Section Component Link */}
      <MyComplaintsSection />
    </div>
  );
}
