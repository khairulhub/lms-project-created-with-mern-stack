import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiGrid, FiSliders } from "react-icons/fi";
import IconPicker from "../../components/common/IconPicker";

const emptyForm = { emoji: "🚀", title: "", description: "", techTagsText: "", isActive: true, order: 0 };

const inputClass =
  "w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors";
const labelClass = "block text-xs font-medium text-gray-400 mb-1";

const AdminCourseProjects = () => {
  // ── Settings ────────────────────────────────────────────────────────────
  const [settings, setSettings]         = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // ── Projects list ────────────────────────────────────────────────────────
  const [projects, setProjects]     = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [modal, setModal]           = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [saving, setSaving]         = useState(false);

  // ── Fetch all data ───────────────────────────────────────────────────────
  const fetchAll = async () => {
    setDataLoading(true);
    try {
      const [sRes, pRes] = await Promise.all([
        api.get("/admin/course-projects/settings"),
        api.get("/admin/course-projects"),
      ]);
      setSettings(sRes.data);
      setProjects(pRes.data);
    } catch {
      toast.error("Data load korte parlam na");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Settings save ────────────────────────────────────────────────────────
  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      const res = await api.put("/admin/course-projects/settings", {
        heading:      settings.heading,
        subtitle:     settings.subtitle,
        displayStyle: settings.displayStyle,
      });
      setSettings(res.data);
      toast.success("Settings saved!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSettingsSaving(false);
    }
  };

  // ── Design style toggle (exactly like payment section active/inactive) ───
  const handleStyleToggle = async (style) => {
    if (settings?.displayStyle === style) return;
    const optimistic = { ...settings, displayStyle: style };
    setSettings(optimistic);
    try {
      const res = await api.put("/admin/course-projects/settings", { displayStyle: style });
      setSettings(res.data);
      toast.success(`Design "${style === "grid" ? "Grid" : "Slider"}" active করা হয়েছে`);
    } catch {
      setSettings(settings); // rollback
      toast.error("Style change failed");
    }
  };

  // ── CRUD helpers ─────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditProject(null);
    setForm({ ...emptyForm, order: projects.length });
    setModal(true);
  };

  const openEdit = (p) => {
    setEditProject(p);
    setForm({
      emoji:        p.emoji,
      title:        p.title,
      description:  p.description,
      techTagsText: (p.techTags || []).join(", "),
      isActive:     p.isActive,
      order:        p.order,
    });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("Title required");
    setSaving(true);
    const payload = {
      emoji:       form.emoji.trim() || "🚀",
      title:       form.title.trim(),
      description: form.description.trim(),
      techTags:    form.techTagsText.split(",").map((t) => t.trim()).filter(Boolean),
      isActive:    form.isActive,
      order:       Number(form.order) || 0,
    };
    try {
      if (editProject) {
        await api.put(`/admin/course-projects/${editProject._id}`, payload);
        toast.success("Project updated!");
      } else {
        await api.post("/admin/course-projects", payload);
        toast.success("Project created!");
      }
      setModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete project "${title}"?`)) return;
    try {
      await api.delete(`/admin/course-projects/${id}`);
      toast.success("Project deleted");
      fetchAll();
    } catch {
      toast.error("Delete failed");
    }
  };

  const toggleActive = async (p) => {
    try {
      await api.put(`/admin/course-projects/${p._id}`, { isActive: !p.isActive });
      fetchAll();
    } catch {
      toast.error("Status update failed");
    }
  };

  const activeCount = projects.filter((p) => p.isActive).length;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Projects Section</h2>
        <p className="text-gray-400 text-sm">
          "বাস্তব প্রজেক্ট বানাবে" section — latest 4 active projects দেখাবে।
          Design style এখানে toggle করো।
        </p>
      </div>

      {dataLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* ════ SECTION SETTINGS ════ */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 space-y-4">
            <h3 className="text-white font-semibold text-lg">Section Settings</h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Heading</label>
                <input
                  value={settings?.heading || ""}
                  onChange={(e) => setSettings((s) => ({ ...s, heading: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Subtitle</label>
                <input
                  value={settings?.subtitle || ""}
                  onChange={(e) => setSettings((s) => ({ ...s, subtitle: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={settingsSaving}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-gray-950 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              <FiSave size={14} /> {settingsSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>

          {/* ════ DESIGN STYLE TOGGLE (like payment section) ════ */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <h3 className="text-white font-semibold text-lg mb-1">Display Design</h3>
            <p className="text-gray-500 text-xs mb-4">
              একটা active থাকলে অন্যটা automatically inactive হবে।
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Grid Option */}
              <button
                onClick={() => handleStyleToggle("grid")}
                className={`relative rounded-xl border-2 p-5 text-left transition-all ${
                  settings?.displayStyle === "grid"
                    ? "border-cyan-500 bg-cyan-500/10"
                    : "border-gray-700 bg-gray-800 hover:border-gray-600"
                }`}
              >
                {settings?.displayStyle === "grid" && (
                  <span className="absolute top-3 right-3 text-xs bg-cyan-500 text-gray-950 font-bold px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
                <FiGrid
                  size={28}
                  className={`mb-3 ${settings?.displayStyle === "grid" ? "text-cyan-400" : "text-gray-500"}`}
                />
                <p className={`font-bold text-sm mb-1 ${settings?.displayStyle === "grid" ? "text-white" : "text-gray-400"}`}>
                  Grid Layout
                </p>
                <p className="text-gray-500 text-xs">
                  2-column card grid — সবগুলো একসাথে দেখায়। (বর্তমান design)
                </p>
              </button>

              {/* Slider Option */}
              <button
                onClick={() => handleStyleToggle("slider")}
                className={`relative rounded-xl border-2 p-5 text-left transition-all ${
                  settings?.displayStyle === "slider"
                    ? "border-cyan-500 bg-cyan-500/10"
                    : "border-gray-700 bg-gray-800 hover:border-gray-600"
                }`}
              >
                {settings?.displayStyle === "slider" && (
                  <span className="absolute top-3 right-3 text-xs bg-cyan-500 text-gray-950 font-bold px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
                <FiSliders
                  size={28}
                  className={`mb-3 ${settings?.displayStyle === "slider" ? "text-cyan-400" : "text-gray-500"}`}
                />
                <p className={`font-bold text-sm mb-1 ${settings?.displayStyle === "slider" ? "text-white" : "text-gray-400"}`}>
                  Slider Layout
                </p>
                <p className="text-gray-500 text-xs">
                  Card carousel with prev/next — ২টা করে দেখায়, navigate করা যায়।
                </p>
              </button>
            </div>
          </div>

          {/* ════ PROJECTS LIST ════ */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold text-lg">Projects</h3>
              <p className="text-gray-400 text-sm">
                {projects.length} total · {activeCount} active ·{" "}
                <span className={activeCount > 4 ? "text-yellow-400" : "text-gray-500"}>
                  Public page-এ latest 4 active দেখাবে
                </span>
              </p>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-4 py-2.5 rounded-xl transition-colors text-sm"
            >
              <FiPlus size={16} /> Add Project
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              Kono project nei. Notun ekta create koro!
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((p) => (
                <div
                  key={p._id}
                  className={`bg-gray-900 border rounded-xl px-5 py-4 flex items-center gap-4 transition-opacity ${
                    p.isActive ? "border-gray-800" : "border-gray-800 opacity-50"
                  }`}
                >
                  <span className="text-3xl shrink-0">{p.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{p.title}</p>
                    <p className="text-gray-500 text-xs truncate">{p.description}</p>
                    {p.techTags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {p.techTags.map((t) => (
                          <span key={t} className="text-purple-300 text-xs px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-800">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleActive(p)}
                      className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                        p.isActive
                          ? "text-green-400 bg-green-500/10 hover:bg-green-500/20"
                          : "text-gray-500 bg-gray-700 hover:bg-gray-600"
                      }`}
                    >
                      {p.isActive ? "Active" : "Inactive"}
                    </button>
                    <button
                      onClick={() => openEdit(p)}
                      className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(p._id, p.title)}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ════ CREATE / EDIT MODAL ════ */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="text-white font-bold text-lg">
                {editProject ? "Edit Project" : "New Project"}
              </h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-white">
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className={labelClass}>Emoji</label>
                  <IconPicker
                    value={form.emoji}
                    onChange={(ic) => setForm({ ...form, emoji: ic })}
                  />
                </div>
                <div className="col-span-3">
                  <label className={labelClass}>Project Title *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. E-Commerce Platform"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Short description of the project"
                  className={inputClass + " resize-none"}
                />
              </div>

              <div>
                <label className={labelClass}>Tech Tags (comma separated)</label>
                <input
                  value={form.techTagsText}
                  onChange={(e) => setForm({ ...form, techTagsText: e.target.value })}
                  placeholder="React, Node.js, MongoDB"
                  className={inputClass}
                />
                {form.techTagsText && (
                  <p className="text-gray-600 text-xs mt-1">
                    {form.techTagsText.split(",").filter((t) => t.trim()).length} tags
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>Display Order</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                  className={inputClass}
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center ${
                    form.isActive ? "bg-cyan-500" : "bg-gray-700"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform ${
                      form.isActive ? "translate-x-5" : ""
                    }`}
                  />
                </div>
                <span className="text-sm text-gray-300">Active (public page-e dekhabe)</span>
              </label>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-gray-950 font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
              >
                <FiSave size={15} /> {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setModal(false)}
                className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminCourseProjects;
