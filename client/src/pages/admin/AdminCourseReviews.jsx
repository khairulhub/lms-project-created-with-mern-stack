import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiStar } from "react-icons/fi";

const inputClass = "w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors";
const labelClass = "block text-xs font-medium text-gray-400 mb-1";

const EMPTY_FORM = { name: "", role: "", avatarSeed: "", rating: 5, text: "", isActive: true, order: 0 };

const StarPicker = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <button key={s} type="button" onClick={() => onChange(s)}>
        <FiStar size={22} className={s <= value ? "text-yellow-400" : "text-gray-600"}
          style={{ fill: s <= value ? "#facc15" : "none" }} />
      </button>
    ))}
  </div>
);

const AdminCourseReviews = () => {
  const [settings,       setSettings]       = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [reviews,        setReviews]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [modal,          setModal]          = useState(false);
  const [editReview,     setEditReview]     = useState(null);
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [saving,         setSaving]         = useState(false);

  // ── fetch ─────────────────────────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sRes, rRes] = await Promise.all([
        api.get("/admin/course-reviews/settings"),
        api.get("/admin/course-reviews"),
      ]);
      setSettings(sRes.data);
      setReviews(rRes.data);
    } catch { toast.error("Data load korte parlam na"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── settings save ─────────────────────────────────────────────────────
  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      const res = await api.put("/admin/course-reviews/settings", {
        heading:      settings.heading,
        avgRating:    settings.avgRating,
        totalReviews: settings.totalReviews,
        displayStyle: settings.displayStyle,
        autoSlideMs:  settings.autoSlideMs,
      });
      setSettings(res.data);
      toast.success("Settings saved!");
    } catch { toast.error("Save failed"); }
    finally { setSettingsSaving(false); }
  };

  // ── design toggle ─────────────────────────────────────────────────────
  const handleStyleToggle = async (style) => {
    if (settings?.displayStyle === style) return;
    const prev = settings;
    setSettings((s) => ({ ...s, displayStyle: style }));
    try {
      const res = await api.put("/admin/course-reviews/settings", { displayStyle: style });
      setSettings(res.data);
      toast.success(`Design "${style === "grid-slider" ? "Grid Slider" : "Side Slider"}" active`);
    } catch { setSettings(prev); toast.error("Style change failed"); }
  };

  // ── modal ─────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditReview(null);
    setForm({ ...EMPTY_FORM, order: reviews.length });
    setModal(true);
  };

  const openEdit = (r) => {
    setEditReview(r);
    setForm({ name: r.name, role: r.role, avatarSeed: r.avatarSeed, rating: r.rating, text: r.text, isActive: r.isActive, order: r.order });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Name required");
    if (!form.text.trim()) return toast.error("Review text required");
    setSaving(true);
    const payload = { ...form, rating: Number(form.rating), order: Number(form.order),
      avatarSeed: form.avatarSeed.trim() || form.name.toLowerCase().replace(/\s+/g, "") };
    try {
      if (editReview) { await api.put(`/admin/course-reviews/${editReview._id}`, payload); toast.success("Updated!"); }
      else            { await api.post("/admin/course-reviews", payload);                   toast.success("Created!"); }
      setModal(false); fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete review by "${name}"?`)) return;
    try { await api.delete(`/admin/course-reviews/${id}`); toast.success("Deleted"); fetchAll(); }
    catch { toast.error("Delete failed"); }
  };

  const toggleActive = async (r) => {
    try { await api.put(`/admin/course-reviews/${r._id}`, { isActive: !r.isActive }); fetchAll(); }
    catch { toast.error("Status update failed"); }
  };

  const activeCount = reviews.filter((r) => r.isActive).length;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Reviews Section</h2>
        <p className="text-gray-400 text-sm">"শিক্ষার্থীরা কী বলছে?" — সব active reviews দেখাবে auto-slide সহ।</p>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-800 rounded-xl animate-pulse" />)}</div>
      ) : (<>

        {/* ════ SETTINGS ════ */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 space-y-4">
          <h3 className="text-white font-semibold text-lg">Section Settings</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Heading</label>
              <input value={settings?.heading || ""} onChange={(e) => setSettings((s) => ({ ...s, heading: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Auto-slide Speed (ms)</label>
              <select value={settings?.autoSlideMs || 3000}
                onChange={(e) => setSettings((s) => ({ ...s, autoSlideMs: Number(e.target.value) }))}
                className={inputClass}>
                <option value={2000}>2 সেকেন্ড</option>
                <option value={3000}>3 সেকেন্ড</option>
                <option value={4000}>4 সেকেন্ড</option>
                <option value={5000}>5 সেকেন্ড</option>
                <option value={7000}>7 সেকেন্ড</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Average Rating (e.g. 4.8)</label>
              <input type="number" step="0.1" min="1" max="5"
                value={settings?.avgRating || 4.8}
                onChange={(e) => setSettings((s) => ({ ...s, avgRating: e.target.value }))}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Total Reviews Count (e.g. ১২,৪৮০)</label>
              <input value={settings?.totalReviews || ""}
                onChange={(e) => setSettings((s) => ({ ...s, totalReviews: e.target.value }))}
                className={inputClass} />
            </div>
          </div>
          <button onClick={handleSaveSettings} disabled={settingsSaving}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-gray-950 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
            <FiSave size={14} /> {settingsSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>

        {/* ════ DESIGN TOGGLE ════ */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-white font-semibold text-lg mb-1">Display Design</h3>
          <p className="text-gray-500 text-xs mb-4">একটা active থাকলে অন্যটা automatically inactive হবে।</p>
          <div className="grid sm:grid-cols-2 gap-4">

            {/* Design 1 — Grid Slider */}
            <button onClick={() => handleStyleToggle("grid-slider")}
              className={`relative rounded-xl border-2 p-5 text-left transition-all ${settings?.displayStyle === "grid-slider" ? "border-cyan-500 bg-cyan-500/10" : "border-gray-700 bg-gray-800 hover:border-gray-600"}`}>
              {settings?.displayStyle === "grid-slider" && (
                <span className="absolute top-3 right-3 text-xs bg-cyan-500 text-gray-950 font-bold px-2 py-0.5 rounded-full">Active</span>
              )}
              {/* Preview visual */}
              <div className="mb-3 space-y-1.5">
                <div className={`h-3 w-28 rounded mx-auto ${settings?.displayStyle === "grid-slider" ? "bg-cyan-500/40" : "bg-gray-600"}`} />
                <div className={`h-2 w-20 rounded mx-auto ${settings?.displayStyle === "grid-slider" ? "bg-cyan-500/20" : "bg-gray-700"}`} />
                <div className="flex gap-1 mt-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className={`flex-1 h-10 rounded-lg ${settings?.displayStyle === "grid-slider" ? "bg-cyan-500/20" : "bg-gray-600"}`} />
                  ))}
                </div>
              </div>
              <p className={`font-bold text-sm mb-1 ${settings?.displayStyle === "grid-slider" ? "text-white" : "text-gray-400"}`}>Grid Slider</p>
              <p className="text-gray-500 text-xs">উপরে heading + stars, নিচে ৩-card auto-slider।</p>
            </button>

            {/* Design 2 — Side Slider */}
            <button onClick={() => handleStyleToggle("side-slider")}
              className={`relative rounded-xl border-2 p-5 text-left transition-all ${settings?.displayStyle === "side-slider" ? "border-cyan-500 bg-cyan-500/10" : "border-gray-700 bg-gray-800 hover:border-gray-600"}`}>
              {settings?.displayStyle === "side-slider" && (
                <span className="absolute top-3 right-3 text-xs bg-cyan-500 text-gray-950 font-bold px-2 py-0.5 rounded-full">Active</span>
              )}
              {/* Preview visual */}
              <div className="flex gap-2 mb-3">
                <div className="flex-1 space-y-1.5">
                  <div className={`h-3 w-full rounded ${settings?.displayStyle === "side-slider" ? "bg-cyan-500/40" : "bg-gray-600"}`} />
                  <div className={`h-2 w-3/4 rounded ${settings?.displayStyle === "side-slider" ? "bg-cyan-500/20" : "bg-gray-700"}`} />
                  <div className={`h-2 w-1/2 rounded ${settings?.displayStyle === "side-slider" ? "bg-cyan-500/20" : "bg-gray-700"}`} />
                </div>
                <div className={`flex-1 h-16 rounded-lg ${settings?.displayStyle === "side-slider" ? "bg-cyan-500/20" : "bg-gray-600"}`} />
              </div>
              <p className={`font-bold text-sm mb-1 ${settings?.displayStyle === "side-slider" ? "text-white" : "text-gray-400"}`}>Side Slider</p>
              <p className="text-gray-500 text-xs">বাম দিকে heading + rating bars, ডান দিকে ১-card auto-slider।</p>
            </button>
          </div>
        </div>

        {/* ════ REVIEWS LIST ════ */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold text-lg">Reviews</h3>
            <p className="text-gray-400 text-sm">{reviews.length} total · {activeCount} active দেখাবে</p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-4 py-2.5 rounded-xl text-sm transition-colors">
            <FiPlus size={16} /> Add Review
          </button>
        </div>

        {reviews.length === 0 ? (
          <p className="text-center text-gray-600 py-10">Kono review nei.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r._id}
                className={`bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-start gap-4 transition-opacity ${!r.isActive ? "opacity-50" : ""}`}>
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${r.avatarSeed || r.name}`}
                  className="w-10 h-10 rounded-full shrink-0" style={{ background: "#2d0a5e" }} alt={r.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-semibold text-sm">{r.name}</p>
                    <p className="text-purple-400 text-xs">{r.role}</p>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <FiStar key={s} size={11} className={s <= r.rating ? "text-yellow-400" : "text-gray-600"}
                          style={{ fill: s <= r.rating ? "#facc15" : "none" }} />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs mt-1 truncate">"{r.text}"</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleActive(r)}
                    className={`text-xs px-2.5 py-1 rounded-full transition-colors ${r.isActive ? "text-green-400 bg-green-500/10 hover:bg-green-500/20" : "text-gray-500 bg-gray-700 hover:bg-gray-600"}`}>
                    {r.isActive ? "Active" : "Inactive"}
                  </button>
                  <button onClick={() => openEdit(r)} className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-gray-800 rounded-lg transition-colors"><FiEdit2 size={14} /></button>
                  <button onClick={() => handleDelete(r._id, r.name)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><FiTrash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </>)}

      {/* ════ MODAL ════ */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="text-white font-bold text-lg">{editReview ? "Edit Review" : "New Review"}</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-white"><FiX size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="রাহিম উদ্দিন" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Role</label>
                  <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Developer @ TechCorp" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Avatar Seed (dicebear) — খালি রাখলে name থেকে নেবে</label>
                <div className="flex items-center gap-3">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${form.avatarSeed || form.name || "default"}`}
                    className="w-10 h-10 rounded-full shrink-0" style={{ background: "#2d0a5e" }} alt="preview" />
                  <input value={form.avatarSeed} onChange={(e) => setForm({ ...form, avatarSeed: e.target.value })}
                    placeholder="rahim (যেকোনো word)" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Rating</label>
                <StarPicker value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />
              </div>
              <div>
                <label className={labelClass}>Review Text *</label>
                <textarea rows={3} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })}
                  placeholder="এই কোর্সটা আমার জীবন বদলে দিয়েছে..." className={inputClass + " resize-none"} />
              </div>
              <div>
                <label className={labelClass}>Order</label>
                <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} className={inputClass} />
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
                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-gray-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
                <FiSave size={15} /> {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setModal(false)} className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminCourseReviews;
