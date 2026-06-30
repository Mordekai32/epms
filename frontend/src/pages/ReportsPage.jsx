import { useEffect, useState } from "react";
import api from "../api/client.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const PAGE_SIZE = 10;

function Pagination({ page, setPage, total }) {
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 text-sm">
      <span className="text-muted">Page {page} of {totalPages} ({total} total)</span>
      <div className="flex gap-2">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1.5 rounded-lg border border-line disabled:opacity-40 hover:bg-surface"
        >
          ← Prev
        </button>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-3 py-1.5 rounded-lg border border-line disabled:opacity-40 hover:bg-surface"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [employeeReport, setEmployeeReport] = useState([]);
  const [departmentReport, setDepartmentReport] = useState([]);
  const [empPage, setEmpPage] = useState(1);
  const [deptPage, setDeptPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [empRes, deptRes] = await Promise.all([
          api.get("/reports-data/employees"),
          api.get("/reports-data/departments"),
        ]);
        setEmployeeReport(empRes.data);
        setDepartmentReport(deptRes.data);
      } catch (err) {
        setError("Failed to load reports.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const exportEmployeePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("EIC PMS - Employee Performance Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [["Employee #", "Name", "Position", "Department", "Avg Score", "Reviews"]],
      body: employeeReport.map(e => [
        e.employee_number,
        `${e.first_name} ${e.last_name}`,
        e.position,
        e.department_code,
        parseFloat(e.avg_score).toFixed(2),
        e.review_count,
      ]),
    });
    doc.save("eic-pms-employee-report.pdf");
  };

  const exportDepartmentPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("EIC PMS - Department Performance Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [["Code", "Department", "Employees", "Avg Score"]],
      body: departmentReport.map(d => [
        d.department_code,
        d.department_name,
        d.employee_count,
        parseFloat(d.avg_score).toFixed(2),
      ]),
    });
    doc.save("eic-pms-department-report.pdf");
  };

  const exportEmployeeExcel = () => {
    const ws = XLSX.utils.json_to_sheet(employeeReport.map(e => ({
      "Employee Number": e.employee_number,
      "Name": `${e.first_name} ${e.last_name}`,
      "Position": e.position,
      "Department": e.department_code,
      "Avg Score": parseFloat(e.avg_score).toFixed(2),
      "Reviews": e.review_count,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employee Report");
    XLSX.writeFile(wb, "eic-pms-employee-report.xlsx");
  };

  const exportDepartmentExcel = () => {
    const ws = XLSX.utils.json_to_sheet(departmentReport.map(d => ({
      "Code": d.department_code,
      "Department": d.department_name,
      "Employees": d.employee_count,
      "Avg Score": parseFloat(d.avg_score).toFixed(2),
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Department Report");
    XLSX.writeFile(wb, "eic-pms-department-report.xlsx");
  };

  if (loading) return <div className="text-muted">Loading reports...</div>;

  const empStart = (empPage - 1) * PAGE_SIZE;
  const empPageRows = employeeReport.slice(empStart, empStart + PAGE_SIZE);

  const deptStart = (deptPage - 1) * PAGE_SIZE;
  const deptPageRows = departmentReport.slice(deptStart, deptStart + PAGE_SIZE);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-ink">Reports</h2>
        <p className="text-muted text-sm">Employee and department performance reports</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Employee Report */}
      <div className="bg-card rounded-xl border border-line p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-ink">Employee Performance Report</h3>
          <div className="flex gap-2">
            <button onClick={exportEmployeePDF} className="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold px-3 py-1.5 rounded-lg">
              📄 Export PDF
            </button>
            <button onClick={exportEmployeeExcel} className="text-xs bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1.5 rounded-lg">
              📄 Export Excel
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left">
              <tr>
                <th className="px-4 py-3">Employee #</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Avg Score</th>
                <th className="px-4 py-3">Reviews</th>
              </tr>
            </thead>
            <tbody>
              {empPageRows.map((e) => (
                <tr key={e.employee_number} className="border-t border-line">
                  <td className="px-4 py-3">{e.employee_number}</td>
                  <td className="px-4 py-3">{e.first_name} {e.last_name}</td>
                  <td className="px-4 py-3">{e.position}</td>
                  <td className="px-4 py-3">{e.department_code}</td>
                  <td className="px-4 py-3 font-bold">{parseFloat(e.avg_score).toFixed(2)}</td>
                  <td className="px-4 py-3">{e.review_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={empPage} setPage={setEmpPage} total={employeeReport.length} />
      </div>

      {/* Department Report */}
      <div className="bg-card rounded-xl border border-line p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-ink">Department Performance Report</h3>
          <div className="flex gap-2">
            <button onClick={exportDepartmentPDF} className="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold px-3 py-1.5 rounded-lg">
              📄 Export PDF
            </button>
            <button onClick={exportDepartmentExcel} className="text-xs bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1.5 rounded-lg">
              📄 Export Excel
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Employees</th>
                <th className="px-4 py-3">Avg Score</th>
              </tr>
            </thead>
            <tbody>
              {deptPageRows.map((d) => (
                <tr key={d.department_code} className="border-t border-line">
                  <td className="px-4 py-3">{d.department_code}</td>
                  <td className="px-4 py-3">{d.department_name}</td>
                  <td className="px-4 py-3">{d.employee_count}</td>
                  <td className="px-4 py-3 font-bold">{parseFloat(d.avg_score).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={deptPage} setPage={setDeptPage} total={departmentReport.length} />
      </div>
    </div>
  );
}