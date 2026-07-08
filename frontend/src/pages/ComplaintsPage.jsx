import { useEffect, useState } from "react";
import api from "../api/client.js";

function ResolveModal({ complaint, onClose, onResolved }) {
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleResolve = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await api.put(`/complaints/${complaint.id}/resolve`, { resolutionComment: comment });
      onResolved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resolve.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl space-y-4">
        <h3 className="text-lg font-bold text-ink">Resolve Complaint</h3>
        <div className="bg-surface rounded-lg p-3">
          <p className="text-sm text-muted">Employee complaint:</p>
          <p className="text-sm text-ink mt-1">{complaint.message}</p>
        </div>
        <label className="block text-sm">
          <span className="font-medium text-ink">Your Response (optional)</span>
          <textarea
            className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm h-24 resize-none"
            placeholder="Add a comment for the employee..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={submitting}
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={handleResolve}
            disabled={submitting}
            className="rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed text-white px-5 py-2 font-semibold"
          >
            {submitting ? "Resolving..." : "✅ Resolve"}
          </button>
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-line px-5 py-2 font-semibold disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "resolved", label: "Resolved" },
];

const PAGE_SIZE = 8;

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = async () => {
    try {
      const { data } = await api.get("/complaints");
      setComplaints(data);
    } catch {
      setError("Failed to load complaints.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Auto-dismiss the success message after a few seconds
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 4000);
    return () => clearTimeout(t);
  }, [message]);

  // Go back to page 1 whenever the filter or search changes
  useEffect(() => { setPage(1); }, [filter, search]);

  const openCount = complaints.filter((c) => c.status !== "resolved").length;

  const filteredComplaints = complaints
    .filter((c) => filter === "all" || c.status === filter || (filter === "open" && c.status !== "resolved"))
    .filter((c) =>
      !search ||
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      c.message?.toLowerCase().includes(search.toLowerCase())
    )
    // Open complaints first, then resolved
    .sort((a, b) => {
      if (a.status === b.status) return 0;
      return a.status === "resolved" ? 1 : -1;
    });

  const totalPages = Math.max(1, Math.ceil(filteredComplaints.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const visibleComplaints = filteredComplaints.slice(startIdx, startIdx + PAGE_SIZE);

  if (loading) return <div className="text-muted">Loading complaints...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-ink">Complaints</h2>
          <p className="text-muted text-sm">Employee complaints and concerns</p>
        </div>
        {openCount > 0 && (
          <span className="text-xs px-3 py-1.5 rounded-full font-medium bg-yellow-100 text-yellow-700">
            {openCount} open
          </span>
        )}
      </div>

      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-surface rounded-lg p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition ${
                filter === f.key ? "bg-white shadow text-ink" : "text-muted hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          className="rounded-lg border border-line px-3 py-2 text-sm w-64"
          placeholder="Search by employee or keyword..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-xs text-red-500 hover:underline">Clear</button>
        )}
      </div>

      {visibleComplaints.length === 0 ? (
        <div className="bg-card rounded-xl border border-line p-8 text-center">
          <p className="text-muted">
            {complaints.length === 0 ? "No complaints at the moment 🎉" : "No complaints match your filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleComplaints.map((c) => (
            <div key={c.id} className="bg-card rounded-xl border border-line p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-ink">{c.first_name} {c.last_name}</p>
                  <p className="text-xs text-muted">{c.department_code} · {String(c.created_at ?? "").slice(0, 10)}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  c.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                }`}>{c.status}</span>
              </div>
              <p className="text-sm text-ink mb-3">{c.message}</p>
              {c.resolution_comment && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                  <p className="text-xs font-medium text-green-700 mb-1">Your Response:</p>
                  <p className="text-sm text-green-800">{c.resolution_comment}</p>
                </div>
              )}
              {c.status === 'open' && (
                <button
                  onClick={() => setSelectedComplaint(c)}
                  className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
                  ✅ Resolve
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {filteredComplaints.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card rounded-xl border border-line px-5 py-4">
          <p className="text-sm text-muted">
            Showing <span className="font-semibold text-ink">{startIdx + 1}</span>
            {"–"}
            <span className="font-semibold text-ink">{Math.min(startIdx + PAGE_SIZE, filteredComplaints.length)}</span>
            {" of "}
            <span className="font-semibold text-ink">{filteredComplaints.length}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="rounded-lg border border-line px-4 py-2 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface"
            >
              ← Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => setPage(num)}
                  className={`w-9 h-9 rounded-lg text-sm font-semibold transition ${
                    num === safePage
                      ? "bg-accent text-accent-text"
                      : "border border-line text-ink hover:bg-surface"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="rounded-lg border border-line px-4 py-2 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {selectedComplaint && (
        <ResolveModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onResolved={() => { setMessage("Complaint resolved!"); load(); }}
        />
      )}
    </div>
  );
}
