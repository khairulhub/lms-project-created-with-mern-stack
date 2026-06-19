import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import { FiUsers, FiFileText, FiTag, FiCheckCircle, FiClock } from "react-icons/fi";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ users: 0, blogs: 0, categories: 0, pendingRequests: 0 });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/admin/users"),
      api.get("/admin/blogs"),
      api.get("/admin/categories"),
      api.get("/admin/instructor-requests"),
    ]).then(([users, blogs, cats, requests]) => {
      setStats({
        users: users.data.length,
        blogs: blogs.data.length,
        categories: cats.data.length,
        pendingRequests: requests.data.filter((r) => r.status === "pending").length,
      });
      setRecentUsers(users.data.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: "Total Users", value: stats.users, icon: <FiUsers />, color: "cyan", to: "/admin/users" },
    { label: "Total Blogs", value: stats.blogs, icon: <FiFileText />, color: "purple", to: "/admin/blogs" },
    { label: "Categories", value: stats.categories, icon: <FiTag />, color: "green", to: "/admin/categories" },
    { label: "Pending Requests", value: stats.pendingRequests, icon: <FiClock />, color: "yellow", to: "/admin/instructor-requests" },
  ];

  const roleColors = { admin: "bg-red-500/10 text-red-400", instructor: "bg-purple-500/10 text-purple-400", user: "bg-cyan-500/10 text-cyan-400" };

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Admin Dashboard ⚡</h1>
        <p className="text-gray-400 mb-8">Platform overview</p>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s) => (
            <Link key={s.label} to={s.to}
              className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-5 transition-all group">
              <div className={`text-${s.color}-400 mb-3`}>{s.icon}</div>
              <p className="text-gray-400 text-xs mb-1">{s.label}</p>
              <p className="text-white font-bold text-2xl">{loading ? "—" : s.value}</p>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { to: "/admin/instructor-requests", label: "Review Requests", icon: <FiCheckCircle />, color: "yellow" },
            { to: "/admin/users", label: "Manage Users", icon: <FiUsers />, color: "cyan" },
            { to: "/admin/categories", label: "Add Category", icon: <FiTag />, color: "green" },
            { to: "/admin/blogs", label: "Manage Blogs", icon: <FiFileText />, color: "purple" },
          ].map((action) => (
            <Link key={action.to} to={action.to}
              className={`flex items-center gap-3 bg-gray-900 border border-gray-800 hover:border-${action.color}-500/40 rounded-xl p-4 transition-all`}>
              <span className={`text-${action.color}-400`}>{action.icon}</span>
              <span className="text-white text-sm font-medium">{action.label}</span>
            </Link>
          ))}
        </div>

        {/* Recent Users */}
        <h2 className="text-lg font-semibold text-white mb-4">Recent Users</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-800 rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="px-5 py-3 text-xs font-medium text-gray-400">User</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-400 hidden sm:table-cell">Email</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-400">Role</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u._id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img src={u.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`}
                          className="w-8 h-8 rounded-full bg-gray-700" alt={u.name} />
                        <span className="text-white text-sm font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-sm hidden sm:table-cell">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleColors[u.role]}`}>{u.role}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
