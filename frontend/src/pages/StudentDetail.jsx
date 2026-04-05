import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { StudentForm } from "./AdminDashboard";

// --- Academic Utilities ---
const getGradeFromMarks = (marks) => {
  const m = parseInt(marks);
  if (isNaN(m)) return "F";
  if (m >= 90) return "O";
  if (m >= 80) return "A+";
  if (m >= 70) return "A";
  if (m >= 60) return "B+";
  if (m >= 50) return "B";
  if (m >= 45) return "C";
  if (m >= 40) return "P";
  return "F";
};

const calculateGPA = (subs) => {
  const gradePoints = { 'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'P': 4, 'F': 0, 'AB': 0 };
  let totalPoints = 0, totalCredits = 0;
  subs.forEach(s => {
    const grade = s.Grade?.toUpperCase().trim() || "F";
    const p = gradePoints[grade] ?? 0;
    const c = parseInt(s.Credits) || 0;
    totalPoints += (p * c);
    totalCredits += c;
  });
  const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";
  const status = parseFloat(gpa) >= 4.0 ? (parseFloat(gpa) >= 8.5 ? "Distinction" : "Pass") : "Fail";
  return { gpa, status };
};

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
  const [insight, setInsight] = useState(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  function getGradeFromMarks(marks) {
    const m = parseInt(marks);
    if (isNaN(m)) return "F";
    if (m >= 90) return "O";
    if (m >= 80) return "A+";
    if (m >= 70) return "A";
    if (m >= 60) return "B+";
    if (m >= 50) return "B";
    if (m >= 45) return "C";
    if (m >= 40) return "P";
    return "F";
  }

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
      
      // Normalization of AI response casing
      const raw = res.data;
      const normalized = {
        Semester: raw.Semester || raw.semester || "Semester 1",
        Subjects: (raw.Subjects || raw.subjects || []).map(s => {
          const marks = s.Marks ?? s.marks ?? 0;
          return {
            Subject: s.Subject || s.subject || "",
            Marks: marks,
            Grade: getGradeFromMarks(marks), // Better: Auto-derive from marks immediately
            Credits: parseInt(s.Credits || s.credits || 4)
          };
        }),
        Overall: raw.Overall || raw.overall ? {
           GPA: raw.Overall?.GPA || raw.overall?.gpa || "",
           ResultStatus: raw.Overall?.ResultStatus || raw.overall?.result_status || raw.overall?.status || "Pass",
           DateReleased: raw.Overall?.DateReleased || raw.overall?.date_released || raw.overall?.date || new Date().toISOString().split('T')[0]
        } : null
      };

      setEditData(normalized);
      setModal("aiVerifyMarks");
    } catch (err) {
      alert("Marksheet Scan failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsScanning(false);
      e.target.value = "";
    }
  }

  useEffect(() => { fetchAll(); }, [id]);

  async function generateInsight() {
    setLoadingInsight(true);
    try {
      const res = await api.get(`/ai/insights/${id}`);
      setInsight(res.data.insight);
    } catch (err) {
      alert("Failed to generate AI insights");
    } finally {
      setLoadingInsight(false);
    }
  }

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
            <div className="flex gap-2">
              <button 
                onClick={generateInsight} 
                disabled={loadingInsight}
                className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded-lg border border-blue-200 font-bold flex items-center gap-1 disabled:opacity-50"
              >
                {loadingInsight ? "Analyzing..." : "✨ AI Insight"}
              </button>
              <button onClick={openEdit} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg border font-medium">Edit Profile</button>
            </div>
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

        {insight && (
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-sm border border-blue-100 p-6 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
               <span className="text-6xl font-black text-blue-600">AI</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                <span className="text-xl">✨</span> Student Performance Analysis
              </h2>
              <button onClick={() => setInsight(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
              <div className="whitespace-pre-wrap leading-relaxed font-sans text-sm">
                {insight.split('\n').map((line, i) => {
                  let cleaned = line.replace(/^\d+\.\s+###\s+/, '### ').replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/\*\*(.*?)\*\*/g, '$1');
                  
                  if (cleaned.startsWith('### ')) {
                    return <h3 key={i} className="text-lg font-bold text-blue-800 mt-6 mb-2 border-b border-blue-100 pb-1">{cleaned.replace('### ', '').replace(/\*/g, '')}</h3>;
                  }
                  if (cleaned.startsWith('- ') || cleaned.startsWith('* ')) {
                    const content = cleaned.replace(/^[-*]\s+/, '').replace(/\*/g, '');
                    return <div key={i} className="flex gap-2 items-start ml-2 mb-1"><span className="text-blue-400 mt-1">•</span><span>{content}</span></div>;
                  }
                  
                  return <p key={i} className={cleaned.trim() === '' ? 'h-2' : ''}>{cleaned.replace(/\*/g, '')}</p>;
                })}
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-blue-200 flex justify-between items-center italic text-[10px] text-gray-400">
              <span>* AI generated insights based on all available records.</span>
              <span className="uppercase font-bold tracking-widest text-blue-300">EduVault Intelligence</span>
            </div>
          </div>
        )}

        {/* ─── Academic Records ─── */}
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-700">Academic Records (Semester-wise)</h2>
            <div className="flex gap-2">
              <label className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold uppercase tracking-wider cursor-pointer hover:bg-purple-200 flex items-center gap-1">
                {isScanning ? "Scanning..." : "✨ Scan Marksheet"}
                <input type="file" accept="image/*" className="hidden" onChange={handleAIMarksheetScan} disabled={isScanning} />
              </label>
              <button
                onClick={() => setModal("addNewSemesterSubject")}
                className="text-[10px] bg-blue-600 text-white px-3 py-1 rounded font-bold uppercase tracking-wider hover:bg-blue-700"
              >+ Add Subject</button>
            </div>
          </div>

          {semesters.length === 0 && (
            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-gray-400 text-sm mb-2">No academic records yet.</p>
              <p className="text-xs text-gray-400">Click <strong>+ Add Subject</strong> above to start adding subject marks for a semester.</p>
            </div>
          )}

          <div className="space-y-6">
            {semesters.map(sem => {
              const semMarks = marks.filter(m => m.Semester === sem);
              const semExam  = exams.find(e => e.Semester === sem);

              return (
                <div key={sem} className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* Semester Header */}
                  <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-blue-800 text-sm">{sem}</span>
                      {semExam && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          semExam.ResultStatus === "Distinction" ? "bg-purple-100 text-purple-700" :
                          semExam.ResultStatus === "Pass" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {semExam.ResultStatus}
                        </span>
                      )}
                      {semExam && (
                        <span className="text-xs font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                          GPA {semExam.GPA}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => { setEditData({ semester: sem }); setModal("addSubjectToSem"); }}
                        className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold hover:bg-blue-200"
                      >+ Subject</button>
                      <button
                        onClick={() => { setEditData({ semester: sem }); setModal("renameSemester"); }}
                        className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded font-bold hover:bg-gray-200"
                      >✎ Rename</button>
                      <button
                        onClick={async () => {
                          if (!window.confirm(`Delete entire "${sem}" including all ${semMarks.length} subject(s) and exam result?`)) return;
                          try { await api.delete(`/students/${id}/semesters/${encodeURIComponent(sem)}`); fetchAll(); }
                          catch { alert("Failed to delete semester"); }
                        }}
                        className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded font-bold hover:bg-red-100"
                      >🗑 Delete Sem</button>
                    </div>
                  </div>

                  {/* Subjects Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase">
                        <tr>
                          <th className="px-4 py-2 text-left">Subject</th>
                          <th className="px-4 py-2 text-left">Marks</th>
                          <th className="px-4 py-2 text-left">Grade</th>
                          <th className="px-4 py-2 text-left">Credits</th>
                          <th className="px-4 py-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {semMarks.map(m => (
                          <SemSubjectRow
                            key={m.Subject}
                            mark={m}
                            studentId={id}
                            onUpdated={fetchAll}
                          />
                        ))}
                        {semMarks.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-4 text-center text-gray-400 text-xs italic">
                              No subjects yet — click <strong>+ Subject</strong> above
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Exam / GPA footer */}
                  {semExam && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                      <span>Released: {semExam.DateReleased}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditData(semExam); setModal("editExam"); }}
                          className="text-[10px] bg-white border border-gray-200 text-gray-600 px-2 py-1 rounded hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                        >Edit Result</button>
                        <button
                          onClick={() => genericDelete(`/students/exams/${semExam.ExamRecordID}`, "Remove the overall GPA result for this semester?")}
                          className="text-[10px] bg-white border border-gray-200 text-red-400 px-2 py-1 rounded hover:bg-red-50 hover:border-red-200"
                        >Remove Result</button>
                      </div>
                    </div>
                  )}
                  {!semExam && semMarks.length > 0 && (
                    <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-100 flex justify-between items-center">
                      <span className="text-[10px] text-yellow-600 italic">GPA/result not declared for this semester yet.</span>
                      <button
                        onClick={() => { setEditData({ Semester: sem }); setModal("exams"); }}
                        className="text-[10px] bg-yellow-500 text-white px-2 py-1 rounded font-bold hover:bg-yellow-600"
                      >+ Add Result</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>


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
      {modal === "editMark"    && <EditMarkModal studentId={id} data={editData} onClose={() => { setModal(null); fetchAll(); }} />}
      {modal === "editExam"    && <EditExamModal data={editData} onClose={() => { setModal(null); fetchAll(); }} />}
      {modal === "editFee"     && <EditFeeModal  data={editData} onClose={() => { setModal(null); fetchAll(); }} />}
      {modal === "editMisc"    && <EditMiscModal data={editData} onClose={() => { setModal(null); fetchAll(); }} />}
      {modal === "renameSemester" && <RenameSemesterModal studentId={id} data={editData} onClose={() => { setModal(null); fetchAll(); }} />}
      {modal === "addSubjectToSem" && <AddSubjectToSemModal studentId={id} defaultSem={editData?.semester} onClose={() => { setModal(null); fetchAll(); }} />}
      {modal === "addNewSemesterSubject" && <AddSubjectToSemModal studentId={id} onClose={() => { setModal(null); fetchAll(); }} />}

      {modal === "editProfile" && (
        <Modal 
          title="Edit Student Profile" 
          onClose={() => setModal(null)} 
          width={insight ? "max-w-5xl" : "max-w-md"}
        >
          <div className={insight ? "grid grid-cols-1 md:grid-cols-2 gap-8" : ""}>
            <div className={insight ? "md:max-h-[600px] overflow-y-auto pr-2 scrollbar-thin" : ""}>
              {insight && <div className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest">Update Information</div>}
              <StudentForm form={form} onChange={handleChange} onSubmit={handleEdit} saving={saving} error={error} isEdit />
            </div>
            
            {insight && (
              <div className="flex flex-col h-[600px] bg-blue-50/30 rounded-2xl border border-blue-100 p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-black text-blue-700 uppercase tracking-widest flex items-center gap-2">
                    <span className="text-lg">✨</span> AI Reference Insight
                  </h4>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-blue-200">
                  <div className="prose prose-sm font-sans text-gray-700">
                    {insight.split('\n').map((line, i) => {
                      let cleaned = line.replace(/^\d+\.\s+###\s+/, '### ').replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/\*\*(.*?)\*\*/g, '$1');
                      
                      if (cleaned.startsWith('### ')) {
                        return <h3 key={i} className="text-sm font-bold text-blue-800 mt-4 mb-2 border-b border-blue-100 pb-1">{cleaned.replace('### ', '').replace(/\*/g, '')}</h3>;
                      }
                      if (cleaned.startsWith('- ') || cleaned.startsWith('* ')) {
                        const content = cleaned.replace(/^[-*]\s+/, '').replace(/\*/g, '');
                        return <div key={i} className="flex gap-2 items-start ml-2 mb-1 text-xs"><span className="text-blue-400 mt-1">•</span><span>{content}</span></div>;
                      }
                      
                      return <p key={i} className={`text-xs ${cleaned.trim() === '' ? 'h-2' : 'mb-2'}`}>{cleaned.replace(/\*/g, '')}</p>;
                    })}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-blue-100 text-[9px] text-blue-400 italic font-medium">
                  Use these insights to update relevant academic or disciplinary records accurately.
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
      
      {/* Add Modals */}
      {modal === "marks"  && <AddMarkModal    studentId={id} onClose={() => { setModal(null); fetchAll(); }} />}
      {modal === "fees"   && <AddFeeModal     studentId={id} onClose={() => { setModal(null); fetchAll(); }} />}
      {modal === "exams"  && <AddExamModal studentId={id} defaultSemester={editData?.Semester} onClose={() => { setModal(null); fetchAll(); }} />}
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

function Modal({ title, onClose, children, width = "max-w-md" }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${width} max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200`}>
        <div className="flex justify-between items-center px-8 py-5 border-b bg-gray-50/50">
          <h3 className="font-black text-gray-800 uppercase tracking-tight text-sm">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg size={20} fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-8 py-6 overflow-y-auto">{children}</div>
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

// ─── Inline-editable subject row ──────────────────────────────────────────────
function SemSubjectRow({ mark, studentId, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [localMarks, setLocalMarks] = useState(String(mark.Marks));
  const [localSubject, setLocalSubject] = useState(mark.Subject);
  const [localCredits, setLocalCredits] = useState(String(mark.Credits));
  const [saving, setSaving] = useState(false);

  const grade = getGradeFromMarks(localMarks);

  async function save() {
    if (localSubject.trim() === "") return;
    setSaving(true);
    try {
      // If subject name changed, we delete the old and create new
      if (localSubject.trim() !== mark.Subject) {
        await api.delete(`/students/${studentId}/marks/${encodeURIComponent(mark.Semester)}/${encodeURIComponent(mark.Subject)}`);
        await api.post(`/students/${studentId}/marks`, {
          Subject: localSubject.trim(),
          Semester: mark.Semester,
          Marks: parseInt(localMarks) || 0,
          Grade: grade,
          Credits: parseInt(localCredits) || 4,
        });
      } else {
        await api.put(`/students/${studentId}/marks/${encodeURIComponent(mark.Semester)}/${encodeURIComponent(mark.Subject)}`, {
          Marks: parseInt(localMarks) || 0,
          Grade: grade,
        });
      }
      setEditing(false);
      onUpdated();
    } catch (err) {
      alert("Failed to save: " + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete "${mark.Subject}" from ${mark.Semester}?`)) return;
    try {
      await api.delete(`/students/${studentId}/marks/${encodeURIComponent(mark.Semester)}/${encodeURIComponent(mark.Subject)}`);
      onUpdated();
    } catch { alert("Delete failed"); }
  }

  if (editing) {
    return (
      <tr className="bg-blue-50/50">
        <td className="px-4 py-2">
          <input
            className="w-full border border-blue-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-400"
            value={localSubject}
            onChange={e => setLocalSubject(e.target.value)}
          />
        </td>
        <td className="px-4 py-2">
          <input
            type="number" min="0" max="100"
            className="w-20 border border-blue-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-400"
            value={localMarks}
            onChange={e => setLocalMarks(e.target.value)}
          />
        </td>
        <td className="px-4 py-2 font-bold text-blue-700">{grade}</td>
        <td className="px-4 py-2">
          <input
            type="number" min="1" max="8"
            className="w-16 border border-blue-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-400"
            value={localCredits}
            onChange={e => setLocalCredits(e.target.value)}
          />
        </td>
        <td className="px-4 py-2 text-right">
          <div className="flex justify-end gap-2">
            <button onClick={save} disabled={saving} className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded font-bold hover:bg-blue-700 disabled:opacity-50">
              {saving ? "..." : "✓ Save"}
            </button>
            <button onClick={() => { setEditing(false); setLocalMarks(String(mark.Marks)); setLocalSubject(mark.Subject); }} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded font-bold hover:bg-gray-200">
              Cancel
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50 group">
      <td className="px-4 py-2.5 font-medium text-gray-800">{mark.Subject}</td>
      <td className="px-4 py-2.5 font-semibold">{mark.Marks}</td>
      <td className="px-4 py-2.5">
        <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-xs">{mark.Grade}</span>
      </td>
      <td className="px-4 py-2.5 text-gray-500 text-xs">{mark.Credits} cr</td>
      <td className="px-4 py-2.5 text-right">
        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)} className="text-[10px] bg-gray-100 text-blue-600 px-2 py-1 rounded font-bold hover:bg-blue-50">✎ Edit</button>
          <button onClick={remove} className="text-[10px] bg-gray-100 text-red-500 px-2 py-1 rounded font-bold hover:bg-red-50">✕</button>
        </div>
      </td>
    </tr>
  );
}

// ─── Rename Semester Modal ─────────────────────────────────────────────────────
function RenameSemesterModal({ studentId, data, onClose }) {
  const [newName, setNewName] = useState(data?.semester || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const oldName = data?.semester;

  async function save() {
    if (!newName.trim() || newName.trim() === oldName) { setError("Please enter a different name."); return; }
    setSaving(true); setError("");
    try {
      await api.put(`/students/${studentId}/semesters/${encodeURIComponent(oldName)}/rename?new_name=${encodeURIComponent(newName.trim())}`);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to rename semester");
    } finally { setSaving(false); }
  }

  return (
    <Modal title="Rename Semester" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <p className="text-xs text-gray-500 mb-3">Renaming will update <strong>all subjects and exam records</strong> for this semester.</p>
          <label className="block text-xs font-medium text-gray-600 mb-1">Current Name</label>
          <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500">{oldName}</div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">New Name</label>
          <input
            autoFocus
            className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="e.g. Semester 3"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:underline">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Renaming..." : "Rename Semester"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Add Subject to a Semester Modal ──────────────────────────────────────────
function AddSubjectToSemModal({ studentId, defaultSem, onClose }) {
  const [semester, setSemester] = useState(defaultSem || "Semester 1");
  const [subject, setSubject] = useState("");
  const [marks, setMarks] = useState("");
  const [credits, setCredits] = useState("4");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const grade = getGradeFromMarks(marks);

  async function save(e) {
    e.preventDefault();
    if (!semester.trim() || !subject.trim() || marks === "") { setError("Semester, Subject, and Marks are required."); return; }
    setSaving(true); setError("");
    try {
      await api.post(`/students/${studentId}/marks`, {
        Subject: subject.trim(),
        Semester: semester.trim(),
        Marks: parseInt(marks),
        Grade: grade,
        Credits: parseInt(credits) || 4,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to add subject");
    } finally { setSaving(false); }
  }

  return (
    <Modal title={defaultSem ? `Add Subject to ${defaultSem}` : "Add Subject"} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Semester</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
            value={semester}
            onChange={e => setSemester(e.target.value)}
            placeholder="e.g. Semester 1"
            readOnly={!!defaultSem}
          />
          {!defaultSem && <p className="text-[10px] text-gray-400 mt-1">Type a new or existing semester name.</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Subject Name</label>
          <input
            autoFocus={!!defaultSem}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="e.g. Data Structures"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Marks (0–100)</label>
            <input
              type="number" min="0" max="100"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
              value={marks}
              onChange={e => setMarks(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Credits</label>
            <input
              type="number" min="1" max="8"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400"
              value={credits}
              onChange={e => setCredits(e.target.value)}
            />
          </div>
        </div>
        {marks !== "" && (
          <div className="bg-blue-50 rounded-lg px-3 py-2 flex justify-between text-sm">
            <span className="text-gray-500">Auto-calculated Grade:</span>
            <span className="font-black text-blue-700">{grade}</span>
          </div>
        )}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:underline">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Adding..." : "Add Subject"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AIMarksheetVerifyModal({ studentId, data, onClose }) {
  const [semester, setSemester] = useState(data?.Semester || "Semester 1");
  const [subjects, setSubjects] = useState(data?.Subjects || []);
  const [overall, setOverall] = useState(data?.Overall || { GPA: "", ResultStatus: "Pass", DateReleased: new Date().toISOString().split('T')[0] });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Auto-calculate GPA whenever subjects or credits change
  useEffect(() => {
    const calc = calculateGPA(subjects);
    setOverall(prev => ({ ...prev, GPA: calc.gpa, ResultStatus: calc.status }));
  }, [subjects]);

  async function handleSave() {
    setSaving(true); setError("");
    try {
      // Clean up subjects to ensure valid numbers
      const cleanedSubjects = subjects.map(s => ({
        ...s,
        Marks: isNaN(parseInt(s.Marks)) ? 0 : parseInt(s.Marks),
        Credits: isNaN(parseInt(s.Credits)) ? 4 : parseInt(s.Credits),
        Semester: semester
      })).filter(s => s.Subject.trim() !== "");

      // Clean up overall GPA
      const gpaNum = parseFloat(overall.GPA);
      const cleanedOverall = (overall.GPA && !isNaN(gpaNum)) ? { 
        ...overall, 
        GPA: gpaNum,
        Semester: semester, 
        StudentID: studentId 
      } : null;

      const payload = {
        marks: cleanedSubjects,
        overall_result: cleanedOverall
      };
      
      await api.post(`/students/${studentId}/marks/bulk`, payload);
      onClose();
    } catch (err) {
      console.error("Save error details:", err.response?.data);
      setError(err.response?.data?.detail || "Failed to save results. Check if all required fields are filled.");
    } finally {
      setSaving(false);
    }
  }

  const updateSubject = (idx, field, val) => {
    const next = [...subjects];
    const item = { ...next[idx] };
    
    if (field === "Marks") {
      item.Marks = parseInt(val) || 0;
      item.Grade = getGradeFromMarks(val);
    } else if (field === "Credits") {
      item.Credits = parseInt(val) || 0;
    } else {
      item[field] = val;
    }
    
    next[idx] = item;
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
            <tr><th className="px-3 py-2 text-left">Subject</th><th className="px-3 py-2 text-left w-16">Marks</th><th className="px-3 py-2 text-left w-16">Credits</th><th className="px-3 py-2 text-left w-16">Grade</th></tr>
          </thead>
          <tbody className="divide-y">
            {subjects.map((s, idx) => (
              <tr key={idx}>
                <td className="px-3 py-1"><input value={s.Subject} onChange={e => updateSubject(idx, "Subject", e.target.value)} className="w-full border-none focus:ring-0 p-0 h-7" /></td>
                <td className="px-3 py-1"><input value={s.Marks} type="number" onChange={e => updateSubject(idx, "Marks", e.target.value)} className="w-full border-none focus:ring-0 p-0 h-7" /></td>
                <td className="px-3 py-1"><input value={s.Credits} type="number" onChange={e => updateSubject(idx, "Credits", e.target.value)} className="w-full border-none focus:ring-0 p-0 h-7 font-bold text-purple-600" /></td>
                <td className="px-3 py-1"><input value={s.Grade} onChange={e => updateSubject(idx, "Grade", e.target.value)} className="w-full border-none focus:ring-0 p-0 h-7" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-3 border p-3 rounded-xl bg-gray-50">
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase">Calculated GPA</label>
          <div className="w-full bg-white border rounded p-1.5 text-sm font-bold text-blue-700">{overall.GPA}</div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase">Status</label>
          <div className="w-full bg-white border rounded p-1.5 text-sm font-bold text-purple-700">{overall.ResultStatus}</div>
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
  const { form, onChange, error, setError, saving, setSaving, setForm } = useForm({ Semester: "Semester 1", Subject: "", Marks: "", Grade: "", Credits: "4" });

  const handleMarksChange = (e) => {
    const val = e.target.value;
    const grade = getGradeFromMarks(val);
    setForm(f => ({ ...f, Marks: val, Grade: grade }));
  };

  async function submit(e) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await api.post(`/students/${studentId}/marks`, { ...form, Marks: parseInt(form.Marks), Credits: parseInt(form.Credits) });
      onClose();
    } catch (err) { setError(err.response?.data?.detail || "Failed"); }
    finally { setSaving(false); }
  }

  return (
    <Modal title="Add Mark" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {[["Semester", "Semester", "text"], ["Subject", "Subject", "text"], ["Marks", "Marks (0–100)", "number"], ["Credits", "Credits", "number"], ["Grade", "Grade (A/B/C…)", "text"]].map(([name, label, type]) => (
          <div key={name}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <input 
              type={type} 
              name={name} 
              value={form[name]} 
              onChange={name === "Marks" ? handleMarksChange : onChange} 
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
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
  const { form, onChange, error, setError, saving, setSaving, setForm } = useForm({ Marks: data.Marks, Grade: data.Grade });

  const handleMarksChange = (e) => {
    const val = e.target.value;
    const grade = getGradeFromMarks(val);
    setForm(f => ({ ...f, Marks: val, Grade: grade }));
  };

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
            <input 
              type={type} 
              name={name} 
              value={form[name]} 
              onChange={name === "Marks" ? handleMarksChange : onChange} 
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
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

function AddExamModal({ studentId, defaultSemester, onClose }) {
  const { form, onChange, error, setError, saving, setSaving } = useForm({
    Semester: defaultSemester || "Semester 1", GPA: "", ResultStatus: "Pass", DateReleased: ""
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