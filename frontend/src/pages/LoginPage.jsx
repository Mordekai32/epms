import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from "lucide-react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import logo from "../assets/1.PNG";
export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    
    if (mode === "register") {
      if (!form.username.trim() || !form.email.trim() || !form.password) {
        setError("Username, email and password are required.");
        return;
      }
    } else if (!form.username.trim() || !form.password) {
      setError("Username and password are required.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (mode === "register") {
        await api.post("/auth/register", {
          username: form.username,
          email: form.email,
          password: form.password,
        });
        setMessage("Account created successfully! Please login.");
        setMode("login");
        setForm({ username: form.username, email: "", password: "" });
        return;
      }
      const { data } = await api.post("/auth/login", {
        username: form.username,
        password: form.password,
      });
      login(data.user, data.token);
    } catch (err) {
      setError(err.response?.data?.message || "Request failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-100 px-4 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-purple-400/30 to-purple-600/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-600/30 to-purple-800/30 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-tr from-purple-500/5 via-transparent to-purple-700/5" />
      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-md">
        {/* Floating Decorative Elements */}
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl rotate-12 opacity-20 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-tr from-purple-600 to-purple-900 rounded-full opacity-20 blur-2xl" />

        <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-100 overflow-hidden">
          {/* Top Gradient Bar */}
          <div className="h-1.5 bg-gradient-to-r from-purple-600 via-purple-700 to-purple-900" />
          
          <div className="p-8 sm:p-10">
            {/* Logo/Brand Section */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
  <img
    src={logo}
    alt="Ethiopian Insurance Corporation Logo"
    className="w-40 h-40 object-contain"
  />
</div>
              <h1 className="text-2xl font-bold text-purple-700">
                EIC PMS
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Ethiopian Insurance Corporation
              </p>
              <p className="text-slate-400 text-xs mt-1">
                {mode === "login" ? "Please sign in to continue" : "Create your account to get started"}
              </p>
            </div>

            <form onSubmit={submit} className="space-y-5">
              {/* Username Field */}
              <div className="group">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
                    placeholder="Enter your username"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                  />
                </div>
              </div>

              {/* Email Field (Register Mode) */}
              {mode === "register" && (
                <div className="group animate-fadeIn">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                    <input
                      type="email"
                      className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
                      placeholder="Enter your email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Password Field */}
              <div className="group">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-12 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Messages */}
              {message && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-sm text-emerald-700 text-center">{message}</p>
                </div>
              )}
              
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 animate-shake">
                  <p className="text-sm text-red-700 text-center">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="relative w-full group overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white font-semibold py-3 px-4 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {mode === "login" ? "Sign In" : "Create Account"}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>

              {/* Forgot Password Link */}
              {mode === "login" && (
                <div className="text-center">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-slate-600 hover:text-purple-600 transition-colors"
                  >
                    Forgot your password?
                  </Link>
                </div>
              )}

              {/* Toggle Mode Button */}
              <div className="pt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "login" ? "register" : "login");
                    setError("");
                    setForm({ username: form.username, email: "", password: "" });
                  }}
                  className="text-sm text-slate-600 hover:text-purple-600 transition-colors"
                >
                  {mode === "login" ? (
                    <>Don't have an account? <span className="font-semibold text-purple-600">Sign up</span></>
                  ) : (
                    <>Already have an account? <span className="font-semibold text-purple-600">Sign in</span></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-slate-500 mt-6">
          EIC — Employee Performance Management System
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-shake { animation: shake 0.3s ease-in-out; }
        .delay-1000 { animation-delay: 1s; }
      `}</style>
    </div>
  );
}