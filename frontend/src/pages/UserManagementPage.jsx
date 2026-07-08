import { useEffect, useState } from "react";
import api from "../api/client.js";

const ROLES = ["admin", "manager", "deputy_manager", "employee"];

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ role: "", departmentCode: "", employeeNumber: "" });
  const [loading, setLoading] = useState(true);
  const [resetUserId, setResetUserId] = useState(null);
  const [resetPassword, setResetPassword] = useState("");

  const load = async () => {
    try {
      const [usersRes, deptsRes, empsRes] = await Promise.all([
        api.get("/users"),
        api.get("/departments"),
        api.get("/employees"),
      ]);
      setUsers(usersRes.data);
      setDepartments(deptsRes.data);
      setEmployees(empsRes.data);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleEditOpen = (user) => {
    setEditingUser(user);
    setEditForm({
      role: user.role,
      departmentCode: user.department_code || "",
      employeeNumber: user.employee_number || "",
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");
    try {
      await api.put(`/users/${editingUser.id}`, editForm);
      setMessage(`User ${editingUser.username} updated successfully.`);
      setEditingUser(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user.");
    }
  };

  const handleResetPassword = async () => {
    try {
      await api.put(`/users/${resetUserId}/reset-password`, { newPassword: resetPassword });
      setMessage("Password reset successfully.");
      setResetUserId(null);
      setResetPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset.");
    }
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'manager': return 'bg-blue-100 text-blue-700';
      case 'deputy_manager': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const inputClass = "mt-1 w-full rounded-lg border border-line px-3 py-2";

  if (loading) return <div className="text-muted">Loading users...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink">User Management</h2>
        <p className="text-muted text-sm">Assign roles and departments to users without touching the database</p>
      </div>

      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-card rounded-xl border border-line overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left">
            <tr>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Linked Employee</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-line">
                <td className="px-4 py-3 font-medium">{u.username}</td>
                <td className="px-4 py-3 text-muted">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRoleBadgeColor(u.role)}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">{u.department_code || '—'}</td>
                <td className="px-4 py-3">
                  {u.first_name ? `${u.first_name} ${u.last_name}` : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditOpen(u)}
                      className="flex items-center gap-1 bg-orange-400 hover:bg-orange-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                       Edit
                    </button>
                    <button
                      onClick={() => setResetUserId(u.id)}
                      className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                       Reset
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-ink">Edit User — {editingUser.username}</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <label className="block text-sm">
                <span className="font-medium text-ink">Role</span>
                <select
                  className={inputClass}
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium text-ink">Department</span>
                <select
                  className={inputClass}
                  value={editForm.departmentCode}
                  onChange={(e) => setEditForm({ ...editForm, departmentCode: e.target.value })}
                >
                  <option value="">— No department —</option>
                  {departments.map(d => (
                    <option key={d.department_code} value={d.department_code}>
                      {d.department_code} — {d.department_name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium text-ink">Link to Employee</span>
                <select
                  className={inputClass}
                  value={editForm.employeeNumber}
                  onChange={(e) => setEditForm({ ...editForm, employeeNumber: e.target.value })}
                >
                  <option value="">— No employee linked —</option>
                  {employees.map(e => (
                    <option key={e.employee_number} value={e.employee_number}>
                      {e.employee_number} — {e.first_name} {e.last_name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex gap-3">
                <button type="submit" className="rounded-lg bg-accent text-accent-text px-5 py-2 font-semibold">
                  Save Changes
                </button>
                <button type="button" onClick={() => setEditingUser(null)} className="rounded-lg border border-line px-5 py-2 font-semibold">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-ink">Reset Password</h3>
            <label className="block text-sm">
              <span className="font-medium">New Password</span>
              <input
                type="text"
                className={inputClass}
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="e.g. newpass123"
              />
            </label>
            <div className="flex gap-3">
              <button
                onClick={handleResetPassword}
                className="rounded-lg bg-accent text-accent-text px-5 py-2 font-semibold"
              >
                Reset Password
              </button>
              <button
                onClick={() => { setResetUserId(null); setResetPassword(""); }}
                className="rounded-lg border border-line px-5 py-2 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}