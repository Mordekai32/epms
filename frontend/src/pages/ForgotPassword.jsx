import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client.js";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", newPassword: "", confirmPassword: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const err = {};
    const email = form.email.trim();
    if (!email) err.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) err.email = "Enter a valid email address.";
    if (!form.newPassword) err.newPassword = "New password is required.";
    if (!form.confirmPassword) err.confirmPassword = "Confirm password is required.";
    else if (form.newPassword && form.newPassword !== form.confirmPassword) {
      err.confirmPassword = "Passwords must match.";
    }
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", {
        email: form.email.trim(),
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      setMessage(data.message || "Password reset successfully.");
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <form onSubmit={submit} className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8 border border-line">
        <div className="w-12 h-1 bg-accent rounded mb-4" />
        <h1 className="text-2xl font-bold text-ink">Reset Password</h1>
        <p className="text-muted text-sm mt-1">Enter your email and new password</p>
        <div className="mt-6 space-y-3">
          <div>
            <input
              className="w-full rounded-lg border border-line px-3 py-2.5"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
          </div>
          <div>
            <input
              className="w-full rounded-lg border border-line px-3 py-2.5"
              type="password"
              placeholder="New password"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            />
            {fieldErrors.newPassword && <p className="mt-1 text-sm text-red-600">{fieldErrors.newPassword}</p>}
          </div>
          <div>
            <input
              className="w-full rounded-lg border border-line px-3 py-2.5"
              type="password"
              placeholder="Confirm password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            />
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
            )}
          </div>
        </div>
        {message && <p className="mt-3 text-sm text-green-600">{message}</p>}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-accent text-accent-text py-2.5 font-semibold disabled:opacity-60"
        >
          {loading ? "Please wait…" : "Reset Password"}
        </button>
        <Link to="/login" className="mt-3 block w-full text-center text-sm text-muted underline">
          Back to login
        </Link>
      </form>
    </div>
  );
}
