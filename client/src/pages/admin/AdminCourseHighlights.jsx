import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave } from "react-icons/fi";
import IconPicker from "../../components/common/IconPicker";

const emptyItemForm = { icon: "🤖", title: "", description: "", isActive: true, order: 0 };

const inputClass = "w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors";
const labelClass = "block text-xs font-medium text-gray-400 mb-1";

const AdminCourseHighlights = () => {
  // ── Categories (tabs) ────────────────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [activeCatId, setActiveCatId] = useState(null);

  // ── Section settings (heading/subtitle/tags) for the active category ───
  const [section, setSection] = useState(null);
  const [techTagsText, setTechTagsText] = useState(""); // comma-separated editor field
  const [sectionSaving, setSectionSaving] = useState(false);

  // ── Items (CRUD list) for the active category ───────────────────────────
  const [items, setItems] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyItemForm);
  const [saving, setSaving] = useState(false);

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

  // ── Load section + items whenever the active category changes ──────────
  const fetchData = (catId) => {
    if (!catId) return;
    setDataLoading(true);
    api.get(`/admin/course-highlights/${catId}`)
      .then((res) => {
        setSection(res.data.section);
        setTechTagsText((res.data.section.techTags || []).join(", "));
        setItems(res.data.items || []);
      })
      .catch(() => toast.error("Highlights data load korte parlam na"))
      .finally(() => setDataLoading(false));
  };

  useEffect(() => { fetchData(activeCatId); }, [activeCatId]);

  const activeCategory = categories.find((c) => c._id === activeCatId);

  // ── Section settings save ────────────────────────────────────────────────
  const setSectionField = (key, value) => setSection((s) => ({ ...s, [key]: value }));

  const handleSaveSection = async () => {
    if (!activeCatId) return;
    setSectionSaving(true);
    const payload = {
      heading: section.heading,
      subtitle: section.subtitle,
      techTagsLabel: section.techTagsLabel,
      techTags: techTagsText.split(",").map((t) => t.trim()).filter(Boolean),
    };
    try {
      const res = await api.put(`/admin/course-highlights/${activeCatId}/section`, payload);
      setSection(res.data);
      setTechTagsText((res.data.techTags || []).join(", "));
      toast.success("Section settings saved!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally { setSectionSaving(false); }
  };

  // ── Item CRUD ─────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditItem(null);
    setForm({ ...emptyItemForm, order: items.length });
    setModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      icon: item.icon, title: item.title, description: item.description,
      isActive: item.isActive, order: item.order,
    });
    setModal(true);
  };

  const handleSaveItem = async () => {
    if (!form.title.trim()) return toast.error("Title required");
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/admin/course-highlights/items/${editItem._id}`, form);
        toast.success("Highlight card updated!");
      } else {
        await api.post(`/admin/course-highlights/${activeCatId}/items`, form);
        toast.success("Highlight card created!");
      }
      setModal(false);
      fetchData(activeCatId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const handleDeleteItem = async (id, title) => {
    if (!window.confirm(`Delete highlight card "${title}"? Ei card-ta public page theke shoreya jabe.`)) return;
    try {
      await api.delete(`/admin/course-highlights/items/${id}`);
      toast.success("Highlight card deleted");
      fetchData(activeCatId);
    } catch { toast.error("Delete failed"); }
  };

  const toggleActive = async (item) => {
    try {
      await api.put(`/admin/course-highlights/items/${item._id}`, { isActive: !item.isActive });
      fetchData(activeCatId);
    } catch { toast.error("Status update failed"); }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Highlights Section</h2>
        <p className="text-gray-400 text-sm">
          "এই কোর্সে তুমি কী পাবে?" section-er heading, card গুলো ও tech tags — প্রতিটা category-র জন্য আলাদা। Home page-এ যে category select করা থাকবে, সেটার data দেখাবে।
        </p>
      </div>

      {/* ════════════ CATEGORY TABS ════════════ */}
      {catsLoading ? (
        <div className="flex gap-2 mb-6">
          {[...Array(3)].map((_, i) => <div key={i} className="h-10 w-32 bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          Kono category nei. Age <a href="/admin/categories" className="text-cyan-400 hover:underline">Categories</a> page theke category create koro.
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
                  <input value={section?.heading || ""} onChange={(e) => setSectionField("heading", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Tech Tags Label</label>
                  <input value={section?.techTagsLabel || ""} onChange={(e) => setSectionField("techTagsLabel", e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Subtitle</label>
                <input value={section?.subtitle || ""} onChange={(e) => setSectionField("subtitle", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Tech Tags (comma diye alada koro)</label>
                <textarea value={techTagsText} onChange={(e) => setTechTagsText(e.target.value)}
                  rows={2} placeholder="HTML, CSS, React, Node.js, ..." className={inputClass + " resize-none"} />
                {techTagsText && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {techTagsText.split(",").map((t) => t.trim()).filter(Boolean).map((t, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full border border-purple-700 text-purple-300" style={{ background: "rgba(124,58,237,0.1)" }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={handleSaveSection} disabled={sectionSaving}
                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-gray-950 font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
                <FiSave size={15} /> {sectionSaving ? "Saving..." : "Save Section Settings"}
              </button>
            </div>

            {/* ════════════ HIGHLIGHT CARDS CRUD ════════════ */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-semibold text-lg">Highlight Cards</h3>
                <p className="text-gray-400 text-sm">{items.length} total — {activeCategory?.name} category-r jonno</p>
              </div>
              <button onClick={openCreate}
                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-4 py-2.5 rounded-xl transition-colors text-sm">
                <FiPlus size={16} /> Add Card
              </button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-16 text-gray-500">Kono highlight card nei. Notun ekta create koro!</div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {items.map((item) => (
                  <div key={item._id} className={`bg-gray-900 border rounded-xl p-5 transition-all ${item.isActive ? "border-gray-800" : "border-gray-800 opacity-60"}`}>
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-3xl">{item.icon}</span>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-gray-800 rounded-lg transition-colors">
                          <FiEdit2 size={14} />
                        </button>
                        <button onClick={() => handleDeleteItem(item._id, item.title)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-white font-semibold text-sm mb-1">{item.title}</p>
                    <p className="text-gray-500 text-xs line-clamp-3 mb-3">{item.description}</p>
                    <button onClick={() => toggleActive(item)}
                      className={`text-xs px-2 py-0.5 rounded-full transition-colors ${item.isActive ? "text-green-400 bg-green-500/10 hover:bg-green-500/20" : "text-gray-500 bg-gray-700 hover:bg-gray-600"}`}>
                      {item.isActive ? "Active" : "Inactive"}
                    </button>
                    <p className="text-gray-600 text-xs mt-2">order {item.order}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )
      )}

      {/* ════════════ CREATE/EDIT MODAL ════════════ */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="text-white font-bold text-lg">{editItem ? "Edit Highlight Card" : "New Highlight Card"}</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-white"><FiX size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-3">
                <div className="w-20">
                  <label className={labelClass}>Icon</label>
                  <IconPicker value={form.icon} onChange={(ic) => setForm({ ...form, icon: ic })} />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>Title *</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. AI-Powered Learning" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3} placeholder="Short description..." className={inputClass + " resize-none"} />
              </div>
              <div>
                <label className={labelClass}>Display Order</label>
                <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} className={inputClass} />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center ${form.isActive ? "bg-cyan-500" : "bg-gray-700"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform ${form.isActive ? "translate-x-5" : ""}`} />
                </div>
                <span className="text-sm text-gray-300">Active (public page-e dekhabe)</span>
              </label>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={handleSaveItem} disabled={saving}
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

export default AdminCourseHighlights;
