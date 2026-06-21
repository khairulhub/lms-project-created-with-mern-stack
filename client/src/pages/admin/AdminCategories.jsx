import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave } from "react-icons/fi";

const emptyForm = { name: "", description: "", icon: "📁", isActive: true };

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchCats = () => {
    setLoading(true);
    api.get("/admin/categories").then((r) => setCategories(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCats(); }, []);

  const openCreate = () => { setEditCat(null); setForm(emptyForm); setModal(true); };
  const openEdit = (cat) => { setEditCat(cat); setForm({ name: cat.name, description: cat.description, icon: cat.icon, isActive: cat.isActive }); setModal(true); };

  const handleSave = async () => {
    if (!form.name) return toast.error("Name required");
    setSaving(true);
    try {
      if (editCat) {
        await api.put(`/admin/categories/${editCat._id}`, form);
        toast.success("Category updated!");
      } else {
        await api.post("/admin/categories", form);
        toast.success("Category created!");
      }
      setModal(false);
      fetchCats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      toast.success("Category deleted");
      fetchCats();
    } catch { toast.error("Delete failed"); }
  };

  const inputClass = "w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors";

  return (
    <DashboardLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Categories</h2>
            <p className="text-gray-400 text-sm">{categories.length} total</p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-4 py-2.5 rounded-xl transition-colors text-sm">
            <FiPlus size={16} /> Add Category
          </button>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-gray-800 rounded-xl animate-pulse" />)}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No categories yet. Create one!</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div key={cat._id} className={`bg-gray-900 border rounded-xl p-5 transition-all ${cat.isActive ? "border-gray-800" : "border-gray-800 opacity-60"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{cat.icon}</span>
                    <div>
                      <p className="text-white font-semibold text-sm">{cat.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${cat.isActive ? "text-green-400 bg-green-500/10" : "text-gray-500 bg-gray-700"}`}>
                        {cat.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(cat)} className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-gray-800 rounded-lg transition-colors">
                      <FiEdit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(cat._id, cat.name)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
                {cat.description && <p className="text-gray-500 text-xs line-clamp-2">{cat.description}</p>}
                {cat.createdBy && <p className="text-gray-600 text-xs mt-2">By: {cat.createdBy.name}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="text-white font-bold text-lg">{editCat ? "Edit Category" : "New Category"}</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-white"><FiX size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-3">
                <div className="w-20">
                  <label className="block text-xs font-medium text-gray-400 mb-1">Icon</label>
                  <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-center text-2xl focus:outline-none focus:border-cyan-500" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-400 mb-1">Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Category name" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3} placeholder="Short description..." className={inputClass + " resize-none"} />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center ${form.isActive ? "bg-cyan-500" : "bg-gray-700"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform ${form.isActive ? "translate-x-5" : ""}`} />
                </div>
                <span className="text-sm text-gray-300">Active</span>
              </label>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-gray-950 font-bold px-5 py-2.5 rounded-xl transition-colors text-sm">
                <FiSave size={15} /> {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setModal(false)} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminCategories;
