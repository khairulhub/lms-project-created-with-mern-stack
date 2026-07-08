import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import { useAnnouncements } from "../../contexts/AnnouncementContext";
import { FiBell, FiGlobe, FiBookOpen, FiClock, FiX } from "react-icons/fi";

const priorityStyle = (p) => {
  const map = {
    normal: { border: "border-gray-800", badge: "bg-gray-700/50 text-gray-300", label: "সাধারণ" },
    important: { border: "border-yellow-600/40", badge: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30", label: "গুরুত্বপূর্ণ" },
    urgent: { border: "border-red-600/40", badge: "bg-red-500/10 text-red-400 border border-red-500/30", label: "জরুরি" },
  };
  return map[p] || map.normal;
};

// ── Detail modal ─────────────────────────────────────────────────────────
const AnnouncementModal = ({ announcement, onClose }) => {
  const s = priorityStyle(announcement.priority);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div className={`w-full max-w-lg bg-gray-900 border ${s.border} rounded-2xl p-6 max-h-[85vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${announcement.scope === "global" ? "bg-blue-500/10 text-blue-400" : "bg-orange-500/10 text-orange-400"}`}>
              {announcement.scope === "global" ? <FiGlobe size={11} /> : <FiBookOpen size={11} />}
              {announcement.scope === "global" ? "সাধারণ ঘোষণা" : announcement.course?.title || "কোর্স"}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${s.badge}`}>{s.label}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white shrink-0"><FiX size={20} /></button>
        </div>

        <h3 className="text-white font-bold text-lg mb-2">{announcement.title}</h3>
        <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{announcement.message}</p>

        <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-gray-800 text-xs text-gray-500">
          <span>{announcement.createdBy?.name} {announcement.createdByRole === "admin" ? "(অ্যাডমিন)" : "(ইন্সট্রাক্টর)"}</span>
          <span>{new Date(announcement.createdAt).toLocaleString("bn-BD")}</span>
          {announcement.eventDate && (
            <span className="flex items-center gap-1 text-yellow-500">
              <FiClock size={11} /> {new Date(announcement.eventDate).toLocaleString("bn-BD")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const Announcement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const { markAsRead, refreshUnreadCount } = useAnnouncements() || {};

  useEffect(() => {
    let mounted = true;
    api.get("/announcements/feed")
      .then((res) => { if (mounted) setAnnouncements(res.data); })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const openAnnouncement = async (a) => {
    setSelected(a);
    if (!a.isRead) {
      // Locally mark as read immediately (list dot chole jabe), server-e o mark hobe
      setAnnouncements((prev) => prev.map((x) => (x._id === a._id ? { ...x, isRead: true } : x)));
      await markAsRead?.(a._id, true);
      refreshUnreadCount?.();
    }
  };

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Announcement</h1>
        <p className="text-gray-400 mb-8">Latest announcements from admin and instructors</p>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 text-center">
            <p className="text-6xl mb-4">📢</p>
            <p className="text-white font-semibold mb-2">কোনো অ্যানাউন্সমেন্ট নেই</p>
            <p className="text-gray-500 text-sm">নতুন কোনো আপডেট আসলে এখানে দেখতে পাবে।</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => {
              const s = priorityStyle(a.priority);
              return (
                <button
                  key={a._id}
                  onClick={() => openAnnouncement(a)}
                  className={`w-full text-left bg-gray-900 border ${s.border} rounded-xl p-5 relative hover:border-cyan-700/50 transition-colors`}
                >
                  {!a.isRead && (
                    <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-cyan-400" title="নতুন" />
                  )}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${a.scope === "global" ? "bg-blue-500/10 text-blue-400" : "bg-orange-500/10 text-orange-400"}`}>
                      {a.scope === "global" ? <FiGlobe size={11} /> : <FiBookOpen size={11} />}
                      {a.scope === "global" ? "সাধারণ ঘোষণা" : a.course?.title || "কোর্স"}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${s.badge}`}>{s.label}</span>
                    {!a.isRead && <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-cyan-500/10 text-cyan-400">নতুন</span>}
                  </div>
                  <h3 className={`font-semibold mb-1 ${a.isRead ? "text-gray-300" : "text-white"}`}>{a.title}</h3>
                  <p className="text-gray-500 text-sm truncate">{a.message}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
                    <span>{a.createdBy?.name} {a.createdByRole === "admin" ? "(অ্যাডমিন)" : "(ইন্সট্রাক্টর)"}</span>
                    <span>{new Date(a.createdAt).toLocaleString("bn-BD")}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selected && <AnnouncementModal announcement={selected} onClose={() => setSelected(null)} />}
    </DashboardLayout>
  );
};

export default Announcement;
