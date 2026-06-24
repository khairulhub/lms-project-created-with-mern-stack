import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiChevronDown, FiChevronUp } from "react-icons/fi";

const emptyModuleForm = {
  week: "", title: "", lessons: 0, duration: "", topicsText: "", isActive: true, order: 0,
};

const inputClass =
  "w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors";
const labelClass = "block text-xs font-medium text-gray-400 mb-1";

const AdminCourseCurriculum = () => {
  // ── Categories (tabs) ────────────────────────────────────────────────────
  const [categories, setCategories]   = useState([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [activeCatId, setActiveCatId] = useState(null);

  // ── Section settings ─────────────────────────────────────────────────────
  const [section, setSection]           = useState(null);
  const [sectionSaving, setSectionSaving] = useState(false);

  // ── Modules list + CRUD ──────────────────────────────────────────────────
  const [modules, setModules]       = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [modal, setModal]           = useState(false);
  const [editModule, setEditModule] = useState(null);
  const [form, setForm]             = useState(emptyModuleForm);
  const [saving, setSaving]         = useState(false);

  // expanded accordion in list view
  const [expandedId, setExpandedId] = useState(null);

  // ── Load categories once ─────────────────────────────────────────────────
  useEffect(() => {
    setCatsLoading(true);
    api.get("/admin/categories")
      .then((res) => {
        setCategories(res.data);
        if (res.data.length > 0) setActiveCatId(res.data[0]._id);
      })
      .catch(() => toast.error("Categories load korte parlam na"))
      .finally(() => setCatsLoading(false));
  }, []);

  // ── Load section + modules whenever active category changes ──────────────
  const fetchData = (catId) => {
    if (!catId) return;
    setDataLoading(true);
    api.get(`/admin/course-curriculum/${catId}`)
      .then((res) => {
        setSection(res.data.section);
        setModules(res.data.modules || []);
      })
      .catch(() => toast.error("Curriculum data load korte parlam na"))
      .finally(() => setDataLoading(false));
  };

  useEffect(() => { fetchData(activeCatId); }, [activeCatId]);

  const activeCategory = categories.find((c) => c._id === activeCatId);

  // ── Section save ─────────────────────────────────────────────────────────
  const setSectionField = (key, value) => setSection((s) => ({ ...s, [key]: value }));

  const handleSaveSection = async () => {
    if (!activeCatId) return;
    setSectionSaving(true);
    try {
      const res = await api.put(`/admin/course-curriculum/${activeCatId}/section`, {
        heading:  section.heading,
        subtitle: section.subtitle,
      });
      setSection(res.data);
      toast.success("Section settings saved!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally { setSectionSaving(false); }
  };

  // ── Module CRUD ───────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditModule(null);
    setForm({ ...emptyModuleForm, order: modules.length });
    setModal(true);
  };

  const openEdit = (mod) => {
    setEditModule(mod);
    setForm({
      week:       mod.week,
      title:      mod.title,
      lessons:    mod.lessons,
      duration:   mod.duration,
      topicsText: (mod.topics || []).join("\n"),
      isActive:   mod.isActive,
      order:      mod.order,
    });
    setModal(true);
  };

  const handleSaveModule = async () => {
    if (!form.week.trim() || !form.title.trim())
      return toast.error("Week and title are required");
    setSaving(true);
    const payload = {
      week:     form.week.trim(),
      title:    form.title.trim(),
      lessons:  Number(form.lessons) || 0,
      duration: form.duration.trim(),
      topics:   form.topicsText.split("\n").map((t) => t.trim()).filter(Boolean),
      isActive: form.isActive,
      order:    Number(form.order) || 0,
    };
    try {
      if (editModule) {
        await api.put(`/admin/course-curriculum/modules/${editModule._id}`, payload);
        toast.success("Module updated!");
      } else {
        await api.post(`/admin/course-curriculum/${activeCatId}/modules`, payload);
        toast.success("Module created!");
      }
      setModal(false);
      fetchData(activeCatId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const handleDeleteModule = async (id, title) => {
    if (!window.confirm(`Delete module "${title}"? Ei module public page theke shoreya jabe.`)) return;
    try {
      await api.delete(`/admin/course-curriculum/modules/${id}`);
      toast.success("Module deleted");
      fetchData(activeCatId);
    } catch { toast.error("Delete failed"); }
  };

  const toggleActive = async (mod) => {
    try {
      await api.put(`/admin/course-curriculum/modules/${mod._id}`, { isActive: !mod.isActive });
      fetchData(activeCatId);
    } catch { toast.error("Status update failed"); }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Curriculum Section</h2>
        <p className="text-gray-400 text-sm">
          "কোর্সের সিলেবাস" section-er accordion modules — প্রতিটা category-র জন্য আলাদা।
          Category select করলে সেই category-র modules দেখাবে।
        </p>
      </div>

      {/* ════════════ CATEGORY TABS ════════════ */}
      {catsLoading ? (
        <div className="flex gap-2 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 w-32 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          Kono category nei. Age{" "}
          <a href="/admin/categories" className="text-cyan-400 hover:underline">
            Categories
          </a>{" "}
          page theke category create koro.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-800 pb-4">
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setActiveCatId(cat._id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activeCatId === cat._id
                  ? "bg-cyan-500 text-gray-950"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>
      )}

      {activeCatId && (
        dataLoading ? (
          <div className="space-y-4">
            <div className="h-40 bg-gray-800 rounded-xl animate-pulse" />
            <div className="h-40 bg-gray-800 rounded-xl animate-pulse" />
          </div>
        ) : (
          <>
            {/* ════════════ SECTION SETTINGS ════════════ */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8 space-y-4">
              <h3 className="text-white font-semibold text-lg mb-1">
                {activeCategory?.icon} {activeCategory?.name} — Section Settings
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Heading</label>
                  <input
                    value={section?.heading || ""}
                    onChange={(e) => setSectionField("heading", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Subtitle</label>
                  <input
                    value={section?.subtitle || ""}
                    onChange={(e) => setSectionField("subtitle", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <button
                onClick={handleSaveSection}
                disabled={sectionSaving}
                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-gray-950 font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
              >
                <FiSave size={15} /> {sectionSaving ? "Saving..." : "Save Section Settings"}
              </button>
            </div>

            {/* ════════════ MODULES CRUD ════════════ */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-semibold text-lg">Curriculum Modules</h3>
                <p className="text-gray-400 text-sm">
                  {modules.length} total — {activeCategory?.name} category-r jonno
                </p>
              </div>
              <button
                onClick={openCreate}
                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-4 py-2.5 rounded-xl transition-colors text-sm"
              >
                <FiPlus size={16} /> Add Module
              </button>
            </div>

            {modules.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                Kono module nei. Notun ekta create koro!
              </div>
            ) : (
              <div className="space-y-3">
                {modules.map((mod) => (
                  <div
                    key={mod._id}
                    className={`bg-gray-900 border rounded-xl overflow-hidden transition-all ${
                      mod.isActive ? "border-gray-800" : "border-gray-800 opacity-60"
                    }`}
                  >
                    {/* Module header row */}
                    <div className="flex items-center gap-3 px-5 py-4">
                      <button
                        onClick={() => setExpandedId(expandedId === mod._id ? null : mod._id)}
                        className="flex-1 flex items-center gap-3 text-left"
                      >
                        <span className="text-white font-semibold text-sm">
                          {mod.week} — {mod.title}
                        </span>
                        {(mod.lessons > 0 || mod.duration) && (
                          <span className="text-gray-500 text-xs">
                            ({mod.lessons > 0 ? `${mod.lessons} লেসন` : ""}
                            {mod.lessons > 0 && mod.duration ? " · " : ""}
                            {mod.duration || ""})
                          </span>
                        )}
                        {expandedId === mod._id
                          ? <FiChevronUp size={14} className="text-gray-500 ml-auto shrink-0" />
                          : <FiChevronDown size={14} className="text-gray-500 ml-auto shrink-0" />}
                      </button>

                      {/* Action buttons */}
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => toggleActive(mod)}
                          className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                            mod.isActive
                              ? "text-green-400 bg-green-500/10 hover:bg-green-500/20"
                              : "text-gray-500 bg-gray-700 hover:bg-gray-600"
                          }`}
                        >
                          {mod.isActive ? "Active" : "Inactive"}
                        </button>
                        <button
                          onClick={() => openEdit(mod)}
                          className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteModule(mod._id, mod.title)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded topics */}
                    {expandedId === mod._id && mod.topics?.length > 0 && (
                      <div className="px-5 pb-4 border-t border-gray-800 pt-3">
                        <p className="text-gray-500 text-xs mb-2">Topics ({mod.topics.length}):</p>
                        <div className="grid sm:grid-cols-2 gap-1.5">
                          {mod.topics.map((topic, i) => (
                            <p key={i} className="text-gray-300 text-xs flex items-center gap-2">
                              <span className="text-purple-400">▸</span> {topic}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )
      )}

      {/* ════════════ CREATE / EDIT MODAL ════════════ */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="text-white font-bold text-lg">
                {editModule ? "Edit Module" : "New Module"}
              </h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-white">
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Week + Title */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Week Label *</label>
                  <input
                    value={form.week}
                    onChange={(e) => setForm({ ...form, week: e.target.value })}
                    placeholder="e.g. Week 1-2"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Module Title *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. HTML & CSS Foundation"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Lessons + Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Lesson Count</label>
                  <input
                    type="number"
                    min={0}
                    value={form.lessons}
                    onChange={(e) => setForm({ ...form, lessons: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Duration</label>
                  <input
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="e.g. 6h 30m"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Topics — one per line */}
              <div>
                <label className={labelClass}>Topics (প্রতিটা topic নতুন লাইনে লিখো)</label>
                <textarea
                  value={form.topicsText}
                  onChange={(e) => setForm({ ...form, topicsText: e.target.value })}
                  rows={6}
                  placeholder={"HTML5 Semantic Elements\nCSS Box Model ও Flexbox\nCSS Grid Layout\n..."}
                  className={inputClass + " resize-none font-mono text-xs"}
                />
                {form.topicsText && (
                  <p className="text-gray-600 text-xs mt-1">
                    {form.topicsText.split("\n").filter((t) => t.trim()).length} topics
                  </p>
                )}
              </div>

              {/* Order */}
              <div>
                <label className={labelClass}>Display Order</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                  className={inputClass}
                />
              </div>

              {/* Active toggle */}
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
                onClick={handleSaveModule}
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

export default AdminCourseCurriculum;
