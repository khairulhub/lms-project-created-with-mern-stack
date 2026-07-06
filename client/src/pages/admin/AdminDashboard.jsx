import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import {
  FiUsers, FiFileText, FiTag, FiClock, FiCheckCircle,
  FiTrendingUp, FiDollarSign, FiBookOpen, FiAlertCircle,
  FiShoppingBag, FiPercent, FiAward,
} from "react-icons/fi";

const colorMap = {
  cyan:   { border: "border-cyan-500/30",   text: "text-cyan-400",   bg: "bg-cyan-500/10"   },
  purple: { border: "border-purple-500/30", text: "text-purple-400", bg: "bg-purple-500/10" },
  green:  { border: "border-green-500/30",  text: "text-green-400",  bg: "bg-green-500/10"  },
  yellow: { border: "border-yellow-500/30", text: "text-yellow-400", bg: "bg-yellow-500/10" },
  pink:   { border: "border-pink-500/30",   text: "text-pink-400",   bg: "bg-pink-500/10"   },
  red:    { border: "border-red-500/30",    text: "text-red-400",    bg: "bg-red-500/10"    },
  orange: { border: "border-orange-500/30", text: "text-orange-400", bg: "bg-orange-500/10" },
};

const StatCard = ({ label, value, icon, color, to, sub }) => {
  const c = colorMap[color] || colorMap.cyan;
  const inner = (
    <div className={`bg-gray-900 border ${c.border} hover:brightness-110 rounded-2xl p-5 transition-all h-full`}>
      <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center ${c.text} mb-4`}>
        {icon}
      </div>
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-white font-bold text-2xl">{value ?? "—"}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : <div>{inner}</div>;
};

const statusBadge = (status) => {
  const map = {
    pending:  "bg-yellow-500/10 text-yellow-400",
    approved: "bg-green-500/10 text-green-400",
    rejected: "bg-red-500/10 text-red-400",
  };
  return <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${map[status] || ""}`}>{status}</span>;
};

const AdminDashboard = () => {
  const { user } = useAuth();

  const [platformStats, setPlatformStats] = useState(null);
  const [enrollStats,   setEnrollStats]   = useState(null);
  const [recentUsers,   setRecentUsers]   = useState([]);
  const [recentEnrolls, setRecentEnrolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/admin/users"),
      api.get("/admin/blogs"),
      api.get("/admin/categories"),
      api.get("/admin/instructor-requests"),
      api.get("/admin/enrollments/stats"),
      api.get("/admin/enrollments?status=all&limit=5"),
    ]).then(([users, blogs, cats, requests, eStats, recentE]) => {
      setPlatformStats({
        users:           users.data.length,
        blogs:           blogs.data.length,
        categories:      cats.data.length,
        pendingRequests: requests.data.filter((r) => r.status === "pending").length,
      });
      setEnrollStats(eStats.data);
      setRecentUsers(users.data.slice(0, 5));
      setRecentEnrolls((recentE.data?.enrollments || recentE.data || []).slice(0, 5));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const fmt = (n) => (n ?? 0).toLocaleString();
  const fmtTk = (n) => "৳" + (n ?? 0).toLocaleString();

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Admin Dashboard ⚡</h1>
          <p className="text-gray-400 text-sm">স্বাগতম, {user?.name} — platform-এর সার্বিক অবস্থা এখানে দেখো</p>
        </div>

        {/* ── Enrollment / Revenue stats ─────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Enrollment & Revenue</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Pending Enrollments" icon={<FiAlertCircle size={18} />} color="yellow"
              value={loading ? "—" : fmt(enrollStats?.pending)}
              sub="Admin review দরকার" to="/admin/enrollments" />
            <StatCard label="Approved Students" icon={<FiAward size={18} />} color="green"
              value={loading ? "—" : fmt(enrollStats?.uniqueStudents)}
              sub="Unique enrolled users" to="/admin/enrollments" />
            <StatCard label="Total Enrollments" icon={<FiShoppingBag size={18} />} color="purple"
              value={loading ? "—" : fmt(enrollStats?.total)}
              sub={`${fmt(enrollStats?.rejected)} rejected`} to="/admin/enrollments" />
            <StatCard label="Total Revenue" icon={<FiDollarSign size={18} />} color="cyan"
              value={loading ? "—" : fmtTk(enrollStats?.totalRevenue)}
              sub="Approved enrollments থেকে" />
          </div>
        </div>

        {/* ── Platform stats ─────────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Platform</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Users"       icon={<FiUsers size={18} />}    color="cyan"
              value={loading ? "—" : fmt(platformStats?.users)} to="/admin/users" />
            <StatCard label="Total Blogs"       icon={<FiFileText size={18} />} color="purple"
              value={loading ? "—" : fmt(platformStats?.blogs)} to="/admin/blogs" />
            <StatCard label="Categories"        icon={<FiBookOpen size={18} />} color="green"
              value={loading ? "—" : fmt(platformStats?.categories)} to="/admin/categories" />
            <StatCard label="Pending Requests"  icon={<FiClock size={18} />}    color="orange"
              value={loading ? "—" : fmt(platformStats?.pendingRequests)}
              sub="Instructor requests" to="/admin/instructor-requests" />
          </div>
        </div>

        {/* ── Quick Actions ──────────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { to: "/admin/enrollments",        label: "Review Enrollments", icon: <FiCheckCircle size={15} />, color: "yellow" },
              { to: "/admin/instructor-requests",label: "Instructor Requests",icon: <FiUsers size={15} />,       color: "orange" },
              { to: "/admin/coupons",            label: "Coupon Manager",     icon: <FiPercent size={15} />,     color: "pink"   },
              { to: "/admin/categories",         label: "Manage Courses",     icon: <FiBookOpen size={15} />,    color: "green"  },
              { to: "/admin/blogs",              label: "Manage Blogs",       icon: <FiFileText size={15} />,    color: "purple" },
              { to: "/admin/users",              label: "Manage Users",       icon: <FiUsers size={15} />,       color: "cyan"   },
              { to: "/admin/course-reviews",     label: "Course Reviews",     icon: <FiTrendingUp size={15} />,  color: "green"  },
              { to: "/admin/student-reviews",    label: "Student Reviews",    icon: <FiTag size={15} />,         color: "purple" },
            ].map((a) => {
              const c = colorMap[a.color] || colorMap.cyan;
              return (
                <Link key={a.to} to={a.to}
                  className={`flex items-center gap-3 bg-gray-900 border border-gray-800 hover:${c.border} rounded-xl p-4 transition-all`}>
                  <span className={c.text}>{a.icon}</span>
                  <span className="text-white text-sm font-medium">{a.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">

          {/* ── Recent Enrollments ──────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Recent Enrollments</h2>
              <Link to="/admin/enrollments" className="text-cyan-400 hover:text-cyan-300 text-xs font-medium">See all</Link>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              {loading ? (
                <div className="p-4 space-y-2">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-800 rounded animate-pulse" />)}
                </div>
              ) : recentEnrolls.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">কোনো enrollment নেই</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="px-4 py-3 text-xs text-gray-400 text-left">Student</th>
                      <th className="px-4 py-3 text-xs text-gray-400 text-left hidden sm:table-cell">Course</th>
                      <th className="px-4 py-3 text-xs text-gray-400 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEnrolls.map((e) => (
                      <tr key={e._id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/40 transition-colors">
                        <td className="px-4 py-3 text-white text-sm">{e.user?.name || "—"}</td>
                        <td className="px-4 py-3 text-gray-400 text-sm truncate max-w-[120px] hidden sm:table-cell">{e.course?.title || "—"}</td>
                        <td className="px-4 py-3">{statusBadge(e.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* ── Recent Users ─────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Recent Users</h2>
              <Link to="/admin/users" className="text-cyan-400 hover:text-cyan-300 text-xs font-medium">See all</Link>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              {loading ? (
                <div className="p-4 space-y-2">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-800 rounded animate-pulse" />)}
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="px-4 py-3 text-xs text-gray-400 text-left">User</th>
                      <th className="px-4 py-3 text-xs text-gray-400 text-left hidden sm:table-cell">Email</th>
                      <th className="px-4 py-3 text-xs text-gray-400 text-left">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map((u) => {
                      const roleColor = { admin: "bg-red-500/10 text-red-400", instructor: "bg-purple-500/10 text-purple-400", user: "bg-cyan-500/10 text-cyan-400" };
                      return (
                        <tr key={u._id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/40 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <img src={u.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`}
                                className="w-7 h-7 rounded-full bg-gray-700 shrink-0" alt={u.name} />
                              <span className="text-white text-sm">{u.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-sm hidden sm:table-cell">{u.email}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor[u.role] || ""}`}>{u.role}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
