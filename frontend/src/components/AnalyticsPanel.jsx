import { useEffect, useState } from "react";
import api from "../api/axios";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";
import { Users, AlertTriangle, CreditCard, Award, ArrowUpRight, ArrowDownRight } from "lucide-react";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function AnalyticsPanel() {
  const [summary, setSummary] = useState(null);
  const [atRisk, setAtRisk] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/analytics/summary"),
      api.get("/analytics/at-risk")
    ]).then(([sumRes, riskRes]) => {
      setSummary(sumRes.data);
      setAtRisk(riskRes.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading || !summary) return <div className="p-8 text-center text-gray-500">Generating analytics...</div>;

  const stats = [
    { label: "Total Students", value: summary.total_students, icon: <Users size={20} />, color: "bg-blue-50 text-blue-600" },
    { label: "At-Risk Students", value: atRisk.length, icon: <AlertTriangle size={20} />, color: "bg-red-50 text-red-600" },
    { label: "Fee Collection", value: `${Math.round((summary.fee_summary.find(f => f.name === "Paid")?.count || 0) / summary.total_students * 100)}%`, icon: <CreditCard size={20} />, color: "bg-green-50 text-green-600" },
    { label: "Avg Institution GPA", value: 8.24, icon: <Award size={20} />, color: "bg-purple-50 text-purple-600" }, // Mock institutional avg
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((s, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{s.label}</p>
              <h3 className="text-xl font-bold text-gray-800">{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Department Distribution (Pie) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-700 mb-6 uppercase tracking-widest">Department Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={summary.dept_counts} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {summary.dept_counts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance by Year (Bar) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-700 mb-6 uppercase tracking-widest">Avg GPA by Academic Year</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.performance_by_year}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} domain={[0, 10]} />
                <Tooltip cursor={{fill: '#F3F4F6'}} />
                <Bar dataKey="avg_gpa" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fee Status (Bar) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-700 mb-6 uppercase tracking-widest">Fee Status Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.fee_summary} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#4B5563', fontSize: 12}} width={80} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={25}>
                   {summary.fee_summary.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Paid' ? '#10B981' : entry.name === 'Pending' ? '#F59E0B' : '#EF4444'} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance by Dept (Line or Horizontal Bar) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-700 mb-6 uppercase tracking-widest">Academic Ranking by Department</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.performance_by_dept}>
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 10}} />
                <YAxis domain={[0, 10]} hide />
                <Tooltip />
                <Bar dataKey="avg_gpa" fill="#3B82F6" animationDuration={1500} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* At Risk List */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">At-Risk Student Alerts</h3>
          <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded font-bold uppercase">{atRisk.length} Priority Cases</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {atRisk.map((s) => (
            <div key={s.StudentID} className="border border-red-50 bg-white p-4 rounded-xl hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-gray-800">{s.Name}</h4>
                  <p className="text-xs text-gray-500 font-mono uppercase">{s.StudentID}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.RiskLevel === 'High' ? 'bg-red-600 text-white' : 'bg-orange-100 text-orange-700'}`}>
                  {s.RiskLevel} Risk
                </span>
              </div>
              <div className="space-y-2 mb-3">
                {s.PrimaryReasons.map((r, i) => (
                  <p key={i} className="text-[11px] text-gray-600 flex gap-1 items-start">
                    <span className="text-red-400 mt-0.5">•</span> {r}
                  </p>
                ))}
              </div>
              <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-50">
                <p className="text-[10px] text-blue-700 font-medium italic italic">✨ AI Suggestion: {s.AISuggestion}</p>
              </div>
            </div>
          ))}
          {atRisk.length === 0 && <p className="text-gray-400 text-sm italic col-span-3 text-center py-8">No at-risk students detected. Institutional health is optimal.</p>}
        </div>
      </div>
    </div>
  );
}
