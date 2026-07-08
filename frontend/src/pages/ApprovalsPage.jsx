import { useEffect, useState } from "react";
import api from "../api/client.js";

export default function ApprovalsPage() {
  const [pending, setPending] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get("/reviews");
      setPending(data.filter(r => r.status === 'pending'));
    } catch {
      setError("Failed to load pending reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => {
    try {
      await api.put(`/reviews/${id}/approve`);
      setMessage("Review approved successfully.");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve.");
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Are you sure you want to reject this review?")) return;
    try {
      await api.put(`/reviews/${id}/reject`);
      setMessage("Review rejected.");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject.");
    }
  };

  const getRating = (score) => {
    if (score >= 90) return { label: "Excellent", color: "text-green-600" };
    if (score >= 75) return { label: "Good", color: "text-blue-600" };
    if (score >= 60) return { label: "Satisfactory", color: "text-yellow-600" };
    return { label: "Needs Improvement", color: "text-red-600" };
  };

  if (loading) return <div className="text-muted">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">Pending Approvals</h2>
        <p className="text-muted text-sm">Review and approve performance reviews submitted by deputy managers</p>
      </div>

      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {pending.length === 0 ? (
        <div className="bg-card rounded-xl border border-line p-8 text-center">
          <p className="text-muted">No pending reviews at the moment 🎉</p>
        </div>
      ) : (
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
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((r) => {
                const rating = getRating(r.final_score);
                return (
                  <tr key={r.id} className="border-t border-line">
                    <td className="px-4 py-3">{r.first_name} {r.last_name}</td>
                    <td className="px-4 py-3">{r.review_period}</td>
                    <td className="px-4 py-3">{r.kpi_score}</td>
                    <td className="px-4 py-3">{r.goal_score}</td>
                    <td className="px-4 py-3 font-bold">{r.final_score}</td>
                    <td className={`px-4 py-3 font-semibold ${rating.color}`}>{rating.label}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(r.id)} className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
                          ✅ Approve
                        </button>
                        <button onClick={() => handleReject(r.id)} className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
                          ❌ Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}