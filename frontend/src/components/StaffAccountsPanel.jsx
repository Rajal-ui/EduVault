import { useCallback, useEffect, useState } from "react";
import api from "../api/axios";
import ResetPasswordModal from "./ResetPasswordModal";
import { Shield } from "lucide-react";

const emptyAdmin = { AdminID: "", Name: "", Department: "", Contact: "", Password: "" };
const emptyFaculty = { FacultyID: "", Name: "", Department: "", Role: "faculty", Contact: "", Password: "" };

function PanelModal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

export default function StaffAccountsPanel() {
  const currentUserId = typeof localStorage !== "undefined" ? localStorage.getItem("user_id") : null;

  const [admins, setAdmins] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);

  const [adminForm, setAdminForm] = useState(emptyAdmin);
  const [facultyForm, setFacultyForm] = useState(emptyFaculty);
  const [showAdminAdd, setShowAdminAdd] = useState(false);
  const [showAdminEdit, setShowAdminEdit] = useState(false);
  const [showFacultyAdd, setShowFacultyAdd] = useState(false);
  const [showFacultyEdit, setShowFacultyEdit] = useState(false);
  const [delAdmin, setDelAdmin] = useState(null);
  const [delFaculty, setDelFaculty] = useState(null);
  const [resetAdmin, setResetAdmin] = useState(null);
  const [resetFaculty, setResetFaculty] = useState(null);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ar, fr] = await Promise.all([api.get("/management/admins"), api.get("/management/faculty")]);
      setAdmins(ar.data);
      setFaculty(fr.data);
    } catch {
      alert("Failed to load staff accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function onAdminChange(e) {
    setAdminForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }
  function onFacultyChange(e) {
    setFacultyForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function submitAdminAdd(e) {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      await api.post("/management/admins", adminForm);
      setShowAdminAdd(false);
      setAdminForm(emptyAdmin);
      load();
    } catch (er) {
      setErr(er.response?.data?.detail || "Failed to add admin");
    } finally {
      setSaving(false);
    }
  }

  async function submitAdminEdit(e) {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      const { AdminID, Password: _p, ...rest } = adminForm;
      await api.put(`/management/admins/${AdminID}`, rest);
      setShowAdminEdit(false);
      load();
    } catch (er) {
      setErr(er.response?.data?.detail || "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function submitFacultyAdd(e) {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      await api.post("/management/faculty", facultyForm);
      setShowFacultyAdd(false);
      setFacultyForm(emptyFaculty);
      load();
    } catch (er) {
      setErr(er.response?.data?.detail || "Failed to add faculty");
    } finally {
      setSaving(false);
    }
  }

  async function submitFacultyEdit(e) {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      const { FacultyID, Password, ...rest } = facultyForm;
      const payload = { ...rest };
      await api.put(`/management/faculty/${FacultyID}`, payload);
      setShowFacultyEdit(false);
      load();
    } catch (er) {
      setErr(er.response?.data?.detail || "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function doDeleteAdmin() {
    try {
      await api.delete(`/management/admins/${delAdmin.AdminID}`);
      setDelAdmin(null);
      load();
    } catch (er) {
      alert(er.response?.data?.detail || "Delete failed");
    }
  }

  async function doDeleteFaculty() {
    try {
      await api.delete(`/management/faculty/${delFaculty.FacultyID}`);
      setDelFaculty(null);
      load();
    } catch (er) {
      alert(er.response?.data?.detail || "Delete failed");
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <Shield size={18} className="text-blue-600" />
        <span>Manage admin and faculty logins. You can edit your own admin profile here; use &quot;Reset Pwd&quot; to change any password.</span>
      </div>

      <section>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Administrators</h2>
          <button
            type="button"
            onClick={() => { setAdminForm(emptyAdmin); setErr(""); setShowAdminAdd(true); }}
            className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-700"
          >
            + Add admin
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700" /></div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50 text-gray-400 uppercase text-[10px] font-black tracking-widest border-b">
                <tr>
                  <th className="px-6 py-3 text-left">Admin ID</th>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Department</th>
                  <th className="px-6 py-3 text-left">Contact</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {admins.map((a) => (
                  <tr key={a.AdminID} className="hover:bg-blue-50/30 group">
                    <td className="px-6 py-3 font-mono text-xs text-gray-500">
                      {a.AdminID}
                      {currentUserId === a.AdminID && (
                        <span className="ml-2 text-[10px] font-bold uppercase text-blue-600">You</span>
                      )}
                    </td>
                    <td className="px-6 py-3 font-semibold text-gray-800">{a.Name}</td>
                    <td className="px-6 py-3 text-gray-600">{a.Department || "—"}</td>
                    <td className="px-6 py-3 text-gray-600">{a.Contact || "—"}</td>
                    <td className="px-6 py-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-2 justify-end flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            setAdminForm({
                              AdminID: a.AdminID,
                              Name: a.Name,
                              Department: a.Department || "",
                              Contact: a.Contact || "",
                              Password: "",
                            });
                            setErr("");
                            setShowAdminEdit(true);
                          }}
                          className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-bold text-gray-600 hover:border-blue-300"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setResetAdmin(a)}
                          className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-bold text-amber-700 hover:border-amber-300"
                        >
                          Reset Pwd
                        </button>
                        <button
                          type="button"
                          onClick={() => setDelAdmin(a)}
                          className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-bold hover:bg-red-100"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Faculty &amp; HOD</h2>
          <button
            type="button"
            onClick={() => { setFacultyForm(emptyFaculty); setErr(""); setShowFacultyAdd(true); }}
            className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700"
          >
            + Add faculty
          </button>
        </div>
        {loading ? null : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50 text-gray-400 uppercase text-[10px] font-black tracking-widest border-b">
                <tr>
                  <th className="px-6 py-3 text-left">Faculty ID</th>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Department</th>
                  <th className="px-6 py-3 text-left">Role</th>
                  <th className="px-6 py-3 text-left">Contact</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {faculty.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No faculty accounts yet.</td></tr>
                ) : (
                  faculty.map((f) => (
                    <tr key={f.FacultyID} className="hover:bg-indigo-50/20 group">
                      <td className="px-6 py-3 font-mono text-xs text-gray-500">{f.FacultyID}</td>
                      <td className="px-6 py-3 font-semibold text-gray-800">{f.Name}</td>
                      <td className="px-6 py-3 text-gray-600">{f.Department}</td>
                      <td className="px-6 py-3">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-gray-100 px-2 py-1 rounded text-gray-600">{f.Role}</span>
                      </td>
                      <td className="px-6 py-3 text-gray-600">{f.Contact || "—"}</td>
                      <td className="px-6 py-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-2 justify-end flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setFacultyForm({
                                FacultyID: f.FacultyID,
                                Name: f.Name,
                                Department: f.Department,
                                Role: f.Role,
                                Contact: f.Contact || "",
                                Password: "",
                              });
                              setErr("");
                              setShowFacultyEdit(true);
                            }}
                            className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-bold text-gray-600 hover:border-indigo-300"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setResetFaculty(f)}
                            className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-bold text-amber-700 hover:border-amber-300"
                          >
                            Reset Pwd
                          </button>
                          <button
                            type="button"
                            onClick={() => setDelFaculty(f)}
                            className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-bold hover:bg-red-100"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showAdminAdd && (
        <PanelModal title="Add administrator" onClose={() => setShowAdminAdd(false)}>
          <form onSubmit={submitAdminAdd} className="space-y-3">
            {["AdminID", "Name", "Department", "Contact"].map((name) => (
              <div key={name}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{name === "AdminID" ? "Admin ID" : name}</label>
                <input name={name} value={adminForm[name]} onChange={onAdminChange} required={name === "AdminID" || name === "Name"}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
              <input type="password" name="Password" value={adminForm.Password} onChange={onAdminChange} required minLength={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            {err && <p className="text-red-500 text-sm">{err}</p>}
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50">{saving ? "Saving…" : "Create"}</button>
            </div>
          </form>
        </PanelModal>
      )}

      {showAdminEdit && (
        <PanelModal title="Edit administrator" onClose={() => setShowAdminEdit(false)}>
          <form onSubmit={submitAdminEdit} className="space-y-3">
            <p className="text-sm text-gray-600">ID: <span className="font-mono font-semibold">{adminForm.AdminID}</span></p>
            {["Name", "Department", "Contact"].map((name) => (
              <div key={name}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{name}</label>
                <input name={name} value={adminForm[name] || ""} onChange={onAdminChange} required={name === "Name"}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
            {err && <p className="text-red-500 text-sm">{err}</p>}
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
            </div>
          </form>
        </PanelModal>
      )}

      {showFacultyAdd && (
        <PanelModal title="Add faculty" onClose={() => setShowFacultyAdd(false)}>
          <form onSubmit={submitFacultyAdd} className="space-y-3">
            {["FacultyID", "Name", "Department"].map((name) => (
              <div key={name}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{name === "FacultyID" ? "Faculty ID" : name}</label>
                <input name={name} value={facultyForm[name]} onChange={onFacultyChange} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
              <select name="Role" value={facultyForm.Role} onChange={onFacultyChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="faculty">Faculty</option>
                <option value="hod">Head of Department (HOD)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contact</label>
              <input name="Contact" value={facultyForm.Contact} onChange={onFacultyChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
              <input type="password" name="Password" value={facultyForm.Password} onChange={onFacultyChange} required minLength={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            {err && <p className="text-red-500 text-sm">{err}</p>}
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg disabled:opacity-50">{saving ? "Saving…" : "Create"}</button>
            </div>
          </form>
        </PanelModal>
      )}

      {showFacultyEdit && (
        <PanelModal title="Edit faculty" onClose={() => setShowFacultyEdit(false)}>
          <form onSubmit={submitFacultyEdit} className="space-y-3">
            <p className="text-sm text-gray-600">ID: <span className="font-mono font-semibold">{facultyForm.FacultyID}</span></p>
            {["Name", "Department"].map((name) => (
              <div key={name}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{name}</label>
                <input name={name} value={facultyForm[name] || ""} onChange={onFacultyChange} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
              <select name="Role" value={facultyForm.Role} onChange={onFacultyChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="faculty">Faculty</option>
                <option value="hod">Head of Department (HOD)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contact</label>
              <input name="Contact" value={facultyForm.Contact || ""} onChange={onFacultyChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <p className="text-xs text-gray-500">Use &quot;Reset Pwd&quot; on the row to change this account&apos;s password.</p>
            {err && <p className="text-red-500 text-sm">{err}</p>}
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
            </div>
          </form>
        </PanelModal>
      )}

      {resetAdmin && (
        <PanelModal title="Reset admin password" onClose={() => setResetAdmin(null)}>
          <ResetPasswordModal
            lockUserFields
            userId={resetAdmin.AdminID}
            role="admin"
            displayLabel={`${resetAdmin.Name} (${resetAdmin.AdminID})`}
            onClose={() => { setResetAdmin(null); load(); }}
          />
        </PanelModal>
      )}

      {resetFaculty && (
        <PanelModal title="Reset faculty password" onClose={() => setResetFaculty(null)}>
          <ResetPasswordModal
            lockUserFields
            userId={resetFaculty.FacultyID}
            role={resetFaculty.Role === "hod" ? "hod" : "faculty"}
            displayLabel={`${resetFaculty.Name} (${resetFaculty.FacultyID})`}
            onClose={() => { setResetFaculty(null); load(); }}
          />
        </PanelModal>
      )}

      {delAdmin && (
        <PanelModal title="Remove administrator" onClose={() => setDelAdmin(null)}>
          <p className="text-gray-600 mb-4">
            Remove <strong>{delAdmin.Name}</strong> ({delAdmin.AdminID})? They will no longer be able to sign in.
            {currentUserId === delAdmin.AdminID && (
              <span className="block mt-2 text-amber-800 text-sm">This is your account. You need at least one other admin before you can remove yourself.</span>
            )}
          </p>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setDelAdmin(null)} className="px-4 py-2 text-sm border rounded-lg">Cancel</button>
            <button type="button" onClick={doDeleteAdmin} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg">Delete</button>
          </div>
        </PanelModal>
      )}

      {delFaculty && (
        <PanelModal title="Remove faculty" onClose={() => setDelFaculty(null)}>
          <p className="text-gray-600 mb-4">
            Remove <strong>{delFaculty.Name}</strong> ({delFaculty.FacultyID})? They will no longer be able to sign in.
          </p>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setDelFaculty(null)} className="px-4 py-2 text-sm border rounded-lg">Cancel</button>
            <button type="button" onClick={doDeleteFaculty} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg">Delete</button>
          </div>
        </PanelModal>
      )}
    </div>
  );
}
