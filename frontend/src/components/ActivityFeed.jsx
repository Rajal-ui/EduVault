import { useEffect, useState } from "react";
import api from "../api/axios";
import { format } from "date-fns";
import { User, Database, Clock, RefreshCw, Trash2, PlusCircle } from "lucide-react";

export default function ActivityFeed() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = () => {
    setLoading(true);
    api.get("/audit/recent")
      .then(res => setLogs(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE': return <PlusCircle size={14} className="text-green-500" />;
      case 'UPDATE': return <RefreshCw size={14} className="text-blue-500" />;
      case 'DELETE': return <Trash2 size={14} className="text-red-500" />;
      default: return <Database size={14} className="text-gray-500" />;
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 text-sm">Loading activity...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Recent Activity Feed</h3>
        <button onClick={fetchLogs} className="text-[10px] bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded font-bold uppercase text-gray-500 flex items-center gap-1">
           <RefreshCw size={10} /> Refresh
        </button>
      </div>
      <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
        {logs.map((log) => (
          <div key={log.LogID} className="p-4 hover:bg-gray-50/50 transition-colors">
            <div className="flex gap-4 items-start">
              <div className="mt-1">
                {getActionIcon(log.Action)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">
                  <span className="font-bold text-blue-600">{log.UserID}</span>
                  <span className="mx-1 text-gray-400">performed</span>
                  <span className="font-bold text-gray-700">{log.Action}</span>
                  <span className="mx-1 text-gray-400">on</span>
                  <span className="font-bold text-purple-600">{log.TableAffected}</span>
                  <span className="mx-1 text-gray-400">[{log.RecordID}]</span>
                </p>
                
                {log.Action === 'UPDATE' && log.NewValue && (
                   <div className="mt-2 bg-gray-50 p-2 rounded text-[10px] font-mono text-gray-500 border border-gray-100 overflow-x-auto">
                      Modified {Object.keys(log.NewValue).join(", ")}
                   </div>
                )}

                <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-400 font-medium">
                   <span className="flex items-center gap-1"><Clock size={10} /> {format(new Date(log.Timestamp), 'MMM d, h:mm a')}</span>
                   <span className="flex items-center gap-1"><User size={10} /> {log.UserRole}</span>
                   <span className="text-gray-300">IP: {log.IPAddress || 'Unknown'}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="p-12 text-center text-gray-400 text-sm italic">
            No administrative actions recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
