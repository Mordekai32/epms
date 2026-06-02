import { useState } from "react";
import api from "../api/client.js";

const sections = [
  {
    key: "employees",
    label: "Employees",
    cols: ["Number", "First Name", "Last Name", "Position", "Department", "Hired Date"],
    keys: ["employee_number", "first_name", "last_name", "position", "department_code", "hired_date"],
  },
  {
    key: "departments",
    label: "Departments",
    cols: ["Code", "Name"],
    keys: ["department_code", "department_name"],
  },
  {
    key: "salaries",
    label: "Salaries",
    cols: ["Gross", "Deduction", "Net", "Month", "Employee"],
    keys: ["gross_salary", "total_deduction", "net_salary", "month_of_payment", "employee_number"],
  },
];

const today = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => today().slice(0, 7);

export default function ReportsPage() {
  const [period, setPeriod] = useState("daily");
  const [date, setDate] = useState(today());
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(today());
  const [month, setMonth] = useState(thisMonth());
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const params = { period };
      if (period === "daily") params.date = date;
      if (period === "weekly") {
        if (!startDate || !endDate) {
          setError("Select start date and end date for the weekly report.");
          setLoading(false);
          return;
        }
        if (startDate > endDate) {
          setError("Start date must be before or equal to end date.");
          setLoading(false);
          return;
        }
        params.startDate = startDate;
        params.endDate = endDate;
      }
      if (period === "monthly") params.month = month;

      const { data: res } = await api.get("/reports", { params });
      setData(res.reports);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">Reports</h2>
        <p className="text-muted text-sm">Daily, weekly, and monthly employee, department, and salary reports</p>
      </div>

      <div className="bg-card rounded-xl border border-line p-6 space-y-4">
        <label className="block text-sm font-medium text-ink">
          Report type
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="mt-1 w-full md:w-64 rounded-lg border border-line px-3 py-2"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>

        {period === "daily" && (
          <label className="block text-sm font-medium text-ink">
            Select date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full md:w-64 rounded-lg border border-line px-3 py-2"
            />
          </label>
        )}

        {period === "weekly" && (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-ink">
              Start date
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium text-ink">
              End date
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line px-3 py-2"
              />
            </label>
          </div>
        )}

        {period === "monthly" && (
          <label className="block text-sm font-medium text-ink">
            Select month
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="mt-1 w-full md:w-64 rounded-lg border border-line px-3 py-2"
            />
          </label>
        )}

        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-lg bg-accent text-accent-text px-5 py-2.5 font-semibold disabled:opacity-60"
        >
          {loading ? "Loading..." : "Generate report"}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {data && (
        <div className="grid gap-6">
          {sections.map((s) => (
            <div key={s.key} className="bg-card rounded-xl border border-line overflow-x-auto">
              <h3 className="px-4 py-3 font-semibold border-b border-line bg-surface">
                {s.label} ({(data[s.key] || []).length})
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {s.cols.map((c) => (
                      <th key={c} className="px-4 py-2 text-left">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data[s.key] || []).length === 0 ? (
                    <tr>
                      <td colSpan={s.cols.length} className="px-4 py-6 text-center text-muted">
                        No records for this period.
                      </td>
                    </tr>
                  ) : (
                    (data[s.key] || []).map((row, i) => (
                      <tr key={i} className="border-t border-line">
                        {s.keys.map((k) => (
                          <td key={k} className="px-4 py-2">
                            {String(row[k] ?? "").slice(0, 40)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
