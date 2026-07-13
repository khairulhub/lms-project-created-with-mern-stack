// client/src/pages/instructor/InstructorDiscussions.jsx
// Instructor এর নিজের কোর্সগুলোর সব lecture Q&A এক জায়গায় — course বাছাই করে
// প্রশ্নগুলো দেখা আর reply দেওয়া যায়।

import { useEffect, useState } from "react";
import { FiTrash2, FiMessageCircle } from "react-icons/fi";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";

const InstructorDiscussions = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyingId, setReplyingId] = useState(null);

  useEffect(() => {
    api.get("/instructor/courses").then((r) => {
      setCourses(r.data || []);
      if (r.data?.length > 0) setSelectedCourse(r.data[0]._id);
    }).catch(() => setCourses([]));
  }, []);

  const load = () => {
    if (!selectedCourse) return;
    setLoading(true);
    api.get(`/discussions/course/${selectedCourse}`)
      .then(({ data }) => setItems(data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [selectedCourse]);

  const handleReply = async (id) => {
    const text = (replyDrafts[id] || "").trim();
    if (!text) return;
    setReplyingId(id);
    try {
      await api.post(`/discussions/${id}/reply`, { message: text });
      setReplyDrafts((prev) => ({ ...prev, [id]: "" }));
      load();
    } catch {
      toast.error("Reply পাঠানো যায়নি।");
    } finally {
      setReplyingId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/discussions/${id}`);
      setItems((prev) => prev.filter((d) => d._id !== id));
    } catch {
      toast.error("মুছতে সমস্যা হয়েছে।");
    }
  };

  // lecture অনুযায়ী group করে দেখাবো
  const grouped = items.reduce((acc, d) => {
    const key = d.lectureId;
    if (!acc[key]) acc[key] = { title: d.lectureTitle || "Lecture", items: [] };
    acc[key].items.push(d);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Discussions</h1>
        <p className="text-gray-400 mb-6">তোমার কোর্সের student দের প্রশ্নের উত্তর দাও</p>

        {courses.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 text-center">
            <p className="text-6xl mb-4">💬</p>
            <p className="text-white font-semibold mb-2">এখনো কোনো কোর্স নেই</p>
          </div>
        ) : (
          <>
            <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}
              className="bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-2.5 text-sm mb-6 focus:outline-none focus:border-cyan-500">
              {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>

            {loading ? (
              <div className="text-center py-16">
                <div style={{ width: 30, height: 30, border: "3px solid #7c3aed", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            ) : items.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 text-center">
                <FiMessageCircle size={40} className="text-gray-700 mx-auto mb-3" />
                <p className="text-white font-semibold mb-1">এখনো কোনো প্রশ্ন আসেনি</p>
                <p className="text-gray-500 text-sm">Student রা lecture দেখার সময় প্রশ্ন করলে এখানে দেখাবে।</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(grouped).map(([lectureId, group]) => (
                  <div key={lectureId}>
                    <p className="text-gray-400 text-xs font-semibold mb-2 uppercase tracking-wide">{group.title}</p>
                    <div className="space-y-3">
                      {group.items.map((d) => (
                        <div key={d._id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-white text-sm font-semibold">{d.user?.name || "Student"}</span>
                              {d.resolved && <span className="text-[10px] text-emerald-400">✓ Resolved</span>}
                            </div>
                            <button onClick={() => handleDelete(d._id)} className="text-gray-600 hover:text-red-400">
                              <FiTrash2 size={13} />
                            </button>
                          </div>
                          <p className="text-gray-200 text-sm mt-1.5">{d.question}</p>

                          {d.replies?.length > 0 && (
                            <div className="mt-3 pl-3 space-y-2" style={{ borderLeft: "2px solid #1f2937" }}>
                              {d.replies.map((r, i) => (
                                <div key={i}>
                                  <span className="text-xs font-semibold" style={{ color: r.senderRole === "user" ? "#93c5fd" : "#c084fc" }}>
                                    {r.sender?.name || "User"}
                                  </span>
                                  <p className="text-gray-300 text-xs mt-0.5">{r.message}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-2 mt-3">
                            <input
                              value={replyDrafts[d._id] || ""}
                              onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [d._id]: e.target.value }))}
                              placeholder="উত্তর লেখো..."
                              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none"
                            />
                            <button onClick={() => handleReply(d._id)} disabled={replyingId === d._id || !(replyDrafts[d._id] || "").trim()}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-950 disabled:opacity-40"
                              style={{ background: "#22d3ee" }}>
                              Reply
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InstructorDiscussions;
