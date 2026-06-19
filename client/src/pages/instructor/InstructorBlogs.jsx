import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff, FiX, FiSave } from "react-icons/fi";

const emptyForm = { title: "", excerpt: "", content: "", coverImage: "", category: "", tags: "", isPublished: false };

const InstructorBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editBlog, setEditBlog] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const fetchBlogs = () => {
    setLoading(true);
    api.get("/admin/blogs").then((r) => setBlogs(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBlogs();
    api.get("/categories").then((r) => setCategories(r.data));
  }, []);

  const openCreate = () => { setEditBlog(null); setForm(emptyForm); setModal(true); };
  const openEdit = (blog) => {
    setEditBlog(blog);
    setForm({
      title: blog.title, excerpt: blog.excerpt, content: blog.content,
      coverImage: blog.coverImage, category: blog.category?._id || blog.category,
      tags: blog.tags?.join(", ") || "", isPublished: blog.isPublished,
    });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.content || !form.category) return toast.error("Title, content & category required");
    setSaving(true);
    const payload = { ...form, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean) };
    try {
      if (editBlog) {
        await api.put(`/admin/blogs/${editBlog._id}`, payload);
        toast.success("Blog updated!");
      } else {
        await api.post("/admin/blogs", payload);
        toast.success("Blog created!");
      }
      setModal(false);
      fetchBlogs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this blog?")) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/blogs/${id}`);
      toast.success("Blog deleted");
      fetchBlogs();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const inputClass = "w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors";

  return (
    <DashboardLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">My Blogs</h2>
            <p className="text-gray-400 text-sm">{blogs.length} total</p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-4 py-2.5 rounded-xl transition-colors text-sm">
            <FiPlus size={16} /> New Blog
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />)}</div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-5xl mb-4">✍️</p>
            <p>No blogs yet. Create your first one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {blogs.map((blog) => (
              <div key={blog._id} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-white font-medium text-sm truncate">{blog.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-gray-500 text-xs">{blog.category?.name}</span>
                    <span className="text-gray-600 text-xs">{new Date(blog.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    blog.isPublished ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                  }`}>{blog.isPublished ? "Published" : "Draft"}</span>
                  <button onClick={() => openEdit(blog)} className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-gray-800 rounded-lg transition-colors">
                    <FiEdit2 size={15} />
                  </button>
                  <button onClick={() => handleDelete(blog._id)} disabled={deleting === blog._id}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <FiTrash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blog Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 overflow-y-auto py-8 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="text-white font-bold text-lg">{editBlog ? "Edit Blog" : "New Blog"}</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-white p-1"><FiX size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Title *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Blog title" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Category *</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className={inputClass + " cursor-pointer"}>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c._id} value={c._id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Excerpt</label>
                <textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  rows={2} placeholder="Short summary..." className={inputClass + " resize-none"} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Content * (HTML supported)</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={7} placeholder="<h2>Introduction</h2><p>Your content here...</p>" className={inputClass + " resize-none font-mono text-xs"} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Cover Image URL</label>
                <input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} placeholder="https://..." className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Tags (comma separated)</label>
                <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="react, nodejs, tutorial" className={inputClass} />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setForm({ ...form, isPublished: !form.isPublished })}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center ${form.isPublished ? "bg-cyan-500" : "bg-gray-700"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform ${form.isPublished ? "translate-x-5" : ""}`} />
                </div>
                <span className="text-sm text-gray-300">{form.isPublished ? "Published" : "Draft"}</span>
              </label>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-gray-950 font-bold px-6 py-2.5 rounded-xl transition-colors text-sm">
                <FiSave size={15} /> {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setModal(false)} className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default InstructorBlogs;
