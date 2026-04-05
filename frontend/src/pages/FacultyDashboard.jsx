import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import NotificationBell from "../components/NotificationBell";
import { Users, GraduationCap, ClipboardList } from "lucide-react";

export default function FacultyDashboard() {
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const name = localStorage.getItem("name");

  useEffect(() => {
    api.get("/students/").then(res => {
      setStudents(res.data);
    }).finally(() => setLoading(false));
  }, []);

  const logout = () => { localStorage.clear(); navigate("/"); };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-700 text-white px-6 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-black tracking-tight uppercase">EduVault <span className="text-indigo-300 font-medium text-xs ml-2 tracking-widest">Faculty Portal</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <span className="text-sm font-medium opacity-90">{name}</span>
          <button onClick={logout} className="text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-1.5 rounded-lg font-bold transition-colors">Logout</button>
        </div>
      </header>

      <main className="p-6 max-w-[1200px] mx-auto">
        <div className="mb-8">
           <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Department Overview</h2>
           <p className="text-gray-500 text-sm mt-1 font-medium">Manage academic performance for your assigned students.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
              <div className="bg-indigo-50 text-indigo-600 p-4 rounded-xl"><Users size={24} /></div>
              <div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Students</p>
                 <h3 className="text-2xl font-black text-indigo-900">{students.length}</h3>
              </div>
           </div>
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
              <div className="bg-green-50 text-green-600 p-4 rounded-xl"><GraduationCap size={24} /></div>
              <div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Avg Dept GPA</p>
                 <h3 className="text-2xl font-black text-green-900">8.42</h3>
              </div>
           </div>
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
              <div className="bg-orange-50 text-orange-600 p-4 rounded-xl"><ClipboardList size={24} /></div>
              <div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending Marks</p>
                 <h3 className="text-2xl font-black text-orange-900">12</h3>
              </div>
           </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
           <table className="w-full text-sm">
             <thead className="bg-gray-50/80 text-gray-400 uppercase text-[10px] font-black tracking-widest border-b">
               <tr>
                 <th className="px-6 py-4 text-left">Internal ID</th>
                 <th className="px-6 py-4 text-left">Student Name</th>
                 <th className="px-6 py-4 text-left">Academic Year</th>
                 <th className="px-6 py-4 text-right">Academic Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-50">
                {students.map(s => (
                  <tr key={s.StudentID} className="hover:bg-indigo-50/20 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">{s.StudentID}</td>
                    <td className="px-6 py-4 font-bold text-gray-800">{s.Name}</td>
                    <td className="px-6 py-4 text-gray-600 font-medium">Year {s.Year}</td>
                    <td className="px-6 py-4 text-right">
                       <button 
                         onClick={() => navigate(`/faculty/student/${s.StudentID}`)}
                         className="text-xs bg-indigo-600 text-white px-4 py-1.5 rounded-lg font-black uppercase tracking-wider hover:bg-indigo-700 shadow-md transition-all active:scale-95"
                       >
                         Manage Marks
                       </button>
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
