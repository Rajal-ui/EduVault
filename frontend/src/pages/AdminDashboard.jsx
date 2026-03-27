import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const emptyForm = {
  StudentID: "", Name: "", Department: "", Year: "",
  Contact: "", AcademicRecord: "", FeeStatus: "Pending",
  Password: "", DateOfBirth: "", Address: "", ParentContact: "",
};

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const name = localStorage.getItem("name");
  const navigate = useNavigate();

  function fetchStudents() {
    api.get("/students/").then((res) => setStudents(res.data)).finally(() => setLoading(false));
  }

  useEffect(() => { fetchStudents(); }, []);

  function logout() { localStorage.clear(); navigate("/"); }

  function openAdd() { setForm(emptyForm); setError(""); setShowAdd(true); }

  function openEdit(s) {
    setForm({
      StudentID: s.StudentID, Name: s.Name, Department: s.Department,
      Year: s.Year, Contact: s.Contact || "", AcademicRecord: s.AcademicRecord || "",
      FeeStatus: s.FeeStatus, Password: "", DateOfBirth: s.DateOfBirth || "",
      Address: s.Address || "", ParentContact: s.ParentContact || "",
    });
    setError(""); setShowEdit(true);
  }

  function handleChange(e) { setForm((f) => ({ ...f, [e.target.name]: e.target.value })); }

  async function handleAdd(e) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await api.post("/students/", { ...form, Year: parseInt(form.Year) });
      setShowAdd(false); fetchStudents();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to add student");
    } finally { setSaving(false); }
  }

  async function handleEdit(e) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const payload = { ...form, Year: parseInt(form.Year) };
      delete payload.StudentID; delete payload.Password;
      await api.put(`/students/${form.StudentID}`, payload);
      setShowEdit(false); fetchStudents();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update student");
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/students/${id}`);
      setShowDelete(null); fetchStudents();
    } catch { alert("Failed to delete student"); }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-bold">EduVault — Admin</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">{name}</span>
          <button onClick={logout} className="text-sm bg-white text-blue-700 px-3 py-1 rounded-lg font-medium">Logout</button>
        </div>
      </header>

      <main className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">All Students</h2>
          <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            + Add Student
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Department</th>
                  <th className="px-4 py-3 text-left">Year</th>
                  <th className="px-4 py-3 text-left">Fee Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s) => (
                  <tr key={s.StudentID} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-gray-500">{s.StudentID}</td>
                    <td
                      className="px-4 py-3 font-medium text-blue-600 cursor-pointer hover:underline"
                      onClick={() => navigate(`/admin/student/${s.StudentID}`)}
                    >{s.Name}</td>
                    <td className="px-4 py-3 text-gray-600">{s.Department}</td>
                    <td className="px-4 py-3 text-gray-600">Year {s.Year}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        s.FeeStatus === "Paid" ? "bg-green-100 text-green-700" :
                        s.FeeStatus === "Pending" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"}`}>{s.FeeStatus}</span>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => openEdit(s)} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg">Edit</button>
                      <button onClick={() => setShowDelete(s)} className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded-lg">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      
      {showAdd && (
        <Modal title="Add Student" onClose={() => setShowAdd(false)}>
          <StudentForm form={form} onChange={handleChange} onSubmit={handleAdd} error={error} saving={saving} isEdit={false} />
        </Modal>
      )}

      
      {showEdit && (
        <Modal title="Edit Student" onClose={() => setShowEdit(false)}>
          <StudentForm form={form} onChange={handleChange} onSubmit={handleEdit} error={error} saving={saving} isEdit={true} />
        </Modal>
      )}

      
      {showDelete && (
        <Modal title="Delete Student" onClose={() => setShowDelete(null)}>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete <strong>{showDelete.Name}</strong>? This will also remove all their records.
          </p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowDelete(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={() => handleDelete(showDelete.StudentID)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

function StudentForm({ form, onChange, onSubmit, error, saving, isEdit }) {
  const fields = [
    { name: "StudentID", label: "Student ID", disabled: isEdit },
    { name: "Name", label: "Full Name" },
    { name: "Department", label: "Department" },
    { name: "Year", label: "Year (1-4)", type: "number" },
    { name: "Contact", label: "Contact Email" },
    { name: "DateOfBirth", label: "Date of Birth", type: "date" },
    { name: "Address", label: "Address" },
    { name: "ParentContact", label: "Parent Contact" },
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {fields.map((f) => (
        <div key={f.name}>
          <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
          <input
            type={f.type || "text"}
            name={f.name}
            value={form[f.name]}
            onChange={onChange}
            disabled={f.disabled}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
          />
        </div>
      ))}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Fee Status</label>
        <select name="FeeStatus" value={form.FeeStatus} onChange={onChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {["Paid", "Pending", "Overdue"].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {!isEdit && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
          <input type="password" name="Password" value={form.Password} onChange={onChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Academic Record</label>
        <textarea name="AcademicRecord" value={form.AcademicRecord} onChange={onChange} rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-3 justify-end pt-2">
        <button type="submit" disabled={saving}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Student"}
        </button>
      </div>
    </form>
  );
}