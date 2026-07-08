import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import {
  FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiVideo, FiBookOpen,
  FiClock, FiLink, FiCalendar, FiGlobe, FiShield,
} from "react-icons/fi";

const inputCls = "w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors";
const labelCls = "block text-xs font-medium text-gray-400 mb-1.5";

const EMPTY = {
  title: "",
  description: "",
  course: "",
  allCourses: false,
  platform: "zoom",
  meetingLink: "",
  meetingId: "",
  passcode: "",
  startTime: "",
  durationMinutes: 60,
};

const statusBadge = (status, startTime, durationMinutes) => {
  if (status === "cancelled") return <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">বাতিল</span>;
  if (status === "completed") return <span className="text-xs px-2.5 py-1 rounded-full bg-gray-700/50 text-gray-400">শেষ হয়েছে</span>;

  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  if (now >= start && now <= end) return <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/30 animate-pulse">🔴 লাইভ এখন</span>;
  if (now > end) return <span className="text-xs px-2.5 py-1 rounded-full bg-gray-700/50 text-gray-400">শেষ হয়েছে</span>;
  return <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">আসন্ন</span>;
};

const platformBadge = (p) => (
  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${p === "zoom" ? "bg-blue-500/10 text-blue-400" : "bg-green-500/10 text-green-400"}`}>
    <FiVideo size={11} /> {p === "zoom" ? "Zoom" : "Google Meet"}
  </span>
);

// Session-এর বর্তমান অবস্থা বের করে join button এর জন্য (student page এর মতোই)
const getSessionState = (s) => {
  if (s.status === "cancelled") return "cancelled";
  if (s.status === "completed") return "ended";
  const now = new Date();
  const start = new Date(s.startTime);
  const end = new Date(start.getTime() + s.durationMinutes * 60000);
  const joinWindowStart = new Date(start.getTime() - 10 * 60000);
  if (now > end) return "ended";
  if (now >= start && now <= end) return "live";
  if (now >= joinWindowStart && now < start) return "joinable-soon";
  return "upcoming";
};

const timeUntil = (startTime) => {
  const diffMs = new Date(startTime) - new Date();
  if (diffMs <= 0) return null;
  const mins = Math.floor(diffMs / 60000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const remMins = mins % 60;
  if (days > 0) return `${days} দিন ${hours} ঘণ্টা পরে`;
  if (hours > 0) return `${hours} ঘণ্টা ${remMins} মিনিট পরে`;
  return `${remMins} মিনিট পরে`;
};

const JoinControl = ({ s }) => {
  const state = getSessionState(s);
  if (state === "cancelled") return <span className="text-xs text-red-400">সেশনটি বাতিল করা হয়েছে</span>;
  if (state === "ended") return <span className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-500 inline-block">সেশন শেষ হয়ে গেছে</span>;
  if (state === "live" || state === "joinable-soon") {
    return (
      <a href={s.meetingLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-gray-950 text-xs font-bold transition-colors">
        <FiLink size={12} /> এখনই জয়েন করো →
      </a>
    );
  }
  return <span className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-500 inline-block">{timeUntil(s.startTime) || "শীঘ্রই শুরু হবে"}</span>;
};

// ── Modal form ───────────────────────────────────────────────────────────
const SessionModal = ({ session, courses, onClose, onSaved }) => {
  const isEdit = !!session?._id;
  const [form, setForm] = useState(
    isEdit
      ? {
          title: session.title,
          description: session.description || "",
          course: session.course?._id || session.course || "",
          platform: session.platform,
          meetingLink: session.meetingLink,
          meetingId: session.meetingId || "",
          passcode: session.passcode || "",
          startTime: session.startTime ? new Date(session.startTime).toISOString().slice(0, 16) : "",
          durationMinutes: session.durationMinutes,
        }
      : { ...EMPTY, course: courses[0]?._id || "" }
  );
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title.trim()) return toast.error("টাইটেল দেওয়া আবশ্যক");
    if (!form.allCourses && !form.course) return toast.error("কোর্স নির্বাচন করা আবশ্যক");
    if (!form.meetingLink.trim()) return toast.error("মিটিং লিংক দেওয়া আবশ্যক");
    if (!form.startTime) return toast.error("শুরুর তারিখ/সময় দেওয়া আবশ্যক");

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/instructor/sessions/${session._id}`, form);
        toast.success("সেশন আপডেট হয়েছে!");
      } else {
        await api.post("/instructor/sessions", form);
        toast.success("নতুন সেশন তৈরি হয়েছে!");
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving session");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-bold text-lg">{isEdit ? "সেশন এডিট করো" : "নতুন কনসেপচুয়াল সেশন"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><FiX size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls + " mb-0"}>কোর্স নির্বাচন করো *</label>
              {!isEdit && (
                <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                  <input type="checkbox" checked={form.allCourses} onChange={(e) => set("allCourses", e.target.checked)} className="accent-cyan-500" />
                  আমার সব কোর্সের জন্য
                </label>
              )}
            </div>
            {form.allCourses ? (
              <p className="text-cyan-400 text-xs bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-2.5">
                তোমার প্রতিটি কোর্সের জন্য আলাদা করে সেশন তৈরি হবে ({courses.length} টা কোর্স)
              </p>
            ) : (
              <select className={inputCls} value={form.course} disabled={isEdit} onChange={(e) => set("course", e.target.value)}>
                <option value="">— কোর্স বাছাই করো —</option>
                {courses.map((c) => <option key={c._id} value={c._id}>{c.emoji} {c.title}</option>)}
              </select>
            )}
            {isEdit && <p className="text-gray-600 text-xs mt-1">কোর্স পরিবর্তন করা যাবে না</p>}
          </div>

          <div>
            <label className={labelCls}>টাইটেল *</label>
            <input className={inputCls} placeholder="Doubt Clearing Session - Module 3" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>

          <div>
            <label className={labelCls}>বিবরণ (ঐচ্ছিক)</label>
            <textarea className={inputCls} rows={2} placeholder="সেশনে কী নিয়ে আলোচনা হবে..." value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>

          <div>
            <label className={labelCls}>প্ল্যাটফর্ম *</label>
            <select className={inputCls} value={form.platform} onChange={(e) => set("platform", e.target.value)}>
              <option value="zoom">Zoom</option>
              <option value="google_meet">Google Meet</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>মিটিং লিংক *</label>
            <input className={inputCls} placeholder="https://zoom.us/j/... বা https://meet.google.com/..." value={form.meetingLink} onChange={(e) => set("meetingLink", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Meeting ID (ঐচ্ছিক)</label>
              <input className={inputCls} placeholder="123 456 7890" value={form.meetingId} onChange={(e) => set("meetingId", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Passcode (ঐচ্ছিক)</label>
              <input className={inputCls} placeholder="abc123" value={form.passcode} onChange={(e) => set("passcode", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>শুরুর তারিখ/সময় *</label>
              <input className={inputCls} type="datetime-local" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>স্থিতিকাল (মিনিট)</label>
              <input className={inputCls} type="number" min={10} step={5} value={form.durationMinutes} onChange={(e) => set("durationMinutes", Number(e.target.value))} />
            </div>
          </div>

          {isEdit && (
            <div>
              <label className={labelCls}>স্ট্যাটাস</label>
              <select className={inputCls} value={session.status} onChange={(e) => api.put(`/instructor/sessions/${session._id}`, { status: e.target.value }).then(onSaved)}>
                <option value="scheduled">নির্ধারিত</option>
                <option value="cancelled">বাতিল</option>
                <option value="completed">সম্পন্ন</option>
              </select>
            </div>
          )}
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

// ── Read-only detail modal (admin er session dekhar jonno) ────────────────
const AdminSessionDetailModal = ({ session, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
    <div className="w-full max-w-lg bg-gray-900 border border-cyan-900/40 rounded-2xl p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${session.scope === "global" ? "bg-blue-500/10 text-blue-400" : "bg-orange-500/10 text-orange-400"}`}>
            {session.scope === "global" ? <FiGlobe size={11} /> : <FiBookOpen size={11} />}
            {session.scope === "global" ? "সাধারণ সেশন" : session.course?.title || "কোর্স"}
          </span>
          {platformBadge(session.platform)}
          {statusBadge(session.status, session.startTime, session.durationMinutes)}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white shrink-0"><FiX size={20} /></button>
      </div>

      <h3 className="text-white font-bold text-lg mb-2">{session.title}</h3>
      {session.description && <p className="text-gray-300 text-sm mb-3">{session.description}</p>}

      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1"><FiCalendar size={11} /> {new Date(session.startTime).toLocaleString("bn-BD")}</span>
        <span className="flex items-center gap-1"><FiClock size={11} /> {session.durationMinutes} মিনিট</span>
      </div>

      <a href={session.meetingLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-sm">
        <FiLink size={13} /> মিটিং এ যাও
      </a>

      <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-gray-800 text-xs text-gray-500">
        <span>{session.createdBy?.name} (অ্যাডমিন)</span>
      </div>
    </div>
  </div>
);

// ── Main page ────────────────────────────────────────────────────────────
const InstructorSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [fromAdmin, setFromAdmin] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [adminModal, setAdminModal] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, cRes, fRes] = await Promise.allSettled([
        api.get("/instructor/sessions"),
        api.get("/instructor/courses"),
        api.get("/sessions/feed"),
      ]);
      if (sRes.status === "fulfilled") setSessions(sRes.value.data);
      if (cRes.status === "fulfilled") setCourses(cRes.value.data);
      if (fRes.status === "fulfilled") setFromAdmin(fRes.value.data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm("এই সেশনটি মুছে দেওয়া হবে। নিশ্চিত?")) return;
    try {
      await api.delete(`/instructor/sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s._id !== id));
      toast.success("মুছে দেওয়া হয়েছে");
    } catch {
      toast.error("Error deleting");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">কনসেপচুয়াল সেশন</h1>
            <p className="text-gray-500 text-sm mt-1">নিজের কোর্সের জন্য Zoom/Google Meet সেশন শিডিউল করো</p>
          </div>
          <button
            onClick={() => courses.length ? setModal({}) : toast.error("প্রথমে একটা কোর্স তৈরি করো")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold text-sm transition-colors"
          >
            <FiPlus size={16} /> নতুন সেশন
          </button>
        </div>

        {/* Admin থেকে পাঠানো session (global বা এই instructor এর course নিয়ে) */}
        {fromAdmin.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
              <FiShield size={14} /> অ্যাডমিন থেকে
            </h2>
            <div className="space-y-3">
              {fromAdmin.map((s) => (
                <div
                  key={s._id}
                  onClick={() => setAdminModal(s)}
                  className="cursor-pointer bg-gray-900 border border-cyan-900/40 rounded-xl p-5 hover:border-cyan-600/60 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${s.scope === "global" ? "bg-blue-500/10 text-blue-400" : "bg-orange-500/10 text-orange-400"}`}>
                      {s.scope === "global" ? <FiGlobe size={11} /> : <FiBookOpen size={11} />}
                      {s.scope === "global" ? "সাধারণ সেশন" : s.course?.title || "কোর্স"}
                    </span>
                    {platformBadge(s.platform)}
                    {statusBadge(s.status, s.startTime, s.durationMinutes)}
                  </div>
                  <h3 className="text-white font-semibold mb-1">{s.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><FiCalendar size={11} /> {new Date(s.startTime).toLocaleString("bn-BD")}</span>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}><JoinControl s={s} /></div>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-sm font-semibold text-gray-400 mb-3">আমার শিডিউল করা সেশন</h2>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-gray-900 border border-dashed border-gray-800 rounded-2xl p-16 text-center">
            <FiVideo size={40} className="text-gray-700 mx-auto mb-4" />
            <p className="text-gray-300 font-semibold mb-1">কোনো সেশন নেই</p>
            <p className="text-gray-500 text-sm">উপরের "নতুন সেশন" বাটনে ক্লিক করো।</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s._id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-orange-500/10 text-orange-400">
                        <FiBookOpen size={11} /> {s.course?.title || "কোর্স"}
                      </span>
                      {platformBadge(s.platform)}
                      {statusBadge(s.status, s.startTime, s.durationMinutes)}
                    </div>
                    <h3 className="text-white font-semibold mb-1">{s.title}</h3>
                    {s.description && <p className="text-gray-400 text-sm mb-2">{s.description}</p>}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><FiCalendar size={11} /> {new Date(s.startTime).toLocaleString("bn-BD")}</span>
                      <span className="flex items-center gap-1"><FiClock size={11} /> {s.durationMinutes} মিনিট</span>
                    </div>
                    <div className="mt-2"><JoinControl s={s} /></div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setModal(s)} className="p-2 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10 transition-colors" title="এডিট">
                      <FiEdit2 size={15} />
                    </button>
                    <button onClick={() => handleDelete(s._id)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors" title="মুছো">
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {modal !== null && (
          <SessionModal
            session={modal._id ? modal : null}
            courses={courses}
            onClose={() => setModal(null)}
            onSaved={() => { setModal(null); load(); }}
          />
        )}

        {adminModal && (
          <AdminSessionDetailModal session={adminModal} onClose={() => setAdminModal(null)} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default InstructorSessions;
