import { useEffect, useState } from "react";
import { getDepartments } from "../api/departmentApi";
import { createEmployee, getEmployees } from "../api/employeeApi";
import { 
  Users, 
  UserPlus, 
  User, 
  Briefcase, 
  MapPin, 
  Phone, 
  Calendar, 
  Building2,
  Mail,
  Save,
  RefreshCw 
} from "lucide-react";

function EmployeePage() {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    employeeNumber: "",
    firstName: "",
    lastName: "",
    position: "",
    address: "",
    telephone: "",
    email: "",
    gender: "Male",
    hiredDate: "",
    departmentId: "",
  });

  const loadData = async () => {
    const [deptRes, empRes] = await Promise.all([getDepartments(), getEmployees()]);
    setDepartments(deptRes.data);
    setEmployees(empRes.data);
  };

  useEffect(() => {
    loadData().catch(() => setError("Failed to load employees"));
  }, []);

  const onChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const telephone = form.telephone.trim();
    const hiredDate = new Date(form.hiredDate);
    
    if (!/^[A-Za-z ]{2,50}$/.test(firstName) || !/^[A-Za-z ]{2,50}$/.test(lastName)) {
      setError("First name and last name should contain only letters (2-50 chars)");
      return;
    }
    if (!/^[0-9+\- ]{7,20}$/.test(telephone)) {
      setError("Telephone should contain valid digits (7-20 chars)");
      return;
    }
    if (Number.isNaN(hiredDate.getTime()) || hiredDate > new Date()) {
      setError("Hired date cannot be in the future");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createEmployee({
        ...form,
        firstName,
        lastName,
        telephone,
      });
      setMessage("Employee saved successfully!");
      setForm({
        employeeNumber: "",
        firstName: "",
        lastName: "",
        position: "",
        address: "",
        telephone: "",
        email: "",
        gender: "Male",
        hiredDate: "",
        departmentId: "",
      });
      await loadData();
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save employee");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate statistics
  const totalEmployees = employees.length;
  const totalDepartments = new Set(employees.map(emp => emp.department?._id).filter(Boolean)).size;
  const recentHires = employees.filter(emp => {
    const hiredDate = new Date(emp.hiredDate);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return hiredDate > threeMonthsAgo;
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Employee Management
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Manage employee information and records
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-2xl p-4 border border-purple-100 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Total Employees</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalEmployees}</p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-2xl p-4 border border-blue-100 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Departments</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalDepartments}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Recent Hires</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{recentHires}</p>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl">
                <UserPlus className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Employee Form */}
          <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500" />
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <UserPlus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Add New Employee
                </h2>
              </div>
              
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Employee Number
                    </label>
                    <input
                      name="employeeNumber"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
                      placeholder="e.g., EMP001"
                      value={form.employeeNumber}
                      onChange={onChange}
                      minLength={2}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Gender
                    </label>
                    <select
                      name="gender"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
                      value={form.gender}
                      onChange={onChange}
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        name="firstName"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
                        placeholder="First Name"
                        value={form.firstName}
                        onChange={onChange}
                        pattern="[A-Za-z ]{2,50}"
                        title="Use only letters (2-50 characters)"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Last Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        name="lastName"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
                        placeholder="Last Name"
                        value={form.lastName}
                        onChange={onChange}
                        pattern="[A-Za-z ]{2,50}"
                        title="Use only letters (2-50 characters)"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Position
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        name="position"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
                        placeholder="e.g., Software Engineer"
                        value={form.position}
                        onChange={onChange}
                        minLength={2}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Telephone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        name="telephone"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
                        placeholder="+1 234 567 8900"
                        value={form.telephone}
                        onChange={onChange}
                        pattern="[0-9+\- ]{7,20}"
                        title="Use 7-20 digits (plus and dash allowed)"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      name="email"
                      type="email"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
                      placeholder="employee@company.com"
                      value={form.email}
                      onChange={onChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <textarea
                      name="address"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
                      placeholder="Full address"
                      value={form.address}
                      onChange={onChange}
                      rows={2}
                      minLength={3}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Hired Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="date"
                        name="hiredDate"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
                        value={form.hiredDate}
                        onChange={onChange}
                        max={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Department
                    </label>
                    <select
                      name="departmentId"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
                      value={form.departmentId}
                      onChange={onChange}
                      required
                    >
                      <option value="">Select department</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.departmentCode} - {dept.departmentName}
                        </option>
                      ))}
                    </select>
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
                  className="relative w-full group overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2.5 px-4 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Employee
                      </>
                    )}
                  </span>
                </button>
              </form>
            </div>
          </section>

          {/* Employees List */}
          <section className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Employees ({employees.length})
                  </h2>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                {employees.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">No employees yet</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                      Add your first employee using the form
                    </p>
                  </div>
                ) : (
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="p-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Number
                        </th>
                        <th className="p-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="p-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Position
                        </th>
                        <th className="p-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Department
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((item, index) => (
                        <tr 
                          key={item._id} 
                          className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                            index % 2 === 0 ? 'bg-white/50 dark:bg-transparent' : ''
                          }`}
                        >
                          <td className="p-3 text-sm font-mono font-medium text-slate-900 dark:text-white">
                            {item.employeeNumber}
                          </td>
                          <td className="p-3 text-sm text-slate-600 dark:text-slate-300">
                            {item.firstName} {item.lastName}
                          </td>
                          <td className="p-3 text-sm text-slate-600 dark:text-slate-300">
                            {item.position}
                          </td>
                          <td className="p-3 text-sm">
                            <span className="px-2 py-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium">
                              {item.department?.departmentName || 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))}
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

export default EmployeePage;
