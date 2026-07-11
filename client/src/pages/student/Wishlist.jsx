// client/src/pages/student/Wishlist.jsx
// Public course listing থেকে save করা course গুলো — enroll করার আগেই।

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiHeart, FiStar, FiUsers, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";

const Wishlist = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    api.get("/wishlist/my")
      .then(({ data }) => setItems(data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (courseId) => {
    setRemovingId(courseId);
    try {
      await api.post("/wishlist/toggle", { courseId });
      setItems((prev) => prev.filter((i) => i.course?._id !== courseId));
    } catch {
      toast.error("Wishlist থেকে সরাতে সমস্যা হয়েছে।");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Wishlist</h1>
        <p className="text-gray-400 mb-6">যেসব কোর্স পরে কেনার জন্য save রেখেছো</p>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ width: 30, height: 30, border: "3px solid #7c3aed", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 text-center">
            <p className="text-6xl mb-4">🤍</p>
            <p className="text-white font-semibold mb-2">Wishlist এখনো খালি</p>
            <p className="text-gray-500 text-sm mb-4">Courses পেজে গিয়ে যেকোনো কোর্স কার্ডে ♡ আইকনে ক্লিক করে save করে রাখতে পারো।</p>
            <button onClick={() => navigate("/courses")}
              className="bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
              কোর্স ব্রাউজ করো
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map(({ course }) => (
              <div key={course._id}
                style={{
                  background: "linear-gradient(160deg,#110224,#0d011f)",
                  border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden",
                }}>
                <div className="bg-gradient-to-br from-cyan-500/20 to-purple-600/20 flex items-center justify-center py-8 relative">
                  <button
                    onClick={() => handleRemove(course._id)}
                    disabled={removingId === course._id}
                    title="Wishlist থেকে সরাও"
                    className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.5)" }}>
                    <FiTrash2 size={13} color="#f87171" />
                  </button>
                  {course.image ? (
                    <img src={course.image} alt={course.title} className="w-full h-28 object-cover" />
                  ) : (
                    <span className="text-5xl">{course.emoji || "📘"}</span>
                  )}
                </div>
                <div className="p-4">
                  <p style={{ color: "#fff", fontWeight: 700, fontSize: 13.5 }} className="line-clamp-2 mb-2">{course.title}</p>
                  <div className="flex items-center gap-3 text-xs mb-3" style={{ color: "#9ca3af" }}>
                    <span className="flex items-center gap-1"><FiStar size={11} style={{ color: "#facc15" }} /> {course.rating}</span>
                    <span className="flex items-center gap-1"><FiUsers size={11} /> {course.students}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>৳{course.price?.toLocaleString()}</span>
                      {course.originalPrice > course.price && (
                        <span style={{ color: "#6b7280", fontSize: 11, textDecoration: "line-through", marginLeft: 6 }}>৳{course.originalPrice?.toLocaleString()}</span>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/courses/${course._id}`)}
                      className="bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-3.5 py-1.5 rounded-lg text-xs transition-colors">
                      বিস্তারিত
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Wishlist;
