import { useEffect, useState } from "react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function DashboardPage() {
  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'manager';

  const [stats, setStats] = useState({ employees: 0, departments: 0, avgScore: 0, totalReviews: 0 });
  const [topPerformers, setTopPerformers] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (isStaff) {
          const [empRes, deptRes, reviewRes] = await Promise.all([
            api.get("/employees"),
            api.get("/departments"),
            api.get("/reviews"),
          ]);
          const employees = empRes.data;
          const departments = deptRes.data;
          const reviews = reviewRes.data;
          const avgScore = reviews.length
            ? (reviews.reduce((sum, r) => sum + parseFloat(r.final_score), 0) / reviews.length).toFixed(1)
            : 0;
          const sorted = [...reviews].sort((a, b) => b.final_score - a.final_score);
          setStats({ employees: employees.length, departments: departments.length, avgScore, totalReviews: reviews.length });
          setTopPerformers(sorted.slice(0, 5));
          setRecentReviews(reviews.slice(0, 5));
        } else {
          const { data } = await api.get("/reviews");
          const mine = data.filter(r => r.employee_number === user?.employeeNumber);
          setMyReviews(mine);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isStaff, user]);

  const getRating = (score) => {
    if (score >= 90) return { label: "Excellent", color: "text-green-600", bg: "bg-green-100" };
    if (score >= 75) return { label: "Good", color: "text-blue-600", bg: "bg-blue-100" };
    if (score >= 60) return { label: "Satisfactory", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { label: "Needs Improvement", color: "text-red-600", bg: "bg-red-100" };
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted">Loading dashboard...</div>;

  // EMPLOYEE VIEW — personal only
  if (!isStaff) {
    const latest = myReviews[0];
    const rating = latest ? getRating(latest.final_score) : null;
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-ink">Welcome, {user?.username}</h2>
          <p className="text-muted text-sm">Your personal performance overview</p>
        </div>

        {!latest ? (
          <div className="bg-card rounded-xl border border-line p-8 text-center">
            <p className="text-muted">No performance reviews yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-xl border border-line p-5">
              <p className="text-muted text-xs uppercase tracking-widest">Latest Final Score</p>
              <p className="text-4xl font-bold text-accent mt-2">{latest.final_score}</p>
              <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full font-medium ${rating.color} ${rating.bg}`}>
                {rating.label}
              </span>
            </div>
            <div className="bg-card rounded-xl border border-line p-5">
              <p className="text-muted text-xs uppercase tracking-widest">KPI Score</p>
              <p className="text-4xl font-bold text-ink mt-2">{latest.kpi_score}</p>
            </div>
            <div className="bg-card rounded-xl border border-line p-5">
              <p className="text-muted text-xs uppercase tracking-widest">Goal Score</p>
              <p className="text-4xl font-bold text-ink mt-2">{latest.goal_score}</p>
            </div>
          </div>
        )}

        <div className="bg-card rounded-xl border border-line p-6">
          <h3 className="font-bold text-ink mb-4"> My Review History</h3>
          {myReviews.length === 0 ? (
            <p className="text-muted text-sm">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {myReviews.map((r) => {
                const rt = getRating(r.final_score);
                return (
                  <div key={r.id} className="flex items-center justify-between border-b border-line pb-3 last:border-0">
                    <div>
                      <p className="font-medium text-ink text-sm">{r.review_period}</p>
                      <p className="text-xs text-muted">KPI: {r.kpi_score} · Goal: {r.goal_score}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-ink">{r.final_score}</p>
                      <p className={`text-xs font-medium ${rt.color}`}>{rt.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ADMIN/MANAGER VIEW — company-wide
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-ink">Dashboard</h2>
        <p className="text-muted text-sm">EIC Performance Management Overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-line p-5">
          <p className="text-muted text-xs uppercase tracking-widest">Total Employees</p>
          <p className="text-4xl font-bold text-ink mt-2">{stats.employees}</p>
        </div>
        <div className="bg-card rounded-xl border border-line p-5">
          <p className="text-muted text-xs uppercase tracking-widest">Departments</p>
          <p className="text-4xl font-bold text-ink mt-2">{stats.departments}</p>
        </div>
        <div className="bg-card rounded-xl border border-line p-5">
          <p className="text-muted text-xs uppercase tracking-widest">Avg Performance</p>
          <p className="text-4xl font-bold text-accent mt-2">{stats.avgScore}</p>
        </div>
        <div className="bg-card rounded-xl border border-line p-5">
          <p className="text-muted text-xs uppercase tracking-widest">Total Reviews</p>
          <p className="text-4xl font-bold text-ink mt-2">{stats.totalReviews}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-line p-6">
          <h3 className="font-bold text-ink mb-4"> Top Performers</h3>
          {topPerformers.length === 0 ? (
            <p className="text-muted text-sm">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {topPerformers.map((r, i) => {
                const rating = getRating(r.final_score);
                return (
                  <div key={r.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted w-6">{i + 1}.</span>
                      <div>
                        <p className="font-medium text-ink text-sm">{r.first_name} {r.last_name}</p>
                        <p className="text-xs text-muted">{r.review_period}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-ink">{r.final_score}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${rating.color} ${rating.bg}`}>
                        {rating.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-line p-6">
          <h3 className="font-bold text-ink mb-4"> Recent Reviews</h3>
          {recentReviews.length === 0 ? (
            <p className="text-muted text-sm">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {recentReviews.map((r) => {
                const rating = getRating(r.final_score);
                return (
                  <div key={r.id} className="flex items-center justify-between border-b border-line pb-3 last:border-0">
                    <div>
                      <p className="font-medium text-ink text-sm">{r.first_name} {r.last_name}</p>
                      <p className="text-xs text-muted">{r.review_period} · KPI: {r.kpi_score} · Goal: {r.goal_score}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-ink">{r.final_score}</p>
                      <p className={`text-xs font-medium ${rating.color}`}>{rating.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-line p-6">
        <h3 className="font-bold text-ink mb-4"> Score Distribution</h3>
        {recentReviews.length === 0 ? (
          <p className="text-muted text-sm">No data yet.</p>
        ) : (
          <div className="space-y-3">
            {[
              { label: "Excellent (90-100)", min: 90, color: "bg-green-500" },
              { label: "Good (75-89)", min: 75, max: 90, color: "bg-blue-500" },
              { label: "Satisfactory (60-74)", min: 60, max: 75, color: "bg-yellow-500" },
              { label: "Needs Improvement (<60)", max: 60, color: "bg-red-500" },
            ].map((band) => {
              const count = recentReviews.filter((r) => {
                const s = parseFloat(r.final_score);
                if (band.min && band.max) return s >= band.min && s < band.max;
                if (band.min) return s >= band.min;
                return s < band.max;
              }).length;
              const pct = recentReviews.length ? (count / recentReviews.length) * 100 : 0;
              return (
                <div key={band.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted">{band.label}</span>
                    <span className="font-medium text-ink">{count} employee{count !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="w-full bg-surface rounded-full h-2">
                    <div className={`${band.color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}