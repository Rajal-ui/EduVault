import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [marks, setMarks] = useState([]);
  const [fees, setFees] = useState([]);
  const [exams, setExams] = useState([]);
  const [misc, setMisc] = useState([]);
  const [modal, setModal] = useState(null);

  function fetchAll() {
    Promise.all([
      api.get(`/students/${id}`),
      api.get(`/students/${id}/marks`),
      api.get(`/students/${id}/fees`),
      api.get(`/students/${id}/exams`),
      api.get(`/students/${id}/misc`),
    ]).then(([s, m, f, e, mi]) => {
      setStudent(s.data); setMarks(m.data);
      setFees(f.data); setExams(e.data); setMisc(mi.data);
    });
  }

  useEffect(() => { fetchAll(); }, [id]);

  if (!student) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-700 text-white px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate("/admin")} className="text-sm bg-white text-blue-700 px-3 py-1 rounded-lg font-medium">← Back</button>
        <h1 className="text-lg font-bold">{student.Name}</h1>
        <span className="text-blue-200 text-sm">{student.StudentID}</span>
      </header>

      <main className="p-6 max-w-4xl mx-auto space-y-6">

        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold text-gray-700 mb-3">Profile</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Department", student.Department],
              ["Year", `Year ${student.Year}`],
              ["Contact", student.Contact],
              ["Date of Birth", student.DateOfBirth],
              ["Address", student.Address],
              ["Parent Contact", student.ParentContact],
              ["Academic Record", student.AcademicRecord],
            ].map(([label, value]) => (
              <div key={label}><span className="text-gray-500">{label}: </span><span className="font-medium">{value || "—"}</span></div>
            ))}
            <div>
              <span className="text-gray-500">Fee Status: </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                student.FeeStatus === "Paid" ? "bg-green-100 text-green-700" :
                student.FeeStatus === "Pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                {student.FeeStatus}
              </span>
            </div>
          </div>
        </div>

        <Section title="Marksheet" onAdd={() => setModal("marks")}>
          <table className="w-full text-sm">
            <thead className="text-gray-500 text-xs uppercase border-b">
              <tr><th className="pb-2 text-left">Subject</th><th className="pb-2 text-left">Marks</th><th className="pb-2 text-left">Grade</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {marks.length === 0 && <tr><td colSpan={3} className="py-3 text-gray-400">No records</td></tr>}
              {marks.map((m) => (
                <tr key={m.Subject}>
                  <td className="py-2">{m.Subject}</td>
                  <td className="py-2">{m.Marks}</td>
                  <td className="py-2 font-semibold text-blue-600">{m.Grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="Exam Results" onAdd={() => setModal("exams")}>
          <table className="w-full text-sm">
            <thead className="text-gray-500 text-xs uppercase border-b">
              <tr><th className="pb-2 text-left">Semester</th><th className="pb-2 text-left">GPA</th><th className="pb-2 text-left">Result</th><th className="pb-2 text-left">Date</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {exams.length === 0 && <tr><td colSpan={4} className="py-3 text-gray-400">No records</td></tr>}
              {exams.map((e) => (
                <tr key={e.ExamRecordID}>
                  <td className="py-2">{e.Semester}</td>
                  <td className="py-2 font-semibold">{e.GPA}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      e.ResultStatus === "Distinction" ? "bg-purple-100 text-purple-700" :
                      e.ResultStatus === "Pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {e.ResultStatus}
                    </span>
                  </td>
                  <td className="py-2 text-gray-500">{e.DateReleased}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="Fee Receipts" onAdd={() => setModal("fees")}>
          <table className="w-full text-sm">
            <thead className="text-gray-500 text-xs uppercase border-b">
              <tr><th className="pb-2 text-left">Receipt ID</th><th className="pb-2 text-left">Type</th><th className="pb-2 text-left">Amount</th><th className="pb-2 text-left">Paid On</th><th className="pb-2 text-left">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {fees.length === 0 && <tr><td colSpan={5} className="py-3 text-gray-400">No records</td></tr>}
              {fees.map((f) => (
                <tr key={f.ReceiptID}>
                  <td className="py-2 font-mono text-gray-500">{f.ReceiptID}</td>
                  <td className="py-2">{f.FeeType}</td>
                  <td className="py-2 font-semibold">₹{f.Amount}</td>
                  <td className="py-2 text-gray-500">{f.PaidOn}</td>
                  <td className="py-2"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">{f.Status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="Miscellaneous Records" onAdd={() => setModal("misc")}>
          {misc.length === 0 && <p className="text-gray-400 text-sm">No records</p>}
          {misc.map((m) => (
            <div key={m.RecordID} className="border-l-4 border-yellow-400 pl-4 py-2 mb-3">
              <div className="flex gap-2 items-center mb-1">
                <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">{m.RecordType}</span>
                <span className="text-xs text-gray-400">{new Date(m.RecordedOn).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-700">{m.Details}</p>
              <p className="text-xs text-gray-400 mt-1">Recorded by: {m.RecordedBy}</p>
            </div>
          ))}
        </Section>
      </main>

      {/* Modals */}
      {modal === "marks"  && <AddMarkModal    studentId={id} onClose={() => { setModal(null); fetchAll(); }} />}
      {modal === "fees"   && <AddFeeModal     studentId={id} onClose={() => { setModal(null); fetchAll(); }} />}
      {modal === "exams"  && <AddExamModal    studentId={id} onClose={() => { setModal(null); fetchAll(); }} />}
      {modal === "misc"   && <AddMiscModal    studentId={id} onClose={() => { setModal(null); fetchAll(); }} />}
    </div>
  );
}

function Section({ title, onAdd, children }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-gray-700">{title}</h2>
        <button onClick={onAdd} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700">+ Add</button>
      </div>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

function useForm(initial) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  return { form, onChange, error, setError, saving, setSaving };
}

function AddMarkModal({ studentId, onClose }) {
  const { form, onChange, error, setError, saving, setSaving } = useForm({ Subject: "", Marks: "", Grade: "" });

  async function submit(e) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await api.post(`/students/${studentId}/marks`, { ...form, Marks: parseInt(form.Marks) });
      onClose();
    } catch (err) { setError(err.response?.data?.detail || "Failed"); }
    finally { setSaving(false); }
  }

  return (
    <Modal title="Add Mark" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {[["Subject", "Subject", "text"], ["Marks", "Marks (0–100)", "number"], ["Grade", "Grade (A/B/C…)", "text"]].map(([name, label, type]) => (
          <div key={name}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <input type={type} name={name} value={form[name]} onChange={onChange} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        ))}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-end pt-1">
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Saving..." : "Add Mark"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AddFeeModal({ studentId, onClose }) {
  const { form, onChange, error, setError, saving, setSaving } = useForm({
    ReceiptID: "", FeeType: "", Amount: "", PaidOn: "", TransactionDetails: "", Status: "Paid"
  });

  async function submit(e) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await api.post(`/students/${studentId}/fees`, form);
      onClose();
    } catch (err) { setError(err.response?.data?.detail || "Failed"); }
    finally { setSaving(false); }
  }

  return (
    <Modal title="Add Fee Receipt" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {[["ReceiptID","Receipt ID","text"],["FeeType","Fee Type","text"],["Amount","Amount (₹)","number"],["PaidOn","Paid On","date"],["TransactionDetails","Transaction Details","text"]].map(([name, label, type]) => (
          <div key={name}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <input type={type} name={name} value={form[name]} onChange={onChange}
              required={name !== "TransactionDetails"}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        ))}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <select name="Status" value={form.Status} onChange={onChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {["Paid","Refunded","Cancelled"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-end pt-1">
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Saving..." : "Add Receipt"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AddExamModal({ studentId, onClose }) {
  const { form, onChange, error, setError, saving, setSaving } = useForm({
    Semester: "", GPA: "", ResultStatus: "Pass", DateReleased: ""
  });

  async function submit(e) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await api.post(`/students/exams`, { StudentID: studentId, ...form, GPA: parseFloat(form.GPA) });
      onClose();
    } catch (err) { setError(err.response?.data?.detail || "Failed"); }
    finally { setSaving(false); }
  }

  return (
    <Modal title="Add Exam Result" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {[["Semester","Semester (e.g. Semester 4)","text"],["GPA","GPA (e.g. 8.50)","number"],["DateReleased","Date Released","date"]].map(([name, label, type]) => (
          <div key={name}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <input type={type} name={name} value={form[name]} onChange={onChange} required step={name === "GPA" ? "0.01" : undefined}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        ))}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Result Status</label>
          <select name="ResultStatus" value={form.ResultStatus} onChange={onChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {["Pass","Fail","ATKT","Distinction"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-end pt-1">
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Saving..." : "Add Result"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AddMiscModal({ studentId, onClose }) {
  const adminId = (() => {
    try { return JSON.parse(atob(localStorage.getItem("token").split(".")[1])).sub; } catch { return "ADM001"; }
  })();
  const { form, onChange, error, setError, saving, setSaving } = useForm({
    RecordType: "General", Details: ""
  });

  async function submit(e) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await api.post(`/students/misc`, {
        StudentID: studentId, ...form,
        RecordedBy: adminId,
        RecordedOn: new Date().toISOString()
      });
      onClose();
    } catch (err) { setError(err.response?.data?.detail || "Failed"); }
    finally { setSaving(false); }
  }

  return (
    <Modal title="Add Miscellaneous Record" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Record Type</label>
          <select name="RecordType" value={form.RecordType} onChange={onChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {["General","Warning","Attendance","Leave"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Details</label>
          <textarea name="Details" value={form.Details} onChange={onChange} rows={3} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-end pt-1">
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Saving..." : "Add Record"}
          </button>
        </div>
      </form>
    </Modal>
  );
}