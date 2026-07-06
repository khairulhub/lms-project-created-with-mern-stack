import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import {
  FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiUsers, FiDollarSign,
  FiStar, FiClock, FiChevronDown, FiChevronUp, FiImage, FiAlertCircle, FiBookOpen,
} from "react-icons/fi";
import AdminCourseDetailModal from "../admin/AdminCourseDetailModal";
import IconPicker from "../../components/common/IconPicker";

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

const EMPTY_FORM = {
  category: "", emoji: "🚀", image: "", badge: "NEW",
  title: "", description: "", hours: "0", price: 0, originalPrice: 0, isActive: true,
};

const inputClass = "w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors";
const labelClass = "block text-xs font-medium text-gray-400 mb-1.5";

const approvalBadge = (status) => {
  const map = {
    pending:  { text: "⏳ Pending Approval", cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" },
    approved: { text: "✓ Approved",          cls: "bg-green-500/10  text-green-400  border-green-500/30"  },
    rejected: { text: "✗ Rejected",          cls: "bg-red-500/10    text-red-400    border-red-500/30"    },
  };
  const s = map[status] || map.pending;
  return <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${s.cls}`}>{s.text}</span>;
};

// ── Per-course stats modal ────────────────────────────────────────────────
const CourseStatsModal = ({ course, onClose }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/instructor/courses/${course._id}/stats`)
      .then((r) => setStats(r.data))
      .catch(() => toast.error("Stats load failed"))
      .finally(() => setLoading(false));
  }, [course._id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-gray-900 border border-gray-800 rounded-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h2 className="text-white font-bold text-lg">{course.emoji} {course.title}</h2>
            <p className="text-gray-500 text-xs mt-0.5">Per-course stats</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><FiX size={20} /></button>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-800 rounded animate-pulse" />)}</div>
        ) : !stats ? (
          <p className="text-center text-gray-500 py-8">Stats load করা গেলো না।</p>
        ) : (
          <div className="p-5 space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Students",    value: stats.studentCount,              icon: <FiUsers size={16} />,    color: "cyan"   },
                { label: "Revenue",     value: "৳" + (stats.totalRevenue||0).toLocaleString(), icon: <FiDollarSign size={16} />, color: "green"  },
                { label: "Reviews",     value: stats.reviewCount,               icon: <FiStar size={16} />,     color: "yellow" },
                { label: "Avg Rating",  value: stats.avgRating ?? "—",          icon: <FiStar size={16} />,     color: "purple" },
              ].map((s) => {
                const c = { cyan: "text-cyan-400 bg-cyan-500/10", green: "text-green-400 bg-green-500/10", yellow: "text-yellow-400 bg-yellow-500/10", purple: "text-purple-400 bg-purple-500/10" }[s.color];
                return (
                  <div key={s.label} className="bg-gray-800 rounded-xl p-3">
                    <div className={`w-8 h-8 rounded-lg ${c} flex items-center justify-center mb-2`}>{s.icon}</div>
                    <p className="text-gray-400 text-xs">{s.label}</p>
                    <p className="text-white font-bold text-lg">{s.value ?? "0"}</p>
                  </div>
                );
              })}
            </div>

            {/* Recent students */}
            {stats.recentStudents?.length > 0 && (
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">Recent Students</p>
                <div className="space-y-2">
                  {stats.recentStudents.map((e) => (
                    <div key={e._id} className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-2.5">
                      <img src={e.user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${e.user?.email}`}
                        className="w-7 h-7 rounded-full bg-gray-700 shrink-0" alt={e.user?.name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{e.user?.name || "—"}</p>
                        <p className="text-gray-500 text-xs">{e.user?.email}</p>
                      </div>
                      <span className="text-green-400 text-xs font-semibold shrink-0">৳{(e.amountPaid||0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent reviews */}
            {stats.recentReviews?.length > 0 && (
              <div>
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">Recent Reviews</p>
                <div className="space-y-2">
                  {stats.recentReviews.map((r) => (
                    <div key={r._id} className="bg-gray-800 rounded-xl px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-white text-sm font-medium">{r.name}</p>
                        <span className="text-yellow-400 text-xs font-bold">⭐ {r.rating}</span>
                      </div>
                      <p className="text-gray-400 text-sm">{r.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.studentCount === 0 && stats.reviewCount === 0 && (
              <p className="text-center text-gray-500 text-sm py-4">এখনো কোনো student বা review আসেনি।</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────
const InstructorCourses = () => {
  const [courses,     setCourses]     = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [modal,       setModal]       = useState(false);
  const [editCourse,  setEditCourse]  = useState(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [statsModal,  setStatsModal]  = useState(null); // course object
  const [detailCourse, setDetailCourse] = useState(null); // course details modal

  useEffect(() => {
    Promise.all([
      api.get("/instructor/courses"),
      api.get("/categories"),        // public route — instructor can access
    ]).then(([cRes, catRes]) => {
      setCourses(cRes.data);
      setCategories(catRes.data);
    }).catch(() => toast.error("Load failed"))
    .finally(() => setLoading(false));
  }, []);

  const refresh = () =>
    api.get("/instructor/courses").then((r) => setCourses(r.data));

  const openCreate = () => {
    setEditCourse(null);
    setForm({ ...EMPTY_FORM, category: categories[0]?._id || "" });
    setModal(true);
  };

  const openEdit = (c) => {
    setEditCourse(c);
    setForm({
      category:      c.category?._id || c.category,
      emoji:         c.emoji,
      image:         c.image || "",
      badge:         c.badge,
      title:         c.title,
      description:   c.description || "",
      hours:         c.hours || "0",
      price:         c.price || 0,
      originalPrice: c.originalPrice || 0,
      isActive:      c.isActive ?? true,
    });
    setModal(true);
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`"${title}" delete করবে?`)) return;
    try {
      await api.delete(`/instructor/courses/${id}`);
      toast.success("Course deleted");
      refresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!IMGBB_API_KEY) return toast.error("VITE_IMGBB_API_KEY .env-এ নেই");
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res  = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) { setForm((f) => ({ ...f, image: data.data.url })); toast.success("Image uploaded!"); }
      else toast.error("Upload failed");
    } catch { toast.error("Upload error"); }
    finally { setUploadingImg(false); }
  };

  const handleSave = async () => {
    if (!form.title.trim())    return toast.error("Title দাও");
    if (!form.category)        return toast.error("Category বেছে নাও");
    setSaving(true);
    try {
      const payload = {
        ...form,
        price:         Number(form.price) || 0,
        originalPrice: Number(form.originalPrice) || 0,
      };
      if (editCourse) {
        await api.put(`/instructor/courses/${editCourse._id}`, payload);
        toast.success("Course updated!");
      } else {
        await api.post("/instructor/courses", payload);
        toast.success("Course submit হয়েছে। Admin approve করলে public-এ দেখাবে।");
      }
      setModal(false);
      refresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const pending  = courses.filter((c) => c.approvalStatus === "pending");
  const approved = courses.filter((c) => c.approvalStatus === "approved");
  const rejected = courses.filter((c) => c.approvalStatus === "rejected");

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">আমার Courses 📚</h1>
            <p className="text-gray-400 text-sm mt-1">
              {approved.length} approved · {pending.length} pending · {rejected.length} rejected
            </p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
            <FiPlus size={16} /> New Course
          </button>
        </div>

        {/* Pending notice */}
        {pending.length > 0 && (
          <div className="flex items-start gap-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
            <FiAlertCircle className="text-yellow-400 mt-0.5 shrink-0" size={16} />
            <p className="text-yellow-300 text-sm">
              <span className="font-semibold">{pending.length}টি course</span> admin approval-এর অপেক্ষায় আছে। Approve হলে public-এ দেখাবে।
            </p>
          </div>
        )}

        {/* Course list */}
        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-800 rounded-xl animate-pulse" />)}</div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <div className="text-5xl mb-4">📭</div>
            <p className="font-medium text-white mb-2">এখনো কোনো course নেই</p>
            <p className="text-sm">New Course বানিয়ে admin approval-এর জন্য submit করো।</p>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map((c) => (
              <div key={c._id}
                className={`bg-gray-900 border rounded-xl px-5 py-4 flex items-center gap-4
                  ${c.approvalStatus === "pending"  ? "border-yellow-500/30" :
                    c.approvalStatus === "rejected" ? "border-red-500/30"    : "border-gray-800"}`}>
                {c.image ? (
                  <img src={c.image} alt={c.title} className="w-12 h-12 object-cover rounded-lg shrink-0 border border-gray-700" />
                ) : (
                  <span className="text-3xl shrink-0">{c.emoji}</span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-white font-semibold text-sm">{c.title}</p>
                    {approvalBadge(c.approvalStatus)}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>⏱ {c.hours}h</span>
                    <span className="text-cyan-400 font-semibold">৳{(c.price||0).toLocaleString()}</span>
                    {c.category?.name && <span>📁 {c.category.name}</span>}
                  </div>
                  {c.approvalStatus === "rejected" && (
                    <p className="text-red-400 text-xs mt-1">Rejected — edit করে আবার submit করো।</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {/* Course Details — always accessible */}
                  <button onClick={() => setDetailCourse(c)}
                    className="p-1.5 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors" title="Course Details manage koro">
                    <FiBookOpen size={14} />
                  </button>
                  {/* Stats — only approved */}
                  {c.approvalStatus === "approved" && (
                    <button onClick={() => setStatsModal(c)}
                      className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors" title="Stats দেখো">
                      <FiUsers size={14} />
                    </button>
                  )}
                  {/* Edit — all courses (approved course re-submits for approval) */}
                  <button onClick={() => openEdit(c)}
                    className="p-1.5 text-gray-400 hover:text-cyan-400 hover:bg-gray-800 rounded-lg transition-colors" title={c.approvalStatus === "approved" ? "Edit করলে re-approval লাগবে" : "Edit করো"}>
                    <FiEdit2 size={14} />
                  </button>
                  {/* Delete — all courses */}
                  <button onClick={() => handleDelete(c._id, c.title)}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create/Edit modal ─────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-gray-900 border border-gray-800 rounded-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="text-white font-bold">{editCourse ? "Course Edit করো" : "নতুন Course Submit করো"}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-white"><FiX size={20} /></button>
            </div>

            <div className="p-5 space-y-4">
              {/* Notice — only for new courses */}
              {!editCourse && (
                <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl px-4 py-3 text-cyan-300 text-xs">
                  ℹ️ নতুন course submit করার পর admin approve করলে public-এ দেখাবে। একবার approved হলে পরে edit করলে আর approval লাগবে না।
                </div>
              )}

              {/* Category */}
              <div>
                <label className={labelClass}>Category *</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className={inputClass}>
                  <option value="">Category বেছে নাও</option>
                  {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.icon} {cat.name}</option>)}
                </select>
              </div>

              {/* Emoji + Title */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className={labelClass}>Emoji / Icon</label>
                  <IconPicker value={form.emoji} onChange={(ic) => setForm({ ...form, emoji: ic })} />
                </div>
                <div className="col-span-3">
                  <label className={labelClass}>Title *</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Course-এর নাম" className={inputClass} />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={labelClass}>Description</label>
                <textarea rows={3} value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Course সম্পর্কে সংক্ষেপে লিখো" className={inputClass + " resize-none"} />
              </div>

              {/* Image upload */}
              <div>
                <label className={labelClass}>Course Image (imgBB)</label>
                <div className="flex items-center gap-3">
                  {form.image && <img src={form.image} className="w-14 h-14 object-cover rounded-xl border border-gray-700" alt="preview" />}
                  <label className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-4 py-2.5 rounded-xl cursor-pointer text-sm transition-colors">
                    <FiImage size={14} />
                    {uploadingImg ? "Uploading..." : "Upload Image"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImg} />
                  </label>
                  {form.image && (
                    <button onClick={() => setForm({ ...form, image: "" })} className="text-red-400 text-xs hover:text-red-300">Remove</button>
                  )}
                </div>
              </div>

              {/* Price + Hours */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Price (৳) *</label>
                  <input type="number" value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Original Price (৳)</label>
                  <input type="number" value={form.originalPrice}
                    onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                    className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Duration (hours)</label>
                  <input value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })}
                    placeholder="20+" className={inputClass} />
                </div>
              </div>

              {/* Badge */}
              <div>
                <label className={labelClass}>Badge</label>
                <select value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })}
                  className={inputClass}>
                  {["NEW", "HOT", "POPULAR", "BESTSELLER", ""].map((b) => (
                    <option key={b} value={b}>{b || "None"}</option>
                  ))}
                </select>
              </div>

              {/* Active / Inactive */}
              <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
                <div>
                  <p className="text-white text-sm font-medium">Course Active রাখবে?</p>
                  <p className="text-gray-500 text-xs">Inactive হলে approve-এর পরেও public-এ দেখাবে না</p>
                </div>
                <button type="button"
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? "bg-cyan-500" : "bg-gray-600"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isActive ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-gray-800">
              <button onClick={() => setModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:text-white text-sm transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-gray-950 font-bold px-4 py-2.5 rounded-xl text-sm transition-colors">
                <FiSave size={14} /> {saving ? "Saving..." : editCourse ? "Save Changes" : "Submit for Approval"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Per-course stats modal */}
      {statsModal && <CourseStatsModal course={statsModal} onClose={() => setStatsModal(null)} />}

      {/* Course Details modal — same as admin uses, ownership-checked in backend */}
      {detailCourse && <AdminCourseDetailModal course={detailCourse} onClose={() => setDetailCourse(null)} />}
    </DashboardLayout>
  );
};

export default InstructorCourses;
