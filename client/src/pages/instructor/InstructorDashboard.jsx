import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import { FiFileText, FiUser, FiPlusCircle, FiEye } from "react-icons/fi";

const InstructorDashboard = () => {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/blogs").then((r) => setBlogs(r.data)).finally(() => setLoading(false));
  }, []);

  const published = blogs.filter((b) => b.isPublished).length;
  const drafts = blogs.filter((b) => !b.isPublished).length;

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Instructor Dashboard 🎓</h1>
        <p className="text-gray-400 mb-8">Manage your content and profile</p>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Blogs", value: blogs.length, icon: <FiFileText />, color: "cyan" },
            { label: "Published", value: published, icon: <FiEye />, color: "green" },
            { label: "Drafts", value: drafts, icon: <FiFileText />, color: "yellow" },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className={`text-${stat.color}-400 mb-2`}>{stat.icon}</div>
              <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
              <p className="text-white font-bold text-2xl">{loading ? "—" : stat.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <Link to="/instructor/blogs"
            className="flex items-center gap-4 bg-gray-900 border border-gray-800 hover:border-cyan-500/40 rounded-xl p-5 transition-all group">
            <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center text-cyan-400">
              <FiFileText size={18} />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Manage Blogs</p>
              <p className="text-gray-500 text-xs">Create, edit, publish your posts</p>
            </div>
          </Link>
          <Link to="/instructor/profile"
            className="flex items-center gap-4 bg-gray-900 border border-gray-800 hover:border-purple-500/40 rounded-xl p-5 transition-all group">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400">
              <FiUser size={18} />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Edit Profile</p>
              <p className="text-gray-500 text-xs">Update bio, photo & designation</p>
            </div>
          </Link>
        </div>

        {/* Recent Blogs */}
        <h2 className="text-lg font-semibold text-white mb-4">Recent Blogs</h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />)}
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-12 bg-gray-900 border border-gray-800 rounded-xl text-gray-500">
            <p className="text-4xl mb-3">✍️</p>
            <p className="mb-4">No blogs yet. Start writing!</p>
            <Link to="/instructor/blogs" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium flex items-center justify-center gap-1">
              <FiPlusCircle size={14} /> Create First Blog
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {blogs.slice(0, 5).map((blog) => (
              <div key={blog._id} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{blog.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{new Date(blog.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`ml-3 text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                  blog.isPublished ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                }`}>
                  {blog.isPublished ? "Published" : "Draft"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InstructorDashboard;
