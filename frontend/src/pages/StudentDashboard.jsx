import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import NotificationBell from "../components/NotificationBell";

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [marks, setMarks] = useState([]);
  const [fees, setFees] = useState([]);
  const [exams, setExams] = useState([]);
  const navigate = useNavigate();

  const studentId = localStorage.getItem("name"); 

  useEffect(() => {
    
    const token = localStorage.getItem("token");
    if (!token) return;
    const payload = JSON.parse(atob(token.split(".")[1]));
    const id = payload.sub;

    Promise.all([
      api.get(`/students/${id}`),
      api.get(`/students/${id}/marks`),
      api.get(`/students/${id}/fees`),
      api.get(`/students/${id}/exams`),
    ]).then(([s, m, f, e]) => {
      setStudent(s.data);
      setMarks(m.data);
      setFees(f.data);
      setExams(e.data);
    });
  }, []);

  function logout() {
    localStorage.clear();
    navigate("/");
  }

  if (!student) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-bold">EduVault — Student</h1>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <span className="text-sm font-medium">{student.Name}</span>
          <button onClick={logout} className="text-sm bg-white text-blue-700 px-3 py-1 rounded-lg font-medium hover:bg-blue-50 transition-colors">
            Logout
          </button>
        </div>
      </header>

      <main className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Profile */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold text-gray-700 mb-3">Profile</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Department:</span> <span className="font-medium">{student.Department}</span></div>
            <div><span className="text-gray-500">Year:</span> <span className="font-medium">{student.Year}</span></div>
            <div><span className="text-gray-500">Contact:</span> <span className="font-medium">{student.Contact}</span></div>
            <div><span className="text-gray-500">Fee Status:</span>
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                student.FeeStatus === "Paid" ? "bg-green-100 text-green-700" :
                student.FeeStatus === "Pending" ? "bg-yellow-100 text-yellow-700" :
                "bg-red-100 text-red-700"
              }`}>{student.FeeStatus}</span>
            </div>
          </div>
        </div>

        {/* Marks */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold text-gray-700 mb-3">Marksheet</h2>
          <table className="w-full text-sm">
            <thead className="text-gray-500 text-xs uppercase border-b">
              <tr>
                <th className="pb-2 text-left">Subject</th>
                <th className="pb-2 text-left">Marks</th>
                <th className="pb-2 text-left">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {marks.map((m) => (
                <tr key={m.Subject}>
                  <td className="py-2">{m.Subject}</td>
                  <td className="py-2">{m.Marks}</td>
                  <td className="py-2 font-semibold text-blue-600">{m.Grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Exam Status */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold text-gray-700 mb-3">Exam Results</h2>
          <table className="w-full text-sm">
            <thead className="text-gray-500 text-xs uppercase border-b">
              <tr>
                <th className="pb-2 text-left">Semester</th>
                <th className="pb-2 text-left">GPA</th>
                <th className="pb-2 text-left">Result</th>
                <th className="pb-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {exams.map((e) => (
                <tr key={e.ExamRecordID}>
                  <td className="py-2">{e.Semester}</td>
                  <td className="py-2 font-semibold">{e.GPA}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      e.ResultStatus === "Distinction" ? "bg-purple-100 text-purple-700" :
                      e.ResultStatus === "Pass" ? "bg-green-100 text-green-700" :
                      "bg-red-100 text-red-700"
                    }`}>{e.ResultStatus}</span>
                  </td>
                  <td className="py-2 text-gray-500">{e.DateReleased}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Fee Receipts */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold text-gray-700 mb-3">Fee Receipts</h2>
          <table className="w-full text-sm">
            <thead className="text-gray-500 text-xs uppercase border-b">
              <tr>
                <th className="pb-2 text-left">Receipt ID</th>
                <th className="pb-2 text-left">Type</th>
                <th className="pb-2 text-left">Amount</th>
                <th className="pb-2 text-left">Paid On</th>
                <th className="pb-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {fees.map((f) => (
                <tr key={f.ReceiptID}>
                  <td className="py-2 font-mono text-gray-500">{f.ReceiptID}</td>
                  <td className="py-2">{f.FeeType}</td>
                  <td className="py-2 font-semibold">₹{f.Amount}</td>
                  <td className="py-2 text-gray-500">{f.PaidOn}</td>
                  <td className="py-2">
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">{f.Status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
