import { useEffect, useState } from "react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line, AreaChart, Area, ComposedChart,
  ScatterChart, Scatter, ZAxis, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";

export default function DashboardPage() {
  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'manager';

  const [stats, setStats] = useState({ 
    employees: 0, 
    departments: 0, 
    avgScore: 0, 
    totalReviews: 0,
    totalImprovements: 0,
    totalDeclines: 0
  });
  const [topPerformers, setTopPerformers] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [departmentPerformance, setDepartmentPerformance] = useState([]);
  const [scoreDistribution, setScoreDistribution] = useState([]);
  const [performanceGauge, setPerformanceGauge] = useState(0);
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
          const employees = empRes.data || [];
          const departments = deptRes.data || [];
          const reviews = reviewRes.data || [];
          
          // Parse scores
          const reviewsWithParsedScores = reviews.map(r => ({
            ...r,
            final_score: parseFloat(r.final_score) || 0,
            kpi_score: parseFloat(r.kpi_score) || 0,
            goal_score: parseFloat(r.goal_score) || 0,
            previous_score: parseFloat(r.previous_score) || null
          }));
          
          // Calculate improvements/declines
          let improvements = 0, declines = 0;
          reviewsWithParsedScores.forEach(r => {
            if (r.previous_score !== null) {
              if (r.final_score > r.previous_score) improvements++;
              else if (r.final_score < r.previous_score) declines++;
            }
          });
          
          const avgScore = reviewsWithParsedScores.length
            ? (reviewsWithParsedScores.reduce((sum, r) => sum + r.final_score, 0) / reviewsWithParsedScores.length).toFixed(1)
            : 0;
            
          const sorted = [...reviewsWithParsedScores].sort((a, b) => b.final_score - a.final_score);
          
          setStats({ 
            employees: employees.length, 
            departments: departments.length, 
            avgScore, 
            totalReviews: reviewsWithParsedScores.length,
            totalImprovements: improvements,
            totalDeclines: declines
          });
          
          setTopPerformers(sorted.slice(0, 5));
          setRecentReviews(reviewsWithParsedScores.slice(0, 5));
          
          // Generate trend data (group by review period)
          const trendMap = {};
          reviewsWithParsedScores.forEach(r => {
            const period = r.review_period || 'Unknown';
            if (!trendMap[period]) {
              trendMap[period] = { period, avgScore: 0, total: 0, count: 0 };
            }
            trendMap[period].avgScore += r.final_score;
            trendMap[period].count += 1;
            trendMap[period].total += 1;
          });
          
          const trendArray = Object.values(trendMap)
            .map(item => ({
              period: item.period,
              avgScore: parseFloat((item.avgScore / item.count).toFixed(1)),
              totalReviews: item.total
            }))
            .sort((a, b) => a.period.localeCompare(b.period));
          
          setTrendData(trendArray);
          
          // Calculate department performance
          const deptMap = {};
          reviewsWithParsedScores.forEach(r => {
            const dept = r.department_code || 'Unassigned';
            if (!deptMap[dept]) {
              deptMap[dept] = { department: dept, avgScore: 0, count: 0, total: 0 };
            }
            deptMap[dept].avgScore += r.final_score;
            deptMap[dept].count += 1;
            deptMap[dept].total += 1;
          });
          
          const deptArray = Object.values(deptMap)
            .map(item => ({
              department: item.department,
              avgScore: parseFloat((item.avgScore / item.count).toFixed(1)),
              totalReviews: item.total
            }))
            .sort((a, b) => b.avgScore - a.avgScore);
          
          setDepartmentPerformance(deptArray);
          
          // Score distribution for gauge
          const avg = parseFloat(avgScore);
          setPerformanceGauge(avg);
          
          // Score distribution for pie/bar
          const dist = [
            { name: "Excellent", value: reviewsWithParsedScores.filter(r => r.final_score >= 90).length, color: "#22c55e" },
            { name: "Good", value: reviewsWithParsedScores.filter(r => r.final_score >= 75 && r.final_score < 90).length, color: "#3b82f6" },
            { name: "Satisfactory", value: reviewsWithParsedScores.filter(r => r.final_score >= 60 && r.final_score < 75).length, color: "#eab308" },
            { name: "Needs Improvement", value: reviewsWithParsedScores.filter(r => r.final_score < 60).length, color: "#ef4444" },
          ].filter(d => d.value > 0);
          
          setScoreDistribution(dist);
          
        } else {
          const { data } = await api.get("/reviews");
          const reviews = data || [];
          const mine = reviews.filter(r => r.employee_number === user?.employeeNumber);
          const mineWithParsedScores = mine.map(r => ({
            ...r,
            final_score: parseFloat(r.final_score) || 0,
            kpi_score: parseFloat(r.kpi_score) || 0,
            goal_score: parseFloat(r.goal_score) || 0
          }));
          setMyReviews(mineWithParsedScores);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isStaff, user?.employeeNumber]);

  const getRating = (score) => {
    const numScore = parseFloat(score) || 0;
    if (numScore >= 90) return { label: "Excellent", color: "text-green-600", bg: "bg-green-100" };
    if (numScore >= 75) return { label: "Good", color: "text-blue-600", bg: "bg-blue-100" };
    if (numScore >= 60) return { label: "Satisfactory", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { label: "Needs Improvement", color: "text-red-600", bg: "bg-red-100" };
  };

  // Gauge component
  const GaugeChart = ({ value, maxValue = 100, label = "Overall Performance" }) => {
    const percentage = Math.min((value / maxValue) * 100, 100);
    const circumference = 2 * Math.PI * 80;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    const getColor = () => {
      if (percentage >= 90) return "#22c55e";
      if (percentage >= 75) return "#3b82f6";
      if (percentage >= 60) return "#eab308";
      return "#ef4444";
    };

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-48 h-48">
          <svg className="transform -rotate-90 w-48 h-48">
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="#e5e7eb"
              strokeWidth="16"
              fill="none"
            />
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke={getColor()}
              strokeWidth="16"
              fill="none"
              strokeLinecap="round"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
                transition: 'stroke-dashoffset 0.5s ease'
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-ink">{value.toFixed(1)}</span>
            <span className="text-sm text-muted">{label}</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted">Loading dashboard...</div>;

  // EMPLOYEE VIEW
  if (!isStaff) {
    const latest = myReviews[0];
    const rating = latest ? getRating(latest.final_score) : null;
    
    // Personal trend data
    const personalTrend = myReviews
      .sort((a, b) => (a.review_period || '').localeCompare(b.review_period || ''))
      .map(r => ({
        period: r.review_period || 'N/A',
        score: r.final_score,
        kpi: r.kpi_score,
        goal: r.goal_score
      }));

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
          <>
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

            {/* Personal Performance Gauge */}
            <div className="bg-card rounded-xl border border-line p-6 flex justify-center">
              <GaugeChart value={latest.final_score} label="Your Current Score" />
            </div>

            {/* Personal Trend Line Chart */}
            {personalTrend.length > 1 && (
              <div className="bg-card rounded-xl border border-line p-6">
                <h3 className="font-bold text-ink mb-4">📈 Your Performance Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={personalTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#a855f7" strokeWidth={2} />
                    <Line type="monotone" dataKey="kpi" stroke="#6366f1" strokeWidth={2} />
                    <Line type="monotone" dataKey="goal" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="bg-card rounded-xl border border-line p-6">
              <h3 className="font-bold text-ink mb-4">My Review History</h3>
              {myReviews.length === 0 ? (
                <p className="text-muted text-sm">No reviews yet.</p>
              ) : (
                <div className="space-y-3">
                  {myReviews.map((r, idx) => {
                    const rt = getRating(r.final_score);
                    return (
                      <div key={r.id || idx} className="flex items-center justify-between border-b border-line pb-3 last:border-0">
                        <div>
                          <p className="font-medium text-ink text-sm">{r.review_period || "N/A"}</p>
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
          </>
        )}
      </div>
    );
  }

  // ADMIN/MANAGER VIEW
  // Prepare chart data
  const chartData = (() => {
    if (!recentReviews.length) return [];
    
    const grouped = {};
    recentReviews.forEach(r => {
      const key = r.employee_number || `${r.first_name}_${r.last_name}`;
      const name = `${r.first_name || 'Unknown'} ${r.last_name || ''}`.trim() || 'Employee';
      
      if (!grouped[key]) {
        grouped[key] = { 
          name, 
          kpiTotal: 0, 
          goalTotal: 0, 
          finalTotal: 0, 
          count: 0,
          previousTotal: 0,
          previousCount: 0
        };
      }
      grouped[key].kpiTotal += parseFloat(r.kpi_score) || 0;
      grouped[key].goalTotal += parseFloat(r.goal_score) || 0;
      grouped[key].finalTotal += parseFloat(r.final_score) || 0;
      grouped[key].count += 1;
      if (r.previous_score !== null) {
        grouped[key].previousTotal += parseFloat(r.previous_score) || 0;
        grouped[key].previousCount += 1;
      }
    });
    
    return Object.values(grouped)
      .map(e => ({
        name: e.name,
        KPI: parseFloat((e.kpiTotal / e.count).toFixed(1)),
        Goal: parseFloat((e.goalTotal / e.count).toFixed(1)),
        Final: parseFloat((e.finalTotal / e.count).toFixed(1)),
        Previous: e.previousCount > 0 ? parseFloat((e.previousTotal / e.previousCount).toFixed(1)) : null,
        Improvement: e.previousCount > 0 ? 
          parseFloat(((e.finalTotal / e.count) - (e.previousTotal / e.previousCount)).toFixed(1)) : null
      }))
      .sort((a, b) => b.Final - a.Final)
      .slice(0, 10);
  })();

  // Department comparison data
  const deptChartData = departmentPerformance.map(d => ({
    name: d.department,
    score: d.avgScore,
    reviews: d.totalReviews
  }));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-ink">Dashboard</h2>
        <p className="text-muted text-sm">EIC Performance Management Overview</p>
      </div>

      {/* Stats Cards with Improvements */}
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

      {/* Improvement/Decline Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-line p-5">
          <p className="text-muted text-xs uppercase tracking-widest">📈 Improvements</p>
          <p className="text-4xl font-bold text-green-600 mt-2">{stats.totalImprovements}</p>
          <p className="text-xs text-muted mt-1">Employees who improved</p>
        </div>
        <div className="bg-card rounded-xl border border-line p-5">
          <p className="text-muted text-xs uppercase tracking-widest">📉 Declines</p>
          <p className="text-4xl font-bold text-red-600 mt-2">{stats.totalDeclines}</p>
          <p className="text-xs text-muted mt-1">Employees who declined</p>
        </div>
      </div>

      {/* Performance Gauge */}
      <div className="bg-card rounded-xl border border-line p-6">
        <h3 className="font-bold text-ink mb-4 text-center">🎯 Overall Performance Gauge</h3>
        <div className="flex justify-center">
          <GaugeChart value={parseFloat(stats.avgScore)} label="Company Average" />
        </div>
      </div>

      {/* Top Performers & Recent Reviews */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-line p-6">
          <h3 className="font-bold text-ink mb-4">🏆 Top Performers</h3>
          {topPerformers.length === 0 ? (
            <p className="text-muted text-sm">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {topPerformers.map((r, i) => {
                const rating = getRating(r.final_score);
                return (
                  <div key={r.id || i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted w-6">{i + 1}.</span>
                      <div>
                        <p className="font-medium text-ink text-sm">{r.first_name} {r.last_name}</p>
                        <p className="text-xs text-muted">{r.review_period || "N/A"}</p>
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
          <h3 className="font-bold text-ink mb-4">📋 Recent Reviews</h3>
          {recentReviews.length === 0 ? (
            <p className="text-muted text-sm">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {recentReviews.map((r, idx) => {
                const rating = getRating(r.final_score);
                return (
                  <div key={r.id || idx} className="flex items-center justify-between border-b border-line pb-3 last:border-0">
                    <div>
                      <p className="font-medium text-ink text-sm">{r.first_name} {r.last_name}</p>
                      <p className="text-xs text-muted">{r.review_period || "N/A"} · KPI: {r.kpi_score} · Goal: {r.goal_score}</p>
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

      {/* Trend Line Chart */}
      {trendData.length > 0 && (
        <div className="bg-card rounded-xl border border-line p-6">
          <h3 className="font-bold text-ink mb-4">📈 Performance Trend Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgScore" stroke="#a855f7" strokeWidth={3} name="Average Score" />
              <Line type="monotone" dataKey="totalReviews" stroke="#6366f1" strokeWidth={2} name="Total Reviews" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Area Chart - Cumulative Performance */}
      {trendData.length > 0 && (
        <div className="bg-card rounded-xl border border-line p-6">
          <h3 className="font-bold text-ink mb-4">📊 Cumulative Performance Area</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Area type="monotone" dataKey="avgScore" stackId="1" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Employee Performance Bar Chart */}
      <div className="bg-card rounded-xl border border-line p-6">
        <h3 className="font-bold text-ink mb-4">📊 Employee Performance Comparison</h3>
        {chartData.length === 0 ? (
          <p className="text-muted text-sm">No data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="KPI" fill="#6366f1" radius={[0, 4, 4, 0]} />
              <Bar dataKey="Goal" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              <Bar dataKey="Final" fill="#a855f7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Department Performance */}
      {deptChartData.length > 0 && (
        <div className="bg-card rounded-xl border border-line p-6">
          <h3 className="font-bold text-ink mb-4">🏢 Department Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={deptChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" domain={[0, 100]} />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="score" fill="#a855f7" radius={[4, 4, 0, 0]} name="Average Score" />
              <Line yAxisId="right" type="monotone" dataKey="reviews" stroke="#6366f1" strokeWidth={2} name="Reviews" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Score Distribution (Pie + Bar combo) */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-line p-6">
          <h3 className="font-bold text-ink mb-4">🥧 Rating Distribution</h3>
          {scoreDistribution.length === 0 ? (
            <p className="text-muted text-sm">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={scoreDistribution} 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={100} 
                  dataKey="value" 
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {scoreDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-card rounded-xl border border-line p-6">
          <h3 className="font-bold text-ink mb-4">📊 Score Distribution Bar</h3>
          {scoreDistribution.length === 0 ? (
            <p className="text-muted text-sm">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {scoreDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Improvement/Decline Chart */}
      {chartData.some(d => d.Improvement !== null) && (
        <div className="bg-card rounded-xl border border-line p-6">
          <h3 className="font-bold text-ink mb-4">📉 Score Changes (Improvement/Decline)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.filter(d => d.Improvement !== null)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Improvement" radius={[4, 4, 0, 0]}>
                {chartData.filter(d => d.Improvement !== null).map((entry, index) => (
                  <Cell key={index} fill={entry.Improvement >= 0 ? "#22c55e" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Radar Chart - Department Comparison */}
      {departmentPerformance.length >= 3 && (
        <div className="bg-card rounded-xl border border-line p-6">
          <h3 className="font-bold text-ink mb-4">🎯 Department Performance Radar</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={departmentPerformance}>
              <PolarGrid />
              <PolarAngleAxis dataKey="department" />
              <PolarRadiusAxis domain={[0, 100]} />
              <Radar name="Department Score" dataKey="avgScore" stroke="#a855f7" fill="#a855f7" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}