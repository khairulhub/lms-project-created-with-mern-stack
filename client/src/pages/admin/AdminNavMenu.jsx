import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { FiPlus, FiTrash2, FiEdit2, FiSave, FiX, FiArrowUp, FiArrowDown, FiImage } from "react-icons/fi";

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

const AdminNavMenu = () => {
  const [menus, setMenus] = useState([]);
  const [config, setConfig] = useState({ siteName: "LMS", logoText: "LMS", logoUrl: "", showLogoImage: false, enrollUrl: "/enroll" });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ label: "", path: "", isActive: true, openInNewTab: false });
  const [saving, setSaving] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.get("/admin/nav/menus"), api.get("/nav/config")])
      .then(([m, c]) => { setMenus(m.data); setConfig(c.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditItem(null); setForm({ label: "", path: "", isActive: true, openInNewTab: false }); setModal(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ label: item.label, path: item.path, isActive: item.isActive, openInNewTab: item.openInNewTab }); setModal(true); };

  const handleSave = async () => {
    if (!form.label || !form.path) return toast.error("Label and path required");
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/admin/nav/menus/${editItem._id}`, form);
        toast.success("Menu updated!");
      } else {
        await api.post("/admin/nav/menus", form);
        toast.success("Menu created!");
      }
      setModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, label, isDefault) => {
    if (isDefault) return toast.error("Cannot delete default menu items");
    if (!window.confirm(`Delete "${label}"?`)) return;
    try {
      await api.delete(`/admin/nav/menus/${id}`);
      toast.success("Deleted");
      fetchData();
    } catch { toast.error("Delete failed"); }
  };

  const handleReorder = async (id, direction) => {
    const idx = menus.findIndex((m) => m._id === id);
    const newMenus = [...menus];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= newMenus.length) return;
    [newMenus[idx], newMenus[swapIdx]] = [newMenus[swapIdx], newMenus[idx]];
    const items = newMenus.map((m, i) => ({ _id: m._id, order: i }));
    setMenus(newMenus);
    try {
      await api.put("/admin/nav/menus/reorder", { items });
    } catch { fetchData(); }
  };

  // imgBB logo upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!IMGBB_API_KEY) return toast.error("Add VITE_IMGBB_API_KEY to .env");
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setConfig({ ...config, logoUrl: data.data.url, showLogoImage: true });
        toast.success("Logo uploaded!");
      } else {
        toast.error("Upload failed");
      }
    } catch { toast.error("Upload error"); }
    finally { setUploadingLogo(false); }
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      await api.put("/admin/nav/config", config);
      toast.success("Site config saved!");
    } catch { toast.error("Save failed"); }
    finally { setSavingConfig(false); }
  };

  const inputClass = "w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors";

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <h2 className="text-2xl font-bold text-white mb-8">Navbar Management</h2>

        {/* ── SITE CONFIG ────────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <h3 className="text-white font-semibold mb-4 text-lg">Logo & Site Settings</h3>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Site Name</label>
                <input value={config.siteName} onChange={(e) => setConfig({ ...config, siteName: e.target.value })}
                  placeholder="LMS Platform" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Logo Text (fallback)</label>
                <input value={config.logoText} onChange={(e) => setConfig({ ...config, logoText: e.target.value })}
                  placeholder="LMS" className={inputClass} />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Enroll Button Link</label>
              <input value={config.enrollUrl} onChange={(e) => setConfig({ ...config, enrollUrl: e.target.value })}
                placeholder="/enroll" className={inputClass} />
            </div>

            {/* Logo upload */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">Logo Image (via imgBB)</label>
              <div className="flex items-center gap-4">
                {config.logoUrl && (
                  <img src={config.logoUrl} alt="logo" className="h-10 object-contain bg-gray-800 rounded-lg p-1" />
                )}
                <label className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-4 py-2.5 rounded-xl cursor-pointer transition-colors text-sm">
                  <FiImage size={15} />
                  {uploadingLogo ? "Uploading..." : "Upload Logo"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                </label>
                {config.logoUrl && (
                  <button onClick={() => setConfig({ ...config, logoUrl: "", showLogoImage: false })}
                    className="text-red-400 text-xs hover:underline">Remove</button>
                )}
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setConfig({ ...config, showLogoImage: !config.showLogoImage })}
                className={`w-11 h-6 rounded-full transition-colors flex items-center ${config.showLogoImage ? "bg-cyan-500" : "bg-gray-700"}`}>
                <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform ${config.showLogoImage ? "translate-x-5" : ""}`} />
              </div>
              <span className="text-sm text-gray-300">Use image logo (otherwise shows text)</span>
            </label>

            <button onClick={handleSaveConfig} disabled={savingConfig}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-gray-950 font-bold px-5 py-2.5 rounded-xl transition-colors text-sm">
              <FiSave size={15} /> {savingConfig ? "Saving..." : "Save Config"}
            </button>
          </div>
        </div>

        {/* ── MENU ITEMS ─────────────────────────────── */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-lg">Menu Items</h3>
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-4 py-2 rounded-xl transition-colors text-sm">
            <FiPlus size={15} /> Add Menu
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-800 rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="space-y-2">
            {menus.map((item, idx) => (
              <div key={item._id}
                className={`flex items-center justify-between bg-gray-900 border rounded-xl px-4 py-3 ${item.isActive ? "border-gray-800" : "border-gray-800 opacity-50"}`}>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => handleReorder(item._id, "up")} disabled={idx === 0}
                      className="text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors"><FiArrowUp size={13} /></button>
                    <button onClick={() => handleReorder(item._id, "down")} disabled={idx === menus.length - 1}
                      className="text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors"><FiArrowDown size={13} /></button>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{item.label}</p>
                    <p className="text-gray-500 text-xs">{item.path}</p>
                  </div>
                  {item.isDefault && <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">default</span>}
                  {!item.isActive && <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full">hidden</span>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(item)} className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-gray-800 rounded-lg transition-colors">
                    <FiEdit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(item._id, item.label, item.isDefault)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <FiTrash2 size={14} />
                  </button>
                </div>
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
              <h3 className="text-white font-bold">{editItem ? "Edit Menu Item" : "New Menu Item"}</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-white"><FiX size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Label *</label>
                <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="e.g. Courses" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Path / URL *</label>
                <input value={form.path} onChange={(e) => setForm({ ...form, path: e.target.value })}
                  placeholder="e.g. /courses or https://..." className={inputClass} />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="accent-cyan-500" />
                  Active (visible)
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                  <input type="checkbox" checked={form.openInNewTab} onChange={(e) => setForm({ ...form, openInNewTab: e.target.checked })}
                    className="accent-cyan-500" />
                  Open in new tab
                </label>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-gray-950 font-bold px-5 py-2.5 rounded-xl transition-colors text-sm">
                <FiSave size={15} /> {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setModal(false)} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminNavMenu;
