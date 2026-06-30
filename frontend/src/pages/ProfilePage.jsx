import { useEffect, useState } from "react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/profile");
        setProfile(data);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const submitPasswordChange = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError("All fields are required."); return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New password and confirmation do not match."); return;
    }
    setLoading(true);
    try {
      await api.put("/profile/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setMessage("Password changed successfully.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password.");
    } finally { setLoading(false); }
  };

  const inputClass = "mt-1 w-full rounded-lg border border-line px-3 py-2";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">My Profile</h2>
        <p className="text-muted text-sm">View your account details and manage your password</p>
      </div>

      {/* Account Info */}
      <div className="bg-card rounded-xl border border-line p-6">
        <h3 className="font-bold text-ink mb-4">Account Information</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted">Username</p>
            <p className="font-medium text-ink">{user?.username}</p>
          </div>
          <div>
            <p className="text-muted">Email</p>
            <p className="font-medium text-ink">{user?.email}</p>
          </div>
          <div>
            <p className="text-muted">Role</p>
            <p className="font-medium text-ink capitalize">{user?.role}</p>
          </div>
          {profile?.employee && (
            <div>
              <p className="text-muted">Employee Number</p>
              <p className="font-medium text-ink">{profile.employee.employee_number}</p>
            </div>
          )}
        </div>
      </div>

      {/* Employee Details if linked */}
      {profile?.employee && (
        <div className="bg-card rounded-xl border border-line p-6">
          <h3 className="font-bold text-ink mb-4">Employee Details</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted">Full Name</p>
              <p className="font-medium text-ink">{profile.employee.first_name} {profile.employee.last_name}</p>
            </div>
            <div>
              <p className="text-muted">Position</p>
              <p className="font-medium text-ink">{profile.employee.position}</p>
            </div>
            <div>
              <p className="text-muted">Department</p>
              <p className="font-medium text-ink">{profile.employee.department_code}</p>
            </div>
            <div>
              <p className="text-muted">Telephone</p>
              <p className="font-medium text-ink">{profile.employee.telephone}</p>
            </div>
            <div>
              <p className="text-muted">Hired Date</p>
              <p className="font-medium text-ink">{String(profile.employee.hired_date ?? "").slice(0, 10)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Change Password */}
      <div className="bg-card rounded-xl border border-line p-6">
        <h3 className="font-bold text-ink mb-4">Change Password</h3>
        <form onSubmit={submitPasswordChange} className="grid gap-4 md:grid-cols-2 max-w-xl">
          <label className="block text-sm md:col-span-2">
            <span className="font-medium text-ink">Current Password</span>
            <input
              type="password"
              className={inputClass}
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ink">New Password</span>
            <input
              type="password"
              className={inputClass}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ink">Confirm New Password</span>
            <input
              type="password"
              className={inputClass}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            />
          </label>
          <div className="md:col-span-2 flex items-center gap-3">
            <button type="submit" disabled={loading} className="rounded-lg bg-accent text-accent-text px-5 py-2 font-semibold">
              {loading ? "Updating..." : "Change Password"}
            </button>
            {message && <span className="text-sm text-green-600">{message}</span>}
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </form>
      </div>
    </div>
  );
}