import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import {
  FiBookOpen, FiUsers, FiDollarSign, FiStar,
  FiFileText, FiUser, FiTrendingUp, FiMessageSquare,
} from "react-icons/fi";

const StatCard = ({ label, value, sub, icon, color }) => {
  const colors = {
    cyan:   { text: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/20"   },
    green:  { text: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20"  },
    purple: { text: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    yellow: { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  };
  const c = colors[color] || colors.cyan;
  return (
    <div className={`bg-gray-900 border ${c.border} rounded-2xl p-5`}>
      <div className={`w-10 h-10 ${c.bg} ${c.text} rounded-xl flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-white font-bold text-2xl">{value ?? "—"}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  );
};

const InstructorDashboard = () => {
  const { user } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [blogs,   setBlogs]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/instructor/stats"),
      api.get("/admin/blogs"),
    ]).then(([statsRes, blogsRes]) => {
      setStats(statsRes.data);
      setBlogs(blogsRes.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const fmt   = (n) => (n ?? 0).toLocaleString();
  const fmtTk = (n) => "৳" + (n ?? 0).toLocaleString();

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Instructor Dashboard 🎓</h1>
          <p className="text-gray-400 text-sm">স্বাগতম, {user?.name} — তোমার কোর্স ও শিক্ষার্থীদের অবস্থা এখানে</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="আমার Courses"     icon={<FiBookOpen size={18} />}   color="cyan"
            value={loading ? "—" : fmt(stats?.courseCount)}
            sub="Active courses" />
          <StatCard label="Total Students"    icon={<FiUsers size={18} />}      color="green"
            value={loading ? "—" : fmt(stats?.studentCount)}
            sub="Enrolled & approved" />
          <StatCard label="Total Revenue"     icon={<FiDollarSign size={18} />} color="purple"
            value={loading ? "—" : fmtTk(stats?.totalRevenue)}
            sub="Approved enrollments" />
          <StatCard label="Avg Rating"        icon={<FiStar size={18} />}       color="yellow"
            value={loading ? "—" : (stats?.avgRating ?? "N/A")}
            sub={`${fmt(stats?.reviewCount)} reviews`} />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { to: "/instructor/blogs",   label: "Manage Blogs",   sub: "লিখো, edit করো, publish করো", icon: <FiFileText size={16} />,    color: "cyan"   },
              { to: "/instructor/profile", label: "Edit Profile",   sub: "Bio, photo, designation",      icon: <FiUser size={16} />,        color: "purple" },
            ].map((a) => (
              <Link key={a.to} to={a.to}
                className="flex items-center gap-4 bg-gray-900 border border-gray-800 hover:border-cyan-500/30 rounded-xl p-4 transition-all">
                <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center text-gray-300 shrink-0">
                  {a.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium">{a.label}</p>
                  <p className="text-gray-500 text-xs truncate">{a.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">

          {/* My Courses */}
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">আমার Courses</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              {loading ? (
                <div className="p-4 space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-800 rounded animate-pulse" />)}</div>
              ) : !stats?.courses?.length ? (
                <p className="text-gray-500 text-sm text-center py-10">এখনো কোনো course নেই।</p>
              ) : (
                <div className="divide-y divide-gray-800">
                  {stats.courses.map((c) => (
                    <div key={c._id} className="flex items-center gap-3 px-4 py-3">
                      <span className="text-2xl shrink-0">{c.emoji || "🚀"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{c.title}</p>
                        <p className="text-gray-500 text-xs">৳{(c.price || 0).toLocaleString()}</p>
                      </div>
                      {c.badge && (
                        <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full shrink-0">{c.badge}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Enrollments */}
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Recent Enrollments</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              {loading ? (
                <div className="p-4 space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-800 rounded animate-pulse" />)}</div>
              ) : !stats?.recentEnrollments?.length ? (
                <p className="text-gray-500 text-sm text-center py-10">কোনো enrollment নেই।</p>
              ) : (
                <div className="divide-y divide-gray-800">
                  {stats.recentEnrollments.map((e) => (
                    <div key={e._id} className="flex items-center gap-3 px-4 py-3">
                      <img src={e.user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${e.user?.email}`}
                        className="w-8 h-8 rounded-full bg-gray-700 shrink-0" alt={e.user?.name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{e.user?.name || "—"}</p>
                        <p className="text-gray-500 text-xs truncate">{e.course?.title || "—"}</p>
                      </div>
                      <span className="text-green-400 text-xs font-semibold shrink-0">৳{(e.amountPaid || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Recent Reviews</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              {loading ? (
                <div className="p-4 space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-800 rounded animate-pulse" />)}</div>
              ) : !stats?.recentReviews?.length ? (
                <p className="text-gray-500 text-sm text-center py-10">এখনো কোনো review আসেনি।</p>
              ) : (
                <div className="divide-y divide-gray-800">
                  {stats.recentReviews.map((r) => (
                    <div key={r._id} className="px-5 py-4">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-medium">{r.name}</span>
                          <span className="text-gray-500 text-xs">· {r.course?.title}</span>
                        </div>
                        <span className="flex items-center gap-1 text-yellow-400 text-xs font-semibold shrink-0">
                          <FiStar size={11} style={{ fill: "#facc15" }} /> {r.rating}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">{r.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Blogs */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Recent Blogs</h2>
              <Link to="/instructor/blogs" className="text-cyan-400 hover:text-cyan-300 text-xs font-medium">See all</Link>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              {loading ? (
                <div className="p-4 space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-800 rounded animate-pulse" />)}</div>
              ) : !blogs.length ? (
                <p className="text-gray-500 text-sm text-center py-10">কোনো blog নেই।</p>
              ) : (
                <div className="divide-y divide-gray-800">
                  {blogs.slice(0, 5).map((b) => (
                    <div key={b._id} className="flex items-center justify-between px-5 py-3">
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{b.title}</p>
                        <p className="text-gray-500 text-xs">{new Date(b.createdAt).toLocaleDateString("bn-BD")}</p>
                      </div>
                      <span className={`ml-3 text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${b.isPublished ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                        {b.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default InstructorDashboard;
