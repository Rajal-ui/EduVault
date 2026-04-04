import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { StudentForm } from "./AdminDashboard";

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [marks, setMarks] = useState([]);
  const [fees, setFees] = useState([]);
  const [exams, setExams] = useState([]);
  const [misc, setMisc] = useState([]);
  const [modal, setModal] = useState(null);
  const [editData, setEditData] = useState(null);
  
  // States for Editing Profile
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [saving, setSaving] = useState(false);

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

  async function handleAIScan(e) {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setIsScanning(true);
    try {
      const res = await api.post("/ai/parse-receipt", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setEditData(res.data);
      setModal("aiVerify");
    } catch (err) {
      alert("AI Scan failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsScanning(false);
      e.target.value = "";
    }
  }

  async function handleAIMarksheetScan(e) {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setIsScanning(true);
    try {
      const res = await api.post("/ai/parse-marksheet", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setEditData(res.data);
      setModal("aiVerifyMarks");
    } catch (err) {
      alert("Marksheet Scan failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsScanning(false);
      e.target.value = "";
    }
  }

  useEffect(() => { fetchAll(); }, [id]);

  if (!student) return <div className="p-8 text-gray-500">Loading...</div>;

  function openEdit() {
    setForm({
      StudentID: student.StudentID, Name: student.Name, Department: student.Department,
      Year: student.Year, Contact: student.Contact || "", StudentPhone: student.StudentPhone || "", AcademicRecord: student.AcademicRecord || "",
      FeeStatus: student.FeeStatus, Password: "", DateOfBirth: student.DateOfBirth || "",
      Address: student.Address || "", ParentContact: student.ParentContact || "",
    });
    setError("");
    setModal("editProfile");
  }

  function handleChange(e) { setForm((f) => ({ ...f, [e.target.name]: e.target.value })); }

  async function handleEdit(e) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const payload = { ...form, Year: parseInt(form.Year) };
      delete payload.StudentID; delete payload.Password;
      await api.put(`/students/${student.StudentID}`, payload);
      setModal(null);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update student");
    } finally { setSaving(false); }
  }

  async function genericDelete(url, confirmMsg) {
    if (!window.confirm(confirmMsg || "Are you sure?")) return;
    try {
      await api.delete(url);
      fetchAll();
    } catch (err) { alert("Delete failed"); }
  }

  // Grouping marks by semester
  const semesters = [...new Set([
    ...(marks?.map(m => m.Semester) || []),
    ...(exams?.map(e => e.Semester) || [])
  ])].sort();


  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-700 text-white px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate("/admin")} className="text-sm bg-white text-blue-700 px-3 py-1 rounded-lg font-medium">← Back</button>
        <h1 className="text-lg font-bold">{student.Name}</h1>
        <span className="text-blue-200 text-sm">{student.StudentID}</span>
      </header>

      <main className="p-6 max-w-4xl mx-auto space-y-6">

        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-gray-700">Profile</h2>
            <button onClick={openEdit} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg border font-medium">Edit Profile</button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Department", student.Department],
              ["Year", `Year ${student.Year}`],
              ["Contact", student.Contact],
              ["Student Phone", student.StudentPhone],
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

        <Section title="Academic Records (Semester-wise)" onAdd={() => setModal("exams")}>
          {semesters.length === 0 && <p className="text-gray-400 text-sm py-2">No academic records found.</p>}
          <div className="space-y-6">
            {semesters.map(sem => {
              const semMarks = marks.filter(m => m.Semester === sem);
              const semExam = exams.find(e => e.Semester === sem);
              
              return (
                <div key={sem} className="border rounded-xl p-4 bg-gray-50/50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-blue-800">{sem}</h3>
                    <div className="flex gap-2">
                       <label className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold uppercase tracking-wider cursor-pointer hover:bg-purple-200">
                         {isScanning ? "..." : "✨ Scan Marksheet"}
                         <input type="file" accept="image/*" className="hidden" onChange={handleAIMarksheetScan} disabled={isScanning} />
                       </label>
                       <button onClick={() => setModal("marks")} className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold uppercase tracking-wider">+ Add Subject</button>
                       {semExam && (
                         <>
                           <button onClick={() => {setEditData(semExam); setModal("editExam")}} className="text-[10px] bg-gray-200 text-gray-700 px-2 py-1 rounded font-bold uppercase tracking-wider text-xs">Edit Result</button>
                           <button onClick={() => genericDelete(`/students/exams/${semExam.ExamRecordID}`, `Delete result for ${sem}?`)} className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded font-bold uppercase tracking-wider">Delete</button>
                         </>
                       )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <table className="w-full text-sm bg-white rounded-lg shadow-sm overflow-hidden">
                        <thead className="bg-gray-100 text-gray-500 text-[10px] uppercase">
                          <tr><th className="px-3 py-2 text-left">Subject</th><th className="px-3 py-2 text-left">Marks</th><th className="px-3 py-2 text-left">Grade</th><th className="px-3 py-2 text-right">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {semMarks.map(m => (
                            <tr key={m.Subject}>
                              <td className="px-3 py-2">{m.Subject}</td>
                              <td className="px-3 py-2 font-medium">{m.Marks}</td>
                              <td className="px-3 py-2 font-bold text-blue-600">{m.Grade}</td>
                              <td className="px-3 py-2 text-right flex justify-end gap-2">
                                <button onClick={() => {setEditData(m); setModal("editMark")}} className="text-gray-400 hover:text-blue-600">✎</button>
                                <button onClick={() => genericDelete(`/students/${id}/marks/${m.Semester}/${m.Subject}`, `Delete marks for ${m.Subject}?`)} className="text-gray-400 hover:text-red-600">✕</button>
                              </td>
                            </tr>
                          ))}
                          {semMarks.length === 0 && <tr><td colSpan={4} className="px-3 py-4 text-center text-gray-400 text-xs italic">No subject marks added yet</td></tr>}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100 flex flex-col justify-center">
                      <p className="text-[10px] uppercase text-gray-400 font-bold mb-2">Overall Result</p>
                      {semExam ? (
                        <div className="space-y-2">
                          <div className="flex justify-between items-end">
                            <span className="text-xs text-gray-500">GPA</span>
                            <span className="text-2xl font-black text-blue-700">{semExam.GPA}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Status</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              semExam.ResultStatus === "Distinction" ? "bg-purple-100 text-purple-700" :
                              semExam.ResultStatus === "Pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                              {semExam.ResultStatus}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 text-right mt-2 italic">Released: {semExam.DateReleased}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic text-center py-4">Overall result not yet declared</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>


        <Section 
          title="Fee Receipts" 
          onAdd={() => setModal("fees")}
          extraAction={
            <label className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold uppercase tracking-wider cursor-pointer hover:bg-purple-200">
              {isScanning ? "Scanning..." : "✨ Scan with AI"}
              <input type="file" accept="image/*" className="hidden" onChange={handleAIScan} disabled={isScanning} />
            </label>
          }
        >
          <table className="w-full text-sm">
            <thead className="text-gray-500 text-xs uppercase border-b">
              <tr><th className="pb-2 text-left">Receipt ID</th><th className="pb-2 text-left">Type</th><th className="pb-2 text-left">Amount</th><th className="pb-2 text-left">Paid On</th><th className="pb-2 text-left">Status</th><th className="pb-2 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {fees.length === 0 && <tr><td colSpan={6} className="py-3 text-gray-400">No records</td></tr>}
              {fees.map((f) => (
                <tr key={f.ReceiptID}>
                  <td className="py-2 font-mono text-gray-500 text-xs">{f.ReceiptID}</td>
                  <td className="py-2">{f.FeeType}</td>
                  <td className="py-2 font-semibold">₹{f.Amount}</td>
                  <td className="py-2 text-gray-500">{f.PaidOn}</td>
                  <td className="py-2"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">{f.Status}</span></td>
                  <td className="py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => {setEditData(f); setModal("editFee")}} className="text-gray-400 hover:text-blue-600">✎</button>
                      <button onClick={() => genericDelete(`/students/fees/${f.ReceiptID}`, `Delete receipt ${f.ReceiptID}?`)} className="text-gray-400 hover:text-red-600">✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="Miscellaneous Records" onAdd={() => setModal("misc")}>
          {misc.length === 0 && <p className="text-gray-400 text-sm">No records</p>}
          {misc.map((m) => (
            <div key={m.RecordID} className="border-l-4 border-yellow-400 pl-4 py-2 mb-3 relative group">
              <div className="absolute right-2 top-2 hidden group-hover:flex gap-2">
                <button onClick={() => {setEditData(m); setModal("editMisc")}} className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-blue-50 text-blue-600">Edit</button>
                <button onClick={() => genericDelete(`/students/misc/${m.RecordID}`, "Delete this record?")} className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-red-50 text-red-600">Delete</button>
              </div>
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

      {/* Edit Modals */}
      {modal === "aiVerify" && (
        <Modal title="Verify AI Extracted Data" onClose={() => setModal(null)}>
          <AIReceiptModal studentId={id} data={editData} onClose={() => { setModal(null); fetchAll(); }} />
        </Modal>
      )}
      {modal === "aiVerifyMarks" && (
        <Modal title="Verify Extracted Marksheet" onClose={() => setModal(null)}>
          <AIMarksheetVerifyModal studentId={id} data={editData} onClose={() => { setModal(null); fetchAll(); }} />
        </Modal>
      )}
      {modal === "editMark" && <EditMarkModal studentId={id} data={editData} onClose={() => { setModal(null); fetchAll(); }} />}
      {modal === "editExam" && <EditExamModal data={editData} onClose={() => { setModal(null); fetchAll(); }} />}
      {modal === "editFee"  && <EditFeeModal  data={editData} onClose={() => { setModal(null); fetchAll(); }} />}
      {modal === "editMisc" && <EditMiscModal data={editData} onClose={() => { setModal(null); fetchAll(); }} />}
      
      {modal === "editProfile" && (
        <Modal title="Edit Student Profile" onClose={() => setModal(null)}>
          <StudentForm form={form} onChange={handleChange} onSubmit={handleEdit} saving={saving} error={error} isEdit />
        </Modal>
      )}
      
      {/* Add Modals */}
      {modal === "marks"  && <AddMarkModal    studentId={id} onClose={() => { setModal(null); fetchAll(); }} />}
      {modal === "fees"   && <AddFeeModal     studentId={id} onClose={() => { setModal(null); fetchAll(); }} />}
      {modal === "exams"  && <AddExamModal    studentId={id} onClose={() => { setModal(null); fetchAll(); }} />}
      {modal === "misc"   && <AddMiscModal    studentId={id} onClose={() => { setModal(null); fetchAll(); }} />}
    </div>
  );
}


function Section({ title, onAdd, extraAction, children }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-gray-700">{title}</h2>
        <div className="flex gap-2 items-center">
           {extraAction}
           <button onClick={onAdd} className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700">+ Add</button>
        </div>
      </div>
      {children}
    </div>
  );
}

function AIReceiptModal({ studentId, data, onClose }) {
  const { form, onChange, error, setError, saving, setSaving } = useForm({
    ReceiptID: data?.ReceiptID || "",
    FeeType: data?.FeeType || "",
    Amount: data?.Amount || "",
    PaidOn: data?.PaidOn || "",
    TransactionDetails: data?.TransactionDetails || "",
    Status: data?.Status || "Paid"
  });

  async function submit(e) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await api.post(`/students/${studentId}/fees`, form);
      onClose();
    } catch (err) { setError(err.response?.data?.detail || "Failed to add scanned receipt"); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs italic text-purple-600 font-medium">✨ AI automatically extracted these details. Please verify and confirm.</p>
      <form onSubmit={submit} className="space-y-3">
        {[["ReceiptID","Receipt ID","text"],["FeeType","Fee Type","text"],["Amount","Amount (₹)","number"],["PaidOn","Paid On","date"],["TransactionDetails","Transaction Details","text"]].map(([name, label, type]) => (
          <div key={name}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <input type={type} name={name} value={form[name] || ""} onChange={onChange}
              required={name !== "TransactionDetails"}
              className="w-full border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
        ))}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-between pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:underline">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
            {saving ? "Confirming..." : "Confirm & Save"}
          </button>
        </div>
      </form>
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

function AIMarksheetVerifyModal({ studentId, data, onClose }) {
  const [semester, setSemester] = useState(data?.Semester || "Semester 1");
  const [subjects, setSubjects] = useState(data?.Subjects || []);
  const [overall, setOverall] = useState(data?.Overall || { GPA: "", ResultStatus: "Pass", DateReleased: new Date().toISOString().split('T')[0] });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true); setError("");
    try {
      const payload = {
        marks: subjects.map(s => ({ ...s, Semester: semester })),
        overall_result: overall.GPA ? { ...overall, Semester: semester, StudentID: studentId } : null
      };
      await api.post(`/students/${studentId}/marks/bulk`, payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save results");
    } finally {
      setSaving(false);
    }
  }

  const updateSubject = (idx, field, val) => {
    const next = [...subjects];
    next[idx][field] = field === "Marks" ? parseInt(val) : val;
    setSubjects(next);
  };

  return (
    <div className="space-y-4">
      <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
        <label className="block text-xs font-bold text-purple-700 uppercase mb-1">Target Semester</label>
        <input value={semester} onChange={e => setSemester(e.target.value)} className="w-full bg-white border border-purple-200 px-3 py-1.5 rounded-md text-sm focus:ring-2 focus:ring-purple-500" />
      </div>

      <div className="max-h-60 overflow-y-auto border rounded-xl">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500 uppercase sticky top-0">
            <tr><th className="px-3 py-2 text-left">Subject</th><th className="px-3 py-2 text-left w-16">Marks</th><th className="px-3 py-2 text-left w-16">Grade</th></tr>
          </thead>
          <tbody className="divide-y">
            {subjects.map((s, idx) => (
              <tr key={idx}>
                <td className="px-3 py-1"><input value={s.Subject} onChange={e => updateSubject(idx, "Subject", e.target.value)} className="w-full border-none focus:ring-0 p-0 h-7" /></td>
                <td className="px-3 py-1"><input value={s.Marks} type="number" onChange={e => updateSubject(idx, "Marks", e.target.value)} className="w-full border-none focus:ring-0 p-0 h-7" /></td>
                <td className="px-3 py-1"><input value={s.Grade} onChange={e => updateSubject(idx, "Grade", e.target.value)} className="w-full border-none focus:ring-0 p-0 h-7" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-3 gap-3 border p-3 rounded-xl bg-gray-50">
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase">GPA</label>
          <input type="number" step="0.01" value={overall.GPA} onChange={e => setOverall({...overall, GPA: e.target.value})} className="w-full bg-white border rounded p-1 text-xs" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase">Status</label>
          <select value={overall.ResultStatus} onChange={e => setOverall({...overall, ResultStatus: e.target.value})} className="w-full bg-white border rounded p-1 text-xs">
            {["Pass","Fail","ATKT","Distinction"].map(v => <option key={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase">Date</label>
          <input type="date" value={overall.DateReleased} onChange={e => setOverall({...overall, DateReleased: e.target.value})} className="w-full bg-white border rounded p-1 text-xs" />
        </div>
      </div>
      
      {error && <p className="text-red-500 text-xs">{error}</p>}

      <div className="flex justify-between pt-2">
        <button onClick={onClose} className="text-gray-500 text-sm hover:underline">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-purple-700 disabled:opacity-50">
          {saving ? "Saving..." : "Confirm & Save Results"}
        </button>
      </div>
    </div>
  );
}

function AddMarkModal({ studentId, onClose }) {
  const { form, onChange, error, setError, saving, setSaving } = useForm({ Semester: "Semester 1", Subject: "", Marks: "", Grade: "" });

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
        {[["Semester", "Semester", "text"], ["Subject", "Subject", "text"], ["Marks", "Marks (0–100)", "number"], ["Grade", "Grade (A/B/C…)", "text"]].map(([name, label, type]) => (
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

function EditMarkModal({ studentId, data, onClose }) {
  const { form, onChange, error, setError, saving, setSaving } = useForm({ Marks: data.Marks, Grade: data.Grade });

  async function submit(e) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await api.put(`/students/${studentId}/marks/${data.Semester}/${data.Subject}`, { ...form, Marks: parseInt(form.Marks) });
      onClose();
    } catch (err) { setError(err.response?.data?.detail || "Failed"); }
    finally { setSaving(false); }
  }

  return (
    <Modal title={`Edit ${data.Subject} (${data.Semester})`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {[["Marks", "Marks (0–100)", "number"], ["Grade", "Grade", "text"]].map(([name, label, type]) => (
          <div key={name}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <input type={type} name={name} value={form[name]} onChange={onChange} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        ))}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-end pt-1">
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
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

function EditFeeModal({ data, onClose }) {
  const { form, onChange, error, setError, saving, setSaving } = useForm({
    FeeType: data.FeeType, Amount: data.Amount, PaidOn: data.PaidOn, TransactionDetails: data.TransactionDetails || "", Status: data.Status
  });

  async function submit(e) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await api.put(`/students/fees/${data.ReceiptID}`, form);
      onClose();
    } catch (err) { setError(err.response?.data?.detail || "Failed"); }
    finally { setSaving(false); }
  }

  return (
    <Modal title={`Edit Receipt ${data.ReceiptID}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {[["FeeType","Fee Type","text"],["Amount","Amount (₹)","number"],["PaidOn","Paid On","date"],["TransactionDetails","Transaction Details","text"]].map(([name, label, type]) => (
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
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AddExamModal({ studentId, onClose }) {
  const { form, onChange, error, setError, saving, setSaving } = useForm({
    Semester: "Semester 1", GPA: "", ResultStatus: "Pass", DateReleased: ""
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
        {[["Semester","Semester Name","text"],["GPA","GPA (e.g. 9.5)","number"],["DateReleased","Date Released","date"]].map(([name, label, type]) => (
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

function EditExamModal({ data, onClose }) {
  const { form, onChange, error, setError, saving, setSaving } = useForm({
    GPA: data.GPA, ResultStatus: data.ResultStatus, DateReleased: data.DateReleased
  });

  async function submit(e) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await api.put(`/students/exams/${data.ExamRecordID}`, { ...form, GPA: parseFloat(form.GPA) });
      onClose();
    } catch (err) { setError(err.response?.data?.detail || "Failed"); }
    finally { setSaving(false); }
  }

  return (
    <Modal title={`Edit Result for ${data.Semester}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {[["GPA","GPA","number"],["DateReleased","Date Released","date"]].map(([name, label, type]) => (
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
            {saving ? "Saving..." : "Save Changes"}
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

function EditMiscModal({ data, onClose }) {
  const { form, onChange, error, setError, saving, setSaving } = useForm({
    RecordType: data.RecordType, Details: data.Details
  });

  async function submit(e) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await api.put(`/students/misc/${data.RecordID}`, form);
      onClose();
    } catch (err) { setError(err.response?.data?.detail || "Failed"); }
    finally { setSaving(false); }
  }

  return (
    <Modal title="Edit Miscellaneous Record" onClose={onClose}>
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
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}