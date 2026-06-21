import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { FiTrash2, FiEye, FiSearch, FiExternalLink } from "react-icons/fi";
import { Link } from "react-router-dom";

const AdminBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchBlogs = () => {
    setLoading(true);
    api.get("/admin/blogs").then((r) => setBlogs(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchBlogs(); }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await api.delete(`/admin/blogs/${id}`);
      toast.success("Blog deleted");
      fetchBlogs();
    } catch { toast.error("Delete failed"); }
  };

  const handleTogglePublish = async (blog) => {
    try {
      await api.put(`/admin/blogs/${blog._id}`, { isPublished: !blog.isPublished });
      toast.success(blog.isPublished ? "Unpublished" : "Published");
      fetchBlogs();
    } catch { toast.error("Update failed"); }
  };

  const filtered = blogs.filter((b) => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || (statusFilter === "published" ? b.isPublished : !b.isPublished);
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout>
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">All Blogs</h2>
          <p className="text-gray-400 text-sm">{filtered.length} of {blogs.length} blogs</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title or author..."
              className="w-full bg-gray-900 border border-gray-800 text-white placeholder-gray-500 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none cursor-pointer">
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-5 py-3 text-xs font-medium text-gray-400">Title</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-400">Author</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-400">Category</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-400">Status</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-400">Date</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-5 py-3"><div className="h-10 bg-gray-800 rounded-lg animate-pulse" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-500">No blogs found</td></tr>
              ) : filtered.map((blog) => (
                <tr key={blog._id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-white text-sm font-medium line-clamp-1 max-w-xs">{blog.title}</p>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <img src={blog.author?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${blog.author?.email}`}
                        className="w-6 h-6 rounded-full bg-gray-700 shrink-0" alt="" />
                      <span className="text-gray-300 text-sm">{blog.author?.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-sm">{blog.category?.name || "—"}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => handleTogglePublish(blog)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                        blog.isPublished ? "bg-green-500/10 text-green-400 hover:bg-green-500/20" : "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                      }`}>
                      {blog.isPublished ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{new Date(blog.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      {blog.isPublished && (
                        <Link to={`/blogs/${blog.slug}`} target="_blank"
                          className="p-2 text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors">
                          <FiExternalLink size={14} />
                        </Link>
                      )}
                      <button onClick={() => handleDelete(blog._id, blog.title)}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminBlogs;
