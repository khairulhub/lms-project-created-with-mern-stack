import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import {
  FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiBell, FiGlobe, FiBookOpen,
  FiUsers, FiUserCheck, FiAlertTriangle, FiClock,
} from "react-icons/fi";

const inputCls = "w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors";
const labelCls = "block text-xs font-medium text-gray-400 mb-1.5";

const EMPTY = {
  title: "",
  message: "",
  scope: "global",
  course: "",
  allCourses: false,
  audience: "students",
  priority: "normal",
  eventDate: "",
};

const priorityBadge = (p) => {
  const map = {
    normal: "bg-gray-700/50 text-gray-300",
    important: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30",
    urgent: "bg-red-500/10 text-red-400 border border-red-500/30",
  };
  const label = { normal: "সাধারণ", important: "গুরুত্বপূর্ণ", urgent: "জরুরি" };
  return <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${map[p] || map.normal}`}>{label[p] || p}</span>;
};

const audienceBadge = (a) => {
  const map = {
    students: { text: "শুধু স্টুডেন্ট", icon: <FiUsers size={11} />, cls: "bg-cyan-500/10 text-cyan-400" },
    instructors: { text: "শুধু ইন্সট্রাক্টর", icon: <FiUserCheck size={11} />, cls: "bg-purple-500/10 text-purple-400" },
    both: { text: "সবার জন্য", icon: <FiUsers size={11} />, cls: "bg-green-500/10 text-green-400" },
  };
  const b = map[a] || map.students;
  return <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${b.cls}`}>{b.icon}{b.text}</span>;
};

// ── Modal form ───────────────────────────────────────────────────────────
const AnnouncementModal = ({ announcement, courses, onClose, onSaved }) => {
  const isEdit = !!announcement?._id;
  const [form, setForm] = useState(
    isEdit
      ? {
          title: announcement.title,
          message: announcement.message,
          scope: announcement.scope,
          course: announcement.course?._id || announcement.course || "",
          audience: announcement.audience,
          priority: announcement.priority,
          eventDate: announcement.eventDate ? announcement.eventDate.slice(0, 16) : "",
        }
      : { ...EMPTY }
  );
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title.trim()) return toast.error("টাইটেল দেওয়া আবশ্যক");
    if (!form.message.trim()) return toast.error("মেসেজ দেওয়া আবশ্যক");
    if (form.scope === "course" && !form.allCourses && !form.course) return toast.error("কোর্স নির্বাচন করা আবশ্যক");

    setSaving(true);
    const body = { ...form, eventDate: form.eventDate || null };
    try {
      if (isEdit) {
        await api.put(`/admin/announcements/${announcement._id}`, body);
        toast.success("অ্যানাউন্সমেন্ট আপডেট হয়েছে!");
      } else {
        await api.post("/admin/announcements", body);
        toast.success("নতুন অ্যানাউন্সমেন্ট তৈরি হয়েছে!");
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving announcement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-bold text-lg">{isEdit ? "অ্যানাউন্সমেন্ট এডিট করো" : "নতুন অ্যানাউন্সমেন্ট"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><FiX size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelCls}>টাইটেল *</label>
            <input className={inputCls} placeholder="আগামীকাল ক্লাস বন্ধ থাকবে" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>

          <div>
            <label className={labelCls}>মেসেজ *</label>
            <textarea className={inputCls} rows={4} placeholder="বিস্তারিত লিখো..." value={form.message} onChange={(e) => set("message", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>ধরন *</label>
              <select className={inputCls} value={form.scope} onChange={(e) => set("scope", e.target.value)}>
                <option value="global">সবার জন্য (Global)</option>
                <option value="course">নির্দিষ্ট কোর্স</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>প্রায়োরিটি</label>
              <select className={inputCls} value={form.priority} onChange={(e) => set("priority", e.target.value)}>
                <option value="normal">সাধারণ</option>
                <option value="important">গুরুত্বপূর্ণ</option>
                <option value="urgent">জরুরি</option>
              </select>
            </div>
          </div>

          {form.scope === "course" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls + " mb-0"}>কোর্স নির্বাচন করো *</label>
                {!isEdit && (
                  <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                    <input type="checkbox" checked={form.allCourses} onChange={(e) => set("allCourses", e.target.checked)} className="accent-cyan-500" />
                    সব কোর্সের জন্য
                  </label>
                )}
              </div>
              {form.allCourses ? (
                <p className="text-cyan-400 text-xs bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-2.5">
                  প্রতিটি কোর্সের জন্য আলাদা করে অ্যানাউন্সমেন্ট তৈরি হবে ({courses.length} টা কোর্স)
                </p>
              ) : (
                <select className={inputCls} value={form.course} onChange={(e) => set("course", e.target.value)}>
                  <option value="">— কোর্স বাছাই করো —</option>
                  {courses.map((c) => <option key={c._id} value={c._id}>{c.emoji} {c.title}</option>)}
                </select>
              )}
            </div>
          )}

          <div>
            <label className={labelCls}>কাদের দেখাবে *</label>
            <select className={inputCls} value={form.audience} onChange={(e) => set("audience", e.target.value)}>
              <option value="students">শুধু স্টুডেন্ট</option>
              <option value="instructors">শুধু ইন্সট্রাক্টর</option>
              <option value="both">স্টুডেন্ট + ইন্সট্রাক্টর উভয়</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>তারিখ/সময় (ঐচ্ছিক — যেমন class off বা module publish এর সময়)</label>
            <input className={inputCls} type="datetime-local" value={form.eventDate} onChange={(e) => set("eventDate", e.target.value)} />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white text-sm transition-colors">বাতিল</button>
          <button onClick={save} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold text-sm transition-colors disabled:opacity-50">
            <FiSave size={15} /> {saving ? "সংরক্ষণ হচ্ছে..." : isEdit ? "আপডেট করো" : "তৈরি করো"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main page ────────────────────────────────────────────────────────────
const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [filterScope, setFilterScope] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [aRes, cRes] = await Promise.allSettled([
        api.get("/admin/announcements"),
        api.get("/admin/courses"),
      ]);
      if (aRes.status === "fulfilled") setAnnouncements(aRes.value.data);
      if (cRes.status === "fulfilled") setCourses(cRes.value.data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm("এই অ্যানাউন্সমেন্টটি মুছে দেওয়া হবে। নিশ্চিত?")) return;
    try {
      await api.delete(`/admin/announcements/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
      toast.success("মুছে দেওয়া হয়েছে");
    } catch {
      toast.error("Error deleting");
    }
  };

  const handleToggleActive = async (a) => {
    try {
      const res = await api.put(`/admin/announcements/${a._id}`, { isActive: !a.isActive });
      setAnnouncements((prev) => prev.map((x) => (x._id === a._id ? res.data : x)));
    } catch {
      toast.error("Error updating status");
    }
  };

  const filtered = filterScope ? announcements.filter((a) => a.scope === filterScope) : announcements;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">অ্যানাউন্সমেন্ট ম্যানেজমেন্ট</h1>
            <p className="text-gray-500 text-sm mt-1">Global অথবা নির্দিষ্ট কোর্সের জন্য অ্যানাউন্সমেন্ট তৈরি করো</p>
          </div>
          <button onClick={() => setModal({})} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold text-sm transition-colors">
            <FiPlus size={16} /> নতুন অ্যানাউন্সমেন্ট
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { key: "", label: "সব" },
            { key: "global", label: "Global" },
            { key: "course", label: "কোর্স-ভিত্তিক" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterScope(f.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterScope === f.key ? "bg-cyan-500 text-gray-950" : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-gray-900 border border-dashed border-gray-800 rounded-2xl p-16 text-center">
            <FiBell size={40} className="text-gray-700 mx-auto mb-4" />
            <p className="text-gray-300 font-semibold mb-1">কোনো অ্যানাউন্সমেন্ট নেই</p>
            <p className="text-gray-500 text-sm">উপরের "নতুন অ্যানাউন্সমেন্ট" বাটনে ক্লিক করো।</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((a) => (
              <div key={a._id} className={`bg-gray-900 border rounded-xl p-5 ${a.isActive ? "border-gray-800" : "border-gray-800 opacity-60"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${a.scope === "global" ? "bg-blue-500/10 text-blue-400" : "bg-orange-500/10 text-orange-400"}`}>
                        {a.scope === "global" ? <FiGlobe size={11} /> : <FiBookOpen size={11} />}
                        {a.scope === "global" ? "Global" : a.course?.title || "কোর্স"}
                      </span>
                      {audienceBadge(a.audience)}
                      {priorityBadge(a.priority)}
                      {!a.isActive && <span className="text-xs px-2.5 py-1 rounded-full bg-gray-800 text-gray-500">নিষ্ক্রিয়</span>}
                    </div>
                    <h3 className="text-white font-semibold mb-1">{a.title}</h3>
                    <p className="text-gray-400 text-sm whitespace-pre-wrap">{a.message}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
                      <span>{a.createdBy?.name} ({a.createdByRole})</span>
                      <span>{new Date(a.createdAt).toLocaleString("bn-BD")}</span>
                      {a.eventDate && (
                        <span className="flex items-center gap-1 text-yellow-500">
                          <FiClock size={11} /> {new Date(a.eventDate).toLocaleString("bn-BD")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleToggleActive(a)} className="px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
                      {a.isActive ? "নিষ্ক্রিয় করো" : "সক্রিয় করো"}
                    </button>
                    <button onClick={() => setModal(a)} className="p-2 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10 transition-colors" title="এডিট">
                      <FiEdit2 size={15} />
                    </button>
                    <button onClick={() => handleDelete(a._id)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors" title="মুছো">
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {modal !== null && (
          <AnnouncementModal
            announcement={modal._id ? modal : null}
            courses={courses}
            onClose={() => setModal(null)}
            onSaved={() => { setModal(null); load(); }}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminAnnouncements;
