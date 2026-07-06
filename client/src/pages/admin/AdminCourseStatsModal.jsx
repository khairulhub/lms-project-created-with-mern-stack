import { useEffect, useState } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { FiX, FiUsers, FiDollarSign, FiStar, FiTrendingUp } from "react-icons/fi";

const AdminCourseStatsModal = ({ course, onClose }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/courses/${course._id}/stats`)
      .then((r) => setStats(r.data))
      .catch(() => toast.error("Stats load failed"))
      .finally(() => setLoading(false));
  }, [course._id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-gray-900 border border-gray-800 rounded-2xl"
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h2 className="text-white font-bold text-lg">{course.emoji} {course.title}</h2>
            <p className="text-gray-500 text-xs mt-0.5">Admin — Per-course Sales & Review Stats</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><FiX size={20} /></button>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-800 rounded animate-pulse" />)}</div>
        ) : !stats ? (
          <p className="text-center text-gray-500 py-10">Stats load হলো না।</p>
        ) : (
          <div className="p-5 space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Enrollments", value: stats.totalEnrollments, icon: <FiTrendingUp size={16} />, color: "cyan"   },
                { label: "Approved Students", value: stats.approvedCount,    icon: <FiUsers size={16} />,      color: "green"  },
                { label: "Revenue",           value: "৳" + (stats.totalRevenue||0).toLocaleString(), icon: <FiDollarSign size={16} />, color: "purple" },
                { label: "Avg Rating",        value: stats.avgRating ?? "—", icon: <FiStar size={16} />,       color: "yellow" },
              ].map((s) => {
                const c = { cyan:"text-cyan-400 bg-cyan-500/10", green:"text-green-400 bg-green-500/10", purple:"text-purple-400 bg-purple-500/10", yellow:"text-yellow-400 bg-yellow-500/10" }[s.color];
                return (
                  <div key={s.label} className="bg-gray-800 rounded-xl p-3">
                    <div className={`w-8 h-8 rounded-lg ${c} flex items-center justify-center mb-2`}>{s.icon}</div>
                    <p className="text-gray-400 text-xs">{s.label}</p>
                    <p className="text-white font-bold text-lg">{s.value ?? "0"}</p>
                  </div>
                );
              })}
            </div>

            {/* Enrollment breakdown */}
            <div className="flex gap-3">
              {[
                { label: "Pending",  count: stats.pendingCount,  cls: "bg-yellow-500/10 text-yellow-400" },
                { label: "Approved", count: stats.approvedCount, cls: "bg-green-500/10  text-green-400"  },
                { label: "Rejected", count: stats.rejectedCount, cls: "bg-red-500/10    text-red-400"    },
              ].map((b) => (
                <div key={b.label} className={`flex-1 rounded-xl px-3 py-2 text-center ${b.cls}`}>
                  <p className="font-bold text-lg">{b.count}</p>
                  <p className="text-xs">{b.label}</p>
                </div>
              ))}
            </div>

            {/* Recent enrollments */}
            {stats.recentEnrollments?.length > 0 && (
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">Recent Approved Students</p>
                <div className="space-y-2">
                  {stats.recentEnrollments.map((e) => (
                    <div key={e._id} className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-2.5">
                      <img src={e.user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${e.user?.email}`}
                        className="w-7 h-7 rounded-full bg-gray-700 shrink-0" alt={e.user?.name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{e.user?.name || "—"}</p>
                        <p className="text-gray-500 text-xs">{e.user?.email}</p>
                      </div>
                      <span className="text-green-400 text-xs font-semibold shrink-0">৳{(e.amountPaid||0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent reviews */}
            {stats.recentReviews?.length > 0 && (
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">Recent Reviews</p>
                <div className="space-y-2">
                  {stats.recentReviews.map((r) => (
                    <div key={r._id} className="bg-gray-800 rounded-xl px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-white text-sm font-medium">{r.name}</p>
                        <span className="text-yellow-400 text-xs font-bold">⭐ {r.rating}</span>
                      </div>
                      <p className="text-gray-400 text-sm">{r.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.totalEnrollments === 0 && stats.reviewCount === 0 && (
              <p className="text-center text-gray-500 text-sm py-4">এখনো কোনো enrollment বা review নেই।</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCourseStatsModal;
