import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiList, FiGrid, FiImage, FiBookOpen } from "react-icons/fi";
import IconPicker from "../../components/common/IconPicker";
import AdminCourseDetailModal from "./AdminCourseDetailModal";

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

const inputClass = "w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors";
const labelClass = "block text-xs font-medium text-gray-400 mb-1";

const EMPTY_FORM = {
  category: "", emoji: "🚀", image: "", badge: "HOT", tagsText: "", title: "", description: "",
  rating: 4.8, students: "0", hours: "0", price: 0, originalPrice: 0,
  displayStyle: "list", isActive: true, order: 0,
};

const AdminCourses = () => {
  const [categories,  setCategories]  = useState([]);
  const [courses,     setCourses]     = useState([]);
  const [activeCatId, setActiveCatId] = useState("");
  const [loading,     setLoading]     = useState(true);
  const [modal,       setModal]       = useState(false);
  const [editCourse,  setEditCourse]  = useState(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [detailCourse, setDetailCourse] = useState(null); // course for detail modal

  // load categories
  useEffect(() => {
    api.get("/admin/categories").then((r) => {
      setCategories(r.data);
      if (r.data.length > 0) setActiveCatId(r.data[0]._id);
    });
  }, []);

  // load courses when category changes
  useEffect(() => {
    if (!activeCatId) return;
    setLoading(true);
    api.get(`/admin/courses?category=${activeCatId}`)
      .then((r) => setCourses(r.data))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [activeCatId]);

  const fetchCourses = () => {
    if (!activeCatId) return;
    api.get(`/admin/courses?category=${activeCatId}`).then((r) => setCourses(r.data));
  };

  const openCreate = () => {
    setEditCourse(null);
    setForm({ ...EMPTY_FORM, category: activeCatId, order: courses.length });
    setModal(true);
  };

  const openEdit = (c) => {
    setEditCourse(c);
    setForm({
      category:      c.category?._id || c.category,
      emoji:         c.emoji,
      image:         c.image || "",
      badge:         c.badge,
      tagsText:      (c.tags || []).join(", "),
      title:         c.title,
      description:   c.description,
      rating:        c.rating,
      students:      c.students,
      hours:         c.hours,
      price:         c.price,
      originalPrice: c.originalPrice,
      displayStyle:  c.displayStyle,
      isActive:      c.isActive,
      order:         c.order,
    });
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.category) return toast.error("Category select koro");
    if (!form.title.trim()) return toast.error("Title required");
    setSaving(true);
    const payload = {
      ...form,
      tags: form.tagsText.split(",").map((t) => t.trim()).filter(Boolean),
      rating: Number(form.rating),
      price:  Number(form.price),
      originalPrice: Number(form.originalPrice),
      order:  Number(form.order),
    };
    delete payload.tagsText;
    try {
      if (editCourse) { await api.put(`/admin/courses/${editCourse._id}`, payload); toast.success("Updated!"); }
      else            { await api.post("/admin/courses", payload);                   toast.success("Created!"); }
      setModal(false); fetchCourses();
    } catch (err) { toast.error(err.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try { await api.delete(`/admin/courses/${id}`); toast.success("Deleted"); fetchCourses(); }
    catch { toast.error("Delete failed"); }
  };

  // imgBB course image upload (same pattern as AdminCourseHeroSection instructor image)
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!IMGBB_API_KEY) return toast.error("Add VITE_IMGBB_API_KEY to .env");
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setForm((f) => ({ ...f, image: data.data.url }));
        toast.success("Image uploaded!");
      } else {
        toast.error("Upload failed");
      }
    } catch { toast.error("Upload error"); }
    finally { setUploadingImage(false); }
  };

  const toggleActive = async (c) => {
    try { await api.put(`/admin/courses/${c._id}`, { isActive: !c.isActive }); fetchCourses(); }
    catch { toast.error("Status update failed"); }
  };

  // Toggle displayStyle for all courses in this category
  const toggleCategoryStyle = async (style) => {
    try {
      await Promise.all(courses.map((c) => api.put(`/admin/courses/${c._id}`, { displayStyle: style })));
      fetchCourses();
      toast.success(`Design "${style === "list" ? "List" : "Grid"}" active`);
    } catch { toast.error("Style change failed"); }
  };

  const activeCat = categories.find((c) => c._id === activeCatId);
  const currentStyle = courses[0]?.displayStyle || "list";

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Courses</h2>
        <p className="text-gray-400 text-sm">Category অনুযায়ী কোর্স manage করো। Public page-এ category tab-এ দেখাবে।</p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button key={cat._id} onClick={() => setActiveCatId(cat._id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              activeCatId === cat._id ? "bg-cyan-500 text-gray-950" : "bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700"
            }`}>
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Design toggle */}
      {courses.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <h3 className="text-white font-semibold mb-1">Display Design — {activeCat?.name}</h3>
          <p className="text-gray-500 text-xs mb-4">একটা active করলে এই category-র সব course-এ apply হবে।</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <button onClick={() => toggleCategoryStyle("list")}
              className={`relative rounded-xl border-2 p-4 text-left transition-all ${currentStyle === "list" ? "border-cyan-500 bg-cyan-500/10" : "border-gray-700 bg-gray-800 hover:border-gray-600"}`}>
              {currentStyle === "list" && <span className="absolute top-3 right-3 text-xs bg-cyan-500 text-gray-950 font-bold px-2 py-0.5 rounded-full">Active</span>}
              <FiList size={24} className={`mb-2 ${currentStyle === "list" ? "text-cyan-400" : "text-gray-500"}`} />
              <p className={`font-bold text-sm mb-1 ${currentStyle === "list" ? "text-white" : "text-gray-400"}`}>List Layout</p>
              <p className="text-gray-500 text-xs">বড় card — emoji বাম দিকে, details ডান দিকে।</p>
            </button>
            <button onClick={() => toggleCategoryStyle("grid")}
              className={`relative rounded-xl border-2 p-4 text-left transition-all ${currentStyle === "grid" ? "border-cyan-500 bg-cyan-500/10" : "border-gray-700 bg-gray-800 hover:border-gray-600"}`}>
              {currentStyle === "grid" && <span className="absolute top-3 right-3 text-xs bg-cyan-500 text-gray-950 font-bold px-2 py-0.5 rounded-full">Active</span>}
              <FiGrid size={24} className={`mb-2 ${currentStyle === "grid" ? "text-cyan-400" : "text-gray-500"}`} />
              <p className={`font-bold text-sm mb-1 ${currentStyle === "grid" ? "text-white" : "text-gray-400"}`}>Grid Layout</p>
              <p className="text-gray-500 text-xs">৩-column card grid — compact view।</p>
            </button>
          </div>
        </div>
      )}

      {/* Courses list */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold text-lg">{activeCat?.name} — Courses</h3>
          <p className="text-gray-400 text-sm">{courses.length} total · {courses.filter(c => c.isActive).length} active</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-4 py-2.5 rounded-xl text-sm transition-colors">
          <FiPlus size={16} /> Add Course
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-800 rounded-xl animate-pulse" />)}</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">📭</div>
          <p>এই category-তে কোনো course নেই। Add Course করো।</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((c) => (
            <div key={c._id}
              className={`bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center gap-4 transition-opacity ${!c.isActive ? "opacity-50" : ""}`}>
              {c.image ? (
                <img src={c.image} alt={c.title} className="w-12 h-12 object-cover rounded-lg shrink-0 border border-gray-700" />
              ) : (
                <span className="text-3xl shrink-0">{c.emoji}</span>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-semibold text-sm">{c.title}</p>
                  {c.badge && <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">{c.badge}</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                  <span>⭐ {c.rating}</span>
                  <span>👥 {c.students}</span>
                  <span>⏱ {c.hours}h</span>
                  <span className="text-cyan-400 font-semibold">৳{c.price?.toLocaleString()}</span>
                  {c.originalPrice > c.price && <span className="line-through">৳{c.originalPrice?.toLocaleString()}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleActive(c)}
                  className={`text-xs px-2.5 py-1 rounded-full transition-colors ${c.isActive ? "text-green-400 bg-green-500/10 hover:bg-green-500/20" : "text-gray-500 bg-gray-700 hover:bg-gray-600"}`}>
                  {c.isActive ? "Active" : "Inactive"}
                </button>
                <button onClick={() => setDetailCourse(c)}
                  title="Course Details manage koro"
                  className="p-1.5 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"><FiBookOpen size={14} /></button>
                <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-gray-800 rounded-lg transition-colors"><FiEdit2 size={14} /></button>
                <button onClick={() => handleDelete(c._id, c.title)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><FiTrash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── COURSE DETAIL MODAL ── */}
      {detailCourse && (
        <AdminCourseDetailModal
          course={detailCourse}
          onClose={() => setDetailCourse(null)}
        />
      )}

      {/* ── MODAL ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <h3 className="text-white font-bold text-lg">{editCourse ? "Edit Course" : "New Course"}</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-white"><FiX size={20} /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* Category select */}
              <div>
                <label className={labelClass}>Category *</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
                  <option value="">-- Select Category --</option>
                  {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.icon} {cat.name}</option>)}
                </select>
              </div>

              {/* Emoji + Title */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className={labelClass}>Emoji</label>
                  <IconPicker value={form.emoji} onChange={(ic) => setForm({ ...form, emoji: ic })} />
                </div>
                <div className="col-span-3">
                  <label className={labelClass}>Title *</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Complete MERN Stack Development" className={inputClass} />
                </div>
              </div>

              {/* imgBB course image upload */}
              <div>
                <label className={labelClass}>Course Image (via imgBB)</label>
                <div className="flex items-center gap-4">
                  {form.image && (
                    <img src={form.image} alt="course" className="h-16 w-16 object-cover rounded-xl border border-gray-700" />
                  )}
                  <label className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-4 py-2.5 rounded-xl cursor-pointer transition-colors text-sm">
                    <FiImage size={14} />
                    {uploadingImage ? "Uploading..." : "Upload image"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                  </label>
                  {form.image && (
                    <button onClick={() => setForm({ ...form, image: "" })}
                      className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs">
                      <FiTrash2 size={12} /> Remove (use emoji instead)
                    </button>
                  )}
                </div>
                <p className="text-gray-600 text-xs mt-2">Image na dile emoji dekhabe.</p>
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass + " resize-none"} />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Badge (HOT / NEW / POPULAR)</label>
                  <input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Tags (comma separated)</label>
                  <input value={form.tagsText} onChange={(e) => setForm({ ...form, tagsText: e.target.value })} placeholder="Bestseller, Full Stack" className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Rating</label>
                  <input type="number" step="0.1" min="1" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Students</label>
                  <input value={form.students} onChange={(e) => setForm({ ...form, students: e.target.value })} placeholder="৩২,৫০০" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Hours</label>
                  <input value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} placeholder="৬০+" className={inputClass} />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Price (৳)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Original Price (৳)</label>
                  <input type="number" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} className={inputClass} />
                </div>
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
            <div className="px-6 pb-6 flex gap-3 border-t border-gray-800 pt-4">
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

export default AdminCourses;
