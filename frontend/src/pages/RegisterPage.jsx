import { useState } from "react";
import { Link } from "react-router-dom";
import { registerUser } from "../api/authApi";

function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const cleanUsername = username.trim();
    if (cleanUsername.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      const response = await registerUser({ username: cleanUsername, password });
      setMessage(response.data.message);
      setUsername("");
      setPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <h1 className="mb-2 text-2xl font-bold text-emerald-900">Create Account</h1>
        <p className="mb-6 text-slate-600">Register a new EPMS user account.</p>

        {(error || message) && (
          <div
            className={`mb-4 rounded-md px-4 py-3 text-sm ${
              error ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
            }`}
          >
            {error || message}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3 rounded-lg border p-4">
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
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />
          <button className="w-full rounded-md bg-emerald-700 px-3 py-2 font-medium text-white hover:bg-emerald-800">
            Register
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

export default RegisterPage;
