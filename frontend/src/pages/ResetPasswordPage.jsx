import { useState } from "react";
import { Link } from "react-router-dom";
import { recoverPassword } from "../api/authApi";

function ResetPasswordPage() {
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const cleanUsername = username.trim();
    if (cleanUsername.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    try {
      const response = await recoverPassword({ username: cleanUsername, newPassword });
      setMessage(response.data.message);
      setNewPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Password reset failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <h1 className="mb-2 text-2xl font-bold text-amber-900">Reset Password</h1>
        <p className="mb-6 text-slate-600">Set a new password for an existing account.</p>

        {(error || message) && (
          <div
            className={`mb-4 rounded-md px-4 py-3 text-sm ${
              error ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
            }`}
          >
            {error || message}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-3 rounded-lg border p-4">
          <input
            className="w-full rounded-md border px-3 py-2"
            placeholder="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            minLength={3}
            required
          />
          <input
            type="password"
            className="w-full rounded-md border px-3 py-2"
            placeholder="New password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            minLength={6}
            required
          />
          <button className="w-full rounded-md bg-amber-600 px-3 py-2 font-medium text-white hover:bg-amber-700">
            Reset Password
          </button>
        </form>

        <div className="mt-4 text-sm">
          <Link to="/login" className="text-blue-700 hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
