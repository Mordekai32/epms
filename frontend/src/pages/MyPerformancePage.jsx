import { useEffect, useState } from "react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function MyPerformancePage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/reviews");
        // Filter to show only this user's reviews if employee_number matches username
    const myReviews = data.filter(r => r.employee_number === user?.employeeNumber);
        setReviews(myReviews);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

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
        <p className="text-muted text-sm">Your performance review history</p>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-card rounded-xl border border-line p-8 text-center">
          <p className="text-muted">No performance reviews found yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map((r) => {
            const rating = getRating(r.final_score);
            return (
              <div key={r.id} className="bg-card rounded-xl border border-line p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-semibold text-ink">{r.review_period}</p>
                    <p className="text-xs text-muted">Reviewed</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${rating.color} ${rating.bg}`}>
                    {rating.label}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center mb-4">
                  <div>
                    <p className="text-xs text-muted">KPI Score</p>
                    <p className="text-lg font-bold text-ink">{r.kpi_score}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Goal Score</p>
                    <p className="text-lg font-bold text-ink">{r.goal_score}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">Final Score</p>
                    <p className="text-lg font-bold text-accent">{r.final_score}</p>
                  </div>
                </div>
                {r.comments && (
                  <p className="text-sm text-muted border-t border-line pt-3">{r.comments}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}