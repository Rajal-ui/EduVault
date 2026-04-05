import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import { Bell, Check, Trash2, X } from "lucide-react";
import { format } from "date-fns";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [show, setShow] = useState(false);
  const dropdownRef = useRef(null);
  const [connected, setConnected] = useState(false);

  const fetchNotifications = () => {
    api.get("/notifications/").then(res => setNotifications(res.data));
  };

  useEffect(() => {
    fetchNotifications();
    const token = localStorage.getItem("token");
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  
    const wsUrl = `${protocol}//localhost:8000/notifications/ws/${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      const newNotif = JSON.parse(event.data);
      setNotifications(prev => [newNotif, ...prev]);
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShow(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.IsRead).length;

  const markRead = (id) => {
    api.put(`/notifications/${id}/read`).then(() => {
      setNotifications(prev => prev.map(n => n.NotificationID === id ? { ...n, IsRead: true } : n));
    });
  };

  const clearAll = () => {
    api.delete("/notifications/clear").then(() => setNotifications([]));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setShow(!show)}
        className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all border border-white/10"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-blue-700">
            {unreadCount}
          </span>
        )}
      </button>

      {show && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 text-gray-800 animate-in fade-in zoom-in duration-200">
          <div className="px-4 py-3 bg-gray-50/50 border-b flex justify-between items-center text-gray-500 uppercase tracking-widest font-black text-[10px]">
            <span>Alerts & Notifications {connected ? '🟢' : '🔴'}</span>
            <button onClick={clearAll} className="hover:text-red-500 uppercase flex items-center gap-1"><Trash2 size={10} /> Clear</button>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {notifications.map((n) => (
              <div 
                key={n.NotificationID || n.id} 
                className={`p-4 transition-colors hover:bg-blue-50/20 flex gap-3 ${n.IsRead ? 'opacity-60' : 'bg-blue-50/10'}`}
              >
                 <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${n.IsRead ? 'bg-gray-200' : 'bg-blue-500 font-black ring-4 ring-blue-500/20'}`} />
                 <div className="flex-1 min-w-0">
                    <h4 className={`text-xs ${n.IsRead ? 'font-medium' : 'font-black'} text-gray-800 leading-tight`}>{n.Title}</h4>
                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-3 leading-relaxed">{n.Message}</p>
                    <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase">{format(new Date(n.CreatedAt || n.created_at), 'h:mm a · MMM d')}</p>
                 </div>
                 {!n.IsRead && (
                   <button 
                     onClick={(e) => { e.stopPropagation(); markRead(n.NotificationID || n.id); }}
                     className="mt-1 h-6 w-6 bg-white border border-gray-100 rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-50 shadow-sm transition-all"
                   >
                     <Check size={12} />
                   </button>
                 )}
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="p-10 text-center text-gray-400 text-sm italic">
                All caught up. No new alerts.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
