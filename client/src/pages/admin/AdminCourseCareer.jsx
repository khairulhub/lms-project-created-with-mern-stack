import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave } from "react-icons/fi";
import IconPicker from "../../components/common/IconPicker";

// ── helpers ───────────────────────────────────────────────────────────────
const inputClass =
  "w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors";
const labelClass = "block text-xs font-medium text-gray-400 mb-1";

const EMPTY_BULLET = { type: "bullet", icon: "🏢", text: "", isActive: true, order: 0 };
const EMPTY_STAT   = { type: "stat",   icon: "🎓", value: "", label: "", colorFrom: "#7c3aed", colorTo: "#6d28d9", isActive: true, order: 0 };

const PRESET_GRADIENTS = [
  { from: "#7c3aed", to: "#6d28d9", label: "Purple" },
  { from: "#db2777", to: "#be185d", label: "Pink" },
  { from: "#4f46e5", to: "#4338ca", label: "Indigo" },
  { from: "#0891b2", to: "#0e7490", label: "Cyan" },
  { from: "#059669", to: "#047857", label: "Green" },
  { from: "#d97706", to: "#b45309", label: "Amber" },
];

const AdminCourseCareer = () => {
  const [settings,      setSettings]      = useState(null);
  const [settingsSaving,setSettingsSaving] = useState(false);
  const [items,         setItems]          = useState([]);
  const [loading,       setLoading]        = useState(true);
  const [modal,         setModal]          = useState(false);   // false | "bullet" | "stat"
  const [editItem,      setEditItem]       = useState(null);
  const [form,          setForm]           = useState(EMPTY_BULLET);
  const [saving,        setSaving]         = useState(false);

  // ── fetch ─────────────────────────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sRes, iRes] = await Promise.all([
        api.get("/admin/course-career/settings"),
        api.get("/admin/course-career"),
      ]);
      setSettings(sRes.data);
      setItems(iRes.data);
    } catch {
      toast.error("Data load korte parlam na");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── settings save ─────────────────────────────────────────────────────
  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      const res = await api.put("/admin/course-career/settings", {
        heading:      settings.heading,
        subtitle:     settings.subtitle,
        displayStyle: settings.displayStyle,
        bulletLimit:  settings.bulletLimit,
      });
      setSettings(res.data);
      toast.success("Settings saved!");
    } catch {
      toast.error("Save failed");
    } finally {
      setSettingsSaving(false);
    }
  };

  // ── design toggle (exactly like projects) ────────────────────────────
  const handleStyleToggle = async (style) => {
    if (settings?.displayStyle === style) return;
    const prev = settings;
    setSettings((s) => ({ ...s, displayStyle: style }));
    try {
      const res = await api.put("/admin/course-career/settings", { displayStyle: style });
      setSettings(res.data);
      toast.success(`Design "${style === "split" ? "Split" : "Cards"}" active করা হয়েছে`);
    } catch {
      setSettings(prev);
      toast.error("Style change failed");
    }
  };

  // ── modal open ────────────────────────────────────────────────────────
  const openCreate = (type) => {
    setEditItem(null);
    const count = items.filter((i) => i.type === type).length;
    setForm(type === "bullet" ? { ...EMPTY_BULLET, order: count } : { ...EMPTY_STAT, order: count });
    setModal(type);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      type:      item.type,
      icon:      item.icon,
      text:      item.text      || "",
      value:     item.value     || "",
      label:     item.label     || "",
      colorFrom: item.colorFrom || "#7c3aed",
      colorTo:   item.colorTo   || "#6d28d9",
      isActive:  item.isActive,
      order:     item.order,
    });
    setModal(item.type);
  };

  // ── save ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (form.type === "bullet" && !form.text.trim())  return toast.error("Text required");
    if (form.type === "stat"   && !form.value.trim()) return toast.error("Value required");
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/admin/course-career/${editItem._id}`, form);
        toast.success("Updated!");
      } else {
        await api.post("/admin/course-career", form);
        toast.success("Created!");
      }
      setModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, label) => {
    if (!window.confirm(`Delete "${label}"?`)) return;
    try {
      await api.delete(`/admin/course-career/${id}`);
      toast.success("Deleted");
      fetchAll();
    } catch { toast.error("Delete failed"); }
  };

  const toggleActive = async (item) => {
    try {
      await api.put(`/admin/course-career/${item._id}`, { isActive: !item.isActive });
      fetchAll();
    } catch { toast.error("Status update failed"); }
  };

  const bullets = items.filter((i) => i.type === "bullet");
  const stats   = items.filter((i) => i.type === "stat");
  const activeBullets = bullets.filter((i) => i.isActive).length;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Career Section</h2>
        <p className="text-gray-400 text-sm">"কোর্স শেষে তোমার ক্যারিয়ার" section — latest 3 active bullets দেখাবে।</p>
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
              <label className={labelClass}>কতটা Bullet দেখাবে (Public Page)</label>
              <select
                value={settings?.bulletLimit || 3}
                onChange={(e) => setSettings((s) => ({ ...s, bulletLimit: Number(e.target.value) }))}
                className={inputClass}
              >
                {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                  <option key={n} value={n}>{n} টা</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Subtitle</label>
            <textarea rows={2} value={settings?.subtitle || ""} onChange={(e) => setSettings((s) => ({ ...s, subtitle: e.target.value }))} className={inputClass + " resize-none"} />
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
            {/* Split */}
            <button onClick={() => handleStyleToggle("split")}
              className={`relative rounded-xl border-2 p-5 text-left transition-all ${settings?.displayStyle === "split" ? "border-cyan-500 bg-cyan-500/10" : "border-gray-700 bg-gray-800 hover:border-gray-600"}`}>
              {settings?.displayStyle === "split" && (
                <span className="absolute top-3 right-3 text-xs bg-cyan-500 text-gray-950 font-bold px-2 py-0.5 rounded-full">Active</span>
              )}
              <div className="flex gap-2 mb-3">
                <div className={`w-8 h-16 rounded-lg ${settings?.displayStyle === "split" ? "bg-cyan-500/30" : "bg-gray-600"}`} />
                <div className="grid grid-cols-2 gap-1 flex-1">
                  {[...Array(4)].map((_, i) => <div key={i} className={`rounded ${settings?.displayStyle === "split" ? "bg-cyan-500/20" : "bg-gray-600"}`} />)}
                </div>
              </div>
              <p className={`font-bold text-sm mb-1 ${settings?.displayStyle === "split" ? "text-white" : "text-gray-400"}`}>Split Layout</p>
              <p className="text-gray-500 text-xs">বাম দিকে bullet list + ডান দিকে stat cards। (বর্তমান design)</p>
            </button>

            {/* Cards */}
            <button onClick={() => handleStyleToggle("cards")}
              className={`relative rounded-xl border-2 p-5 text-left transition-all ${settings?.displayStyle === "cards" ? "border-cyan-500 bg-cyan-500/10" : "border-gray-700 bg-gray-800 hover:border-gray-600"}`}>
              {settings?.displayStyle === "cards" && (
                <span className="absolute top-3 right-3 text-xs bg-cyan-500 text-gray-950 font-bold px-2 py-0.5 rounded-full">Active</span>
              )}
              <div className="flex gap-1 mb-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`flex-1 h-16 rounded-lg ${settings?.displayStyle === "cards" ? "bg-cyan-500/20" : "bg-gray-600"}`} />
                ))}
              </div>
              <p className={`font-bold text-sm mb-1 ${settings?.displayStyle === "cards" ? "text-white" : "text-gray-400"}`}>Cards Layout</p>
              <p className="text-gray-500 text-xs">৩টা বড় feature card + নিচে stat strip।</p>
            </button>
          </div>
        </div>

        {/* ════ BULLET ITEMS ════ */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold text-lg">Bullet Items (বাম দিকের list)</h3>
              <p className="text-gray-500 text-sm">
                {bullets.length} total · {activeBullets} active ·{" "}
                <span className={activeBullets > (settings?.bulletLimit || 3) ? "text-yellow-400" : "text-gray-500"}>
                  Latest {settings?.bulletLimit || 3} টা active দেখাবে
                </span>
              </p>
            </div>
            <button onClick={() => openCreate("bullet")}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-4 py-2 rounded-xl text-sm transition-colors">
              <FiPlus size={14} /> Add Bullet
            </button>
          </div>
          {bullets.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-6">Kono bullet item nei.</p>
          ) : (
            <div className="space-y-2">
              {bullets.map((item) => (
                <div key={item._id} className={`flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-3 transition-opacity ${!item.isActive ? "opacity-50" : ""}`}>
                  <span className="text-xl shrink-0">{item.icon}</span>
                  <p className="text-gray-300 text-sm flex-1 truncate">{item.text}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleActive(item)}
                      className={`text-xs px-2.5 py-1 rounded-full transition-colors ${item.isActive ? "text-green-400 bg-green-500/10 hover:bg-green-500/20" : "text-gray-500 bg-gray-700 hover:bg-gray-600"}`}>
                      {item.isActive ? "Active" : "Inactive"}
                    </button>
                    <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-gray-700 rounded-lg transition-colors"><FiEdit2 size={13} /></button>
                    <button onClick={() => handleDelete(item._id, item.text)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><FiTrash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ════ STAT CARDS ════ */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold text-lg">Stat Cards (ডান দিকের numbers)</h3>
              <p className="text-gray-500 text-sm">{stats.length} total · {stats.filter(i => i.isActive).length} active</p>
            </div>
            <button onClick={() => openCreate("stat")}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-4 py-2 rounded-xl text-sm transition-colors">
              <FiPlus size={14} /> Add Stat
            </button>
          </div>
          {stats.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-6">Kono stat nei.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {stats.map((item) => (
                <div key={item._id}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-opacity ${!item.isActive ? "opacity-50 border-gray-700 bg-gray-800" : "border-purple-800 bg-gray-800"}`}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: `linear-gradient(135deg, ${item.colorFrom}, ${item.colorTo})` }}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm">{item.value}</p>
                    <p className="text-gray-500 text-xs truncate">{item.label}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleActive(item)}
                      className={`text-xs px-2.5 py-1 rounded-full transition-colors ${item.isActive ? "text-green-400 bg-green-500/10 hover:bg-green-500/20" : "text-gray-500 bg-gray-700 hover:bg-gray-600"}`}>
                      {item.isActive ? "Active" : "Inactive"}
                    </button>
                    <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-gray-700 rounded-lg transition-colors"><FiEdit2 size={13} /></button>
                    <button onClick={() => handleDelete(item._id, item.label || item.value)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><FiTrash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </>)}

      {/* ════ MODAL ════ */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="text-white font-bold text-lg">
                {editItem ? "Edit" : "New"} {modal === "bullet" ? "Bullet Item" : "Stat Card"}
              </h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-white"><FiX size={20} /></button>
            </div>

            <div className="p-6 space-y-4">
              {/* Icon picker */}
              <div>
                <label className={labelClass}>Icon</label>
                <IconPicker value={form.icon} onChange={(ic) => setForm({ ...form, icon: ic })} />
              </div>

              {modal === "bullet" ? (
                <div>
                  <label className={labelClass}>Bullet Text *</label>
                  <input value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })}
                    placeholder="e.g. Top Tech Company তে জব পাওয়ার সুযোগ" className={inputClass} />
                </div>
              ) : (<>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Value * (e.g. ৫০০+)</label>
                    <input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })}
                      placeholder="৫০০+" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Label (e.g. সফল গ্র্যাজুয়েট)</label>
                    <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}
                      placeholder="সফল গ্র্যাজুয়েট" className={inputClass} />
                  </div>
                </div>

                {/* Gradient presets */}
                <div>
                  <label className={labelClass}>Card Color</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {PRESET_GRADIENTS.map((g) => (
                      <button key={g.label} type="button"
                        onClick={() => setForm({ ...form, colorFrom: g.from, colorTo: g.to })}
                        title={g.label}
                        className={`w-8 h-8 rounded-lg transition-all ${form.colorFrom === g.from ? "ring-2 ring-white scale-110" : "hover:scale-105"}`}
                        style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                      />
                    ))}
                  </div>
                  {/* Custom hex */}
                  <div className="flex gap-2 mt-2">
                    <div className="flex-1">
                      <label className={labelClass}>Custom From</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={form.colorFrom} onChange={(e) => setForm({ ...form, colorFrom: e.target.value })}
                          className="w-8 h-8 rounded cursor-pointer bg-transparent border-0" />
                        <input value={form.colorFrom} onChange={(e) => setForm({ ...form, colorFrom: e.target.value })}
                          className={inputClass} placeholder="#7c3aed" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className={labelClass}>Custom To</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={form.colorTo} onChange={(e) => setForm({ ...form, colorTo: e.target.value })}
                          className="w-8 h-8 rounded cursor-pointer bg-transparent border-0" />
                        <input value={form.colorTo} onChange={(e) => setForm({ ...form, colorTo: e.target.value })}
                          className={inputClass} placeholder="#6d28d9" />
                      </div>
                    </div>
                  </div>
                  {/* Preview */}
                  <div className="mt-3 rounded-xl p-4 text-center"
                    style={{ background: `linear-gradient(135deg, ${form.colorFrom}, ${form.colorTo})` }}>
                    <div className="text-xl">{form.icon}</div>
                    <div className="text-white font-bold">{form.value || "Value"}</div>
                    <div className="text-white text-xs opacity-80">{form.label || "Label"}</div>
                  </div>
                </div>
              </>)}

              <div>
                <label className={labelClass}>Display Order</label>
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
              <button onClick={() => setModal(false)}
                className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminCourseCareer;
