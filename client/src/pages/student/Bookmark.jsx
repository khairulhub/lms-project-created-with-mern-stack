// client/src/pages/student/Bookmark.jsx
// Student এর "save for later" করা lecture গুলো course অনুযায়ী group করে দেখায়।
// প্রতিটা lecture ক্লিক করলে সরাসরি সেই lecture-এ course view পেজে জাম্প করে।

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiTag, FiTrash2, FiPlayCircle } from "react-icons/fi";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";

const Bookmark = () => {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  const load = () => {
    setLoading(true);
    api.get("/bookmarks/my")
      .then(({ data }) => setBookmarks(data || []))
      .catch(() => setBookmarks([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRemove = async (id) => {
    setRemovingId(id);
    try {
      await api.delete(`/bookmarks/${id}`);
      setBookmarks((prev) => prev.filter((b) => b._id !== id));
    } catch {
      toast.error("Bookmark মুছতে সমস্যা হয়েছে।");
    } finally {
      setRemovingId(null);
    }
  };

  const goToLecture = (b) => {
    if (!b.course?._id) return;
    navigate(`/student/course/${b.course._id}?lecture=${b.lectureId}`);
  };

  // course অনুযায়ী group
  const grouped = bookmarks.reduce((acc, b) => {
    const key = b.course?._id || "unknown";
    if (!acc[key]) acc[key] = { course: b.course, items: [] };
    acc[key].items.push(b);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Bookmark</h1>
        <p className="text-gray-400 mb-6">তোমার সেভ করা lecture গুলো</p>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ width: 30, height: 30, border: "3px solid #7c3aed", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 text-center">
            <p className="text-6xl mb-4">🔖</p>
            <p className="text-white font-semibold mb-2">এখনো কোনো Bookmark নেই</p>
            <p className="text-gray-500 text-sm">কোর্স দেখার সময় lecture list-এ ☆ আইকনে ক্লিক করে যেকোনো lecture পরে দেখার জন্য save করে রাখতে পারো।</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {Object.values(grouped).map(({ course, items }) => (
              <div key={course?._id || "unknown"}
                style={{
                  background: "linear-gradient(160deg,#110224,#0d011f)",
                  border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "16px 18px",
                }}>
                <p style={{ color: "#fff", fontWeight: 700, fontSize: 13.5, marginBottom: 10 }}>
                  {course?.emoji ? `${course.emoji} ` : ""}{course?.title || "কোর্স (মুছে ফেলা হয়েছে)"}
                </p>
                <div className="flex flex-col gap-1.5">
                  {items.map((b) => (
                    <div key={b._id}
                      className="flex items-center gap-3"
                      style={{
                        padding: "9px 12px", borderRadius: 10,
                        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                      }}>
                      <FiTag size={13} style={{ color: "#facc15", flexShrink: 0 }} />
                      <button
                        onClick={() => goToLecture(b)}
                        disabled={!course}
                        className="flex-1 min-w-0 text-left flex items-center gap-2"
                        style={{ color: course ? "#d1d5db" : "#4b5563", fontSize: 12.5, cursor: course ? "pointer" : "default", background: "none", border: "none" }}
                        title={course ? "এই lecture-এ যাও" : "কোর্স আর নেই"}
                      >
                        <FiPlayCircle size={13} style={{ flexShrink: 0, opacity: 0.6 }} />
                        <span className="truncate">{b.lectureTitle || "Lecture"}</span>
                      </button>
                      <button
                        onClick={() => handleRemove(b._id)}
                        disabled={removingId === b._id}
                        title="Bookmark মুছে ফেলো"
                        style={{ color: "#6b7280", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Bookmark;
