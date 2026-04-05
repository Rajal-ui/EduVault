import { useEffect, useState } from "react";
import api from "../api/axios";

/**
 * Admin-only password reset. POST /auth/reset-password
 * - With lockUserFields + userId + role: reset a known row (e.g. student from table).
 * - Without lock: enter any user id and role (admin, faculty, hod, student).
 */
export default function ResetPasswordModal({
  onClose,
  userId: initialUserId = "",
  role: initialRole = "student",
  displayLabel = null,
  lockUserFields = false,
}) {
  const [userId, setUserId] = useState(initialUserId);
  const [role, setRole] = useState(initialRole);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUserId(initialUserId);
    setRole(initialRole);
    setPassword("");
    setConfirm("");
    setError("");
  }, [initialUserId, initialRole]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const id = userId.trim();
    if (!id) {
      setError("Enter a user ID.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/auth/reset-password", {
        user_id: id,
        role,
        new_password: password,
      });
      onClose();
    } catch (err) {
      const d = err.response?.data?.detail;
      setError(typeof d === "string" ? d : d?.[0]?.msg || "Reset failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {displayLabel && (
        <p className="text-sm text-gray-600">
          New password for <span className="font-semibold text-gray-800">{displayLabel}</span>
        </p>
      )}

      {!lockUserFields && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">User ID</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. ADM001, FAC001, STU001"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Account type</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="hod">Head of Department (HOD)</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">New password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Confirm password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Reset password"}
        </button>
      </div>
    </form>
  );
}
