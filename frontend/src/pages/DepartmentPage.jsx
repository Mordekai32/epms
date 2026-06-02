import { useEffect, useState } from "react";
import { createDepartment, getDepartments, seedDepartments } from "../api/departmentApi";
import { Building2, Plus, Database, DollarSign, TrendingDown, RefreshCw } from "lucide-react";

function DepartmentPage() {
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    departmentCode: "",
    departmentName: "",
    grossSalary: "",
    totalDeduction: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const loadDepartments = async () => {
    const response = await getDepartments();
    setDepartments(response.data);
  };

  useEffect(() => {
    loadDepartments().catch(() => setError("Failed to load departments"));
  }, []);

  const onChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    
    const code = form.departmentCode.trim().toUpperCase();
    const name = form.departmentName.trim();
    const gross = Number(form.grossSalary);
    const deduction = Number(form.totalDeduction);
    
    if (!/^[A-Z0-9]{2,10}$/.test(code)) {
      setError("Department code must be 2-10 uppercase letters or numbers");
      return;
    }
    if (name.length < 2) {
      setError("Department name must be at least 2 characters");
      return;
    }
    if (Number.isNaN(gross) || gross < 0 || Number.isNaN(deduction) || deduction < 0) {
      setError("Gross salary and deduction must be positive numbers");
      return;
    }
    if (deduction > gross) {
      setError("Total deduction cannot exceed gross salary");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createDepartment({
        departmentCode: code,
        departmentName: name,
        grossSalary: gross,
        totalDeduction: deduction,
      });
      setMessage("Department saved successfully!");
      setForm({ departmentCode: "", departmentName: "", grossSalary: "", totalDeduction: "" });
      await loadDepartments();
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save department");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSeed = async () => {
    setError("");
    setMessage("");
    setIsSeeding(true);
    try {
      await seedDepartments();
      setMessage("Starter departments loaded successfully!");
      await loadDepartments();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to seed departments");
    } finally {
      setIsSeeding(false);
    }
  };

  // Calculate totals
  const totalGross = departments.reduce((sum, dept) => sum + (dept.grossSalary || 0), 0);
  const totalDeduction = departments.reduce((sum, dept) => sum + (dept.totalDeduction || 0), 0);
  const totalNet = totalGross - totalDeduction;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Department Management
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Manage departments and their salary structures
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={onSeed}
            disabled={isSeeding}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isSeeding ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            Seed Defaults
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-2xl p-4 border border-blue-100 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Departments</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{departments.length}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Total Gross Salary</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  ${totalGross.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl">
                <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 rounded-2xl p-4 border border-orange-100 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Total Net Salary</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  ${totalNet.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-xl">
                <TrendingDown className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Department Form */}
          <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500" />
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Add New Department
                </h2>
              </div>
              
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Department Code
                  </label>
                  <input
                    name="departmentCode"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="e.g., IT, HR, FIN"
                    value={form.departmentCode}
                    onChange={onChange}
                    pattern="[A-Za-z0-9]{2,10}"
                    title="Use 2-10 letters or numbers"
                    required
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    2-10 uppercase letters or numbers
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Department Name
                  </label>
                  <input
                    name="departmentName"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                    placeholder="e.g., Information Technology"
                    value={form.departmentName}
                    onChange={onChange}
                    minLength={2}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Gross Salary
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      name="grossSalary"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                      placeholder="0.00"
                      value={form.grossSalary}
                      onChange={onChange}
                      min={0}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Total Deduction
                  </label>
                  <div className="relative">
                    <TrendingDown className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="number"
                      name="totalDeduction"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                      placeholder="0.00"
                      value={form.totalDeduction}
                      onChange={onChange}
                      min={0}
                      required
                    />
                  </div>
                </div>
                
                {/* Messages */}
                {message && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 animate-fadeIn">
                    <p className="text-sm text-emerald-700 dark:text-emerald-400 text-center">{message}</p>
                  </div>
                )}
                
                {error && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 animate-shake">
                    <p className="text-sm text-red-700 dark:text-red-400 text-center">{error}</p>
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative w-full group overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-2.5 px-4 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Save Department
                      </>
                    )}
                  </span>
                </button>
              </form>
            </div>
          </section>

          {/* Departments List */}
          <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Departments ({departments.length})
                  </h2>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                {departments.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">No departments yet</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                      Add your first department using the form
                    </p>
                  </div>
                ) : (
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="p-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Code
                        </th>
                        <th className="p-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="p-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Gross
                        </th>
                        <th className="p-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Deduction
                        </th>
                        <th className="p-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Net
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {departments.map((item, index) => {
                        const net = (item.grossSalary || 0) - (item.totalDeduction || 0);
                        return (
                          <tr 
                            key={item._id} 
                            className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                              index % 2 === 0 ? 'bg-white/50 dark:bg-transparent' : ''
                            }`}
                          >
                            <td className="p-3 text-sm font-mono font-medium text-slate-900 dark:text-white">
                              {item.departmentCode}
                            </td>
                            <td className="p-3 text-sm text-slate-600 dark:text-slate-300">
                              {item.departmentName}
                             </td>
                            <td className="p-3 text-sm text-right text-emerald-600 dark:text-emerald-400 font-medium">
                              ${(item.grossSalary || 0).toLocaleString()}
                             </td>
                            <td className="p-3 text-sm text-right text-red-600 dark:text-red-400">
                              ${(item.totalDeduction || 0).toLocaleString()}
                             </td>
                            <td className="p-3 text-sm text-right text-blue-600 dark:text-blue-400 font-semibold">
                              ${net.toLocaleString()}
                             </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}

export default DepartmentPage;
