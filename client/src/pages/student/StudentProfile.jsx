// client/src/pages/student/StudentProfile.jsx
// Programming Hero style profile page — left sidebar with sections,
// right panel shows active section content.
// Sections: My Profile (edit) | Active Devices | My Courses (enrolled)

import { useState, useEffect, useRef } from "react";
import {
  FiUser, FiEdit2, FiSave, FiX, FiMonitor, FiBookOpen,
  FiAward, FiMail, FiPhone, FiFileText, FiChevronRight,
  FiCamera, FiTrash2, FiCheck,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../utils/api";

const IMGBB_KEY = import.meta.env.VITE_IMGBB_API_KEY;

// ── Sidebar menu items ────────────────────────────────────────────────────
const MENU = [
  { id: "profile",  icon: <FiUser />,     label: "My Profile" },
  { id: "devices",  icon: <FiMonitor />,  label: "Active Devices" },
  { id: "courses",  icon: <FiBookOpen />, label: "My Courses" },
  { id: "certs",    icon: <FiAward />,    label: "Certificates" },
];

// ── Helpers ───────────────────────────────────────────────────────────────
const Avatar = ({ src, email, size = 80 }) => (
  <img
    src={src || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`}
    alt="avatar"
    style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }}
    onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`; }}
  />
);

const Field = ({ label, value }) => (
  <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 16, marginBottom: 16 }}>
    <p style={{ color: "#9ca3af", fontSize: 11, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
    <p style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>{value || <span style={{ color: "#4b5563" }}>—</span>}</p>
  </div>
);

const Input = ({ label, value, onChange, placeholder, type = "text" }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", color: "#9ca3af", fontSize: 12, marginBottom: 6, fontWeight: 500 }}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", boxSizing: "border-box",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10, padding: "10px 14px",
        color: "#fff", fontSize: 14,
        outline: "none",
      }}
    />
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
// Section: My Profile
// ════════════════════════════════════════════════════════════════════════════
const SectionProfile = ({ user, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    designation: user?.designation || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
    profileImage: user?.profileImage || "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  // sync if user prop changes
  useEffect(() => {
    setForm({
      name: user?.name || "",
      designation: user?.designation || "",
      phone: user?.phone || "",
      bio: user?.bio || "",
      profileImage: user?.profileImage || "",
    });
  }, [user]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!IMGBB_KEY) return toast.error("VITE_IMGBB_API_KEY missing in .env");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setForm(p => ({ ...p, profileImage: data.data.url }));
        toast.success("Photo updated!");
      } else toast.error("Upload failed");
    } catch { toast.error("Upload error"); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/users/profile", form);
      toast.success("Profile saved!");
      onUpdate && onUpdate(data);
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  };

  // Student ID — use DB _id last 8 chars as a simple ID
  const studentId = user?._id ? `STU-${user._id.slice(-8).toUpperCase()}` : "—";

  return (
    <div>
      {/* Header bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h2 style={{ color: "#a78bfa", fontWeight: 700, fontSize: 18 }}>My Profile</h2>
        {!editing ? (
          <button onClick={() => setEditing(true)}
            style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)", color: "#a78bfa", borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <FiEdit2 size={13} /> Edit
          </button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleSave} disabled={saving || uploading}
              style={{ background: "linear-gradient(90deg,#7c3aed,#06b6d4)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 16px", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, opacity: saving ? 0.7 : 1 }}>
              <FiSave size={13} /> {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={() => setEditing(false)}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af", borderRadius: 8, padding: "6px 12px", fontSize: 13, cursor: "pointer" }}>
              <FiX size={13} />
            </button>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Left col */}
        <div>
          {editing ? (
            <>
              <Input label="Full Name *" value={form.name} onChange={v => setForm(p=>({...p,name:v}))} placeholder="Your full name" />
              <Input label="Designation" value={form.designation} onChange={v => setForm(p=>({...p,designation:v}))} placeholder="e.g. Full Stack Developer" />
              <Input label="Phone / Mobile" value={form.phone} onChange={v => setForm(p=>({...p,phone:v}))} placeholder="+880 1700 000000" />
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", color: "#9ca3af", fontSize: 12, marginBottom: 6, fontWeight: 500 }}>Bio</label>
                <textarea
                  value={form.bio}
                  onChange={e => setForm(p=>({...p,bio:e.target.value}))}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", resize: "none" }}
                />
              </div>
            </>
          ) : (
            <>
              <Field label="Full Name" value={user?.name} />
              <Field label="Email" value={user?.email} />
              <Field label="Student ID" value={studentId} />
              <Field label="Mobile Number" value={user?.phone} />
              <Field label="Designation" value={user?.designation} />
              {user?.bio && <Field label="Bio" value={user?.bio} />}
            </>
          )}
        </div>

        {/* Right col — photo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          {/* Avatar with upload overlay */}
          <div style={{ position: "relative", display: "inline-block" }}>
            <div style={{
              width: 120, height: 120, borderRadius: "50%",
              border: "3px solid transparent",
              backgroundImage: "linear-gradient(#0d011f,#0d011f), linear-gradient(135deg,#7c3aed,#06b6d4)",
              backgroundOrigin: "border-box",
              backgroundClip: "padding-box, border-box",
              padding: 3,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Avatar src={editing ? form.profileImage : user?.profileImage} email={user?.email} size={114} />
            </div>

            {editing && (
              <>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  style={{
                    position: "absolute", bottom: 4, right: 4,
                    background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                    border: "2px solid #0d011f",
                    borderRadius: "50%", width: 32, height: 32,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "#fff",
                  }}
                >
                  {uploading
                    ? <div style={{ width: 14, height: 14, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    : <FiCamera size={14} />
                  }
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
              </>
            )}
          </div>

          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{user?.name}</p>
            <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 2 }}>{user?.designation || user?.role}</p>
            <p style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>{user?.email}</p>
            <span style={{
              display: "inline-block", marginTop: 8,
              background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)",
              color: "#a78bfa", borderRadius: 20, padding: "2px 12px", fontSize: 12, fontWeight: 600,
            }}>{studentId}</span>
          </div>

          {/* Profile complete % */}
          {(() => {
            const fields = [user?.name, user?.email, user?.phone, user?.designation, user?.bio, user?.profileImage];
            const filled = fields.filter(Boolean).length;
            const pct = Math.round((filled / fields.length) * 100);
            return (
              <div style={{ width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "#9ca3af", fontSize: 12 }}>Complete your profile</span>
                  <span style={{ color: pct === 100 ? "#22c55e" : "#a78bfa", fontSize: 12, fontWeight: 700 }}>{pct}%</span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 6, height: 6, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 6,
                    background: pct === 100 ? "#22c55e" : "linear-gradient(90deg,#7c3aed,#06b6d4)",
                    width: `${pct}%`, transition: "width 0.5s",
                  }} />
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// Section: Active Devices
// ════════════════════════════════════════════════════════════════════════════
const SectionDevices = () => {
  // Device info is detected from current browser/session — not stored in DB.
  // Shows current session + any previous login info from localStorage.
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    // Build device list from current session + stored history
    const current = {
      id: "current",
      platform: navigator.platform || "Unknown",
      browser: (() => {
        const ua = navigator.userAgent;
        if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
        if (ua.includes("Firefox")) return "Firefox";
        if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
        if (ua.includes("Edg")) return "Edge";
        return "Browser";
      })(),
      os: (() => {
        const ua = navigator.userAgent;
        if (ua.includes("Windows NT 10")) return "Windows 10";
        if (ua.includes("Windows NT 11") || ua.includes("Windows NT 10.0; Win64")) return "Windows 11";
        if (ua.includes("Mac OS X")) return "macOS";
        if (ua.includes("Linux")) return "Linux";
        if (ua.includes("Android")) return "Android";
        if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
        return "Unknown OS";
      })(),
      date: new Date().toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      current: true,
    };

    // Load stored login history
    let history = [];
    try { history = JSON.parse(localStorage.getItem("lms_login_history") || "[]"); } catch {}

    setDevices([current, ...history.slice(0, 3)]);
  }, []);

  const removeDevice = (id) => {
    setDevices(prev => prev.filter(d => d.id !== id));
    let history = [];
    try { history = JSON.parse(localStorage.getItem("lms_login_history") || "[]"); } catch {}
    localStorage.setItem("lms_login_history", JSON.stringify(history.filter(d => d.id !== id)));
    toast.success("Device removed");
  };

  return (
    <div>
      <h2 style={{ color: "#a78bfa", fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Device Activity</h2>

      <div style={{
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 12, overflow: "hidden",
      }}>
        {/* Table header */}
        <div style={{
          display: "grid", gridTemplateColumns: "50px 1fr 1fr 1fr 80px",
          padding: "12px 20px", background: "rgba(255,255,255,0.04)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          {["Serial", "Platform / OS", "Browser", "Date", "Action"].map(h => (
            <span key={h} style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{h}</span>
          ))}
        </div>

        {devices.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#4b5563" }}>No device data found.</div>
        ) : devices.map((d, i) => (
          <div key={d.id} style={{
            display: "grid", gridTemplateColumns: "50px 1fr 1fr 1fr 80px",
            padding: "14px 20px", alignItems: "center",
            borderBottom: i < devices.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
            background: d.current ? "rgba(124,58,237,0.06)" : "transparent",
          }}>
            <span style={{ color: "#9ca3af", fontSize: 14 }}>{i + 1}</span>
            <div>
              <span style={{ color: d.current ? "#a78bfa" : "#e5e7eb", fontSize: 14 }}>{d.os || d.platform}</span>
              {d.current && <span style={{ marginLeft: 8, background: "rgba(34,197,94,0.15)", color: "#22c55e", borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 600 }}>Current</span>}
            </div>
            <span style={{ color: "#9ca3af", fontSize: 14 }}>{d.browser || "—"}</span>
            <span style={{ color: "#6b7280", fontSize: 13 }}>{d.date}</span>
            <div>
              {!d.current ? (
                <button onClick={() => removeDevice(d.id)}
                  style={{ background: "none", border: "none", color: "#a78bfa", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  Remove
                </button>
              ) : <span style={{ color: "#374151", fontSize: 12 }}>—</span>}
            </div>
          </div>
        ))}
      </div>

      <p style={{ color: "#4b5563", fontSize: 12, marginTop: 12 }}>
        * Device info is based on your current browser session.
      </p>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// Section: My Courses
// ════════════════════════════════════════════════════════════════════════════
const SectionCourses = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/enrollments/my")
      .then(res => setEnrollments(res.data || []))
      .catch(() => setEnrollments([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ color: "#6b7280", padding: 40, textAlign: "center" }}>
      <div style={{ width: 32, height: 32, border: "3px solid #7c3aed", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
      লোড হচ্ছে...
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (enrollments.length === 0) return (
    <div style={{ textAlign: "center", padding: 48 }}>
      <p style={{ fontSize: 40, marginBottom: 12 }}>📚</p>
      <p style={{ color: "#fff", fontWeight: 600 }}>কোনো কোর্সে ভর্তি হওনি</p>
      <p style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>কোর্সে ভর্তি হও এবং শেখা শুরু করো।</p>
    </div>
  );

  return (
    <div>
      <h2 style={{ color: "#a78bfa", fontWeight: 700, fontSize: 18, marginBottom: 20 }}>My Courses</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: 16 }}>
        {enrollments.map(en => {
          const course = en.course;
          const statusColor = en.status === "approved" ? "#22c55e" : en.status === "rejected" ? "#ef4444" : "#f59e0b";
          return (
            <div key={en._id} style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14, overflow: "hidden", transition: "border-color 0.2s",
            }}>
              {course?.thumbnail && (
                <img src={course.thumbnail} alt={course.title} style={{ width: "100%", height: 120, objectFit: "cover" }} />
              )}
              <div style={{ padding: "14px 16px" }}>
                <p style={{ color: "#fff", fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{course?.title || "Course"}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ background: `${statusColor}20`, color: statusColor, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>
                    {en.status === "approved" ? "✓ Approved" : en.status === "rejected" ? "✗ Rejected" : "⏳ Pending"}
                  </span>
                  {en.status === "approved" && course?._id && (
                    <Link to={`/student/course/${course._id}`}
                      style={{ color: "#a78bfa", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                      Continue →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// Section: Certificates
// ════════════════════════════════════════════════════════════════════════════
const SectionCerts = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/enrollments/my")
      .then(res => setEnrollments((res.data || []).filter(e => e.status === "approved")))
      .catch(() => setEnrollments([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: "#6b7280", padding: 40, textAlign: "center" }}>লোড হচ্ছে...</div>;

  return (
    <div>
      <h2 style={{ color: "#a78bfa", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Certificates</h2>
      <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>
        কোর্স সম্পন্ন করলে সার্টিফিকেট পাবে।{" "}
        <Link to="/student/certificates" style={{ color: "#a78bfa" }}>সব দেখো →</Link>
      </p>
      {enrollments.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <p style={{ fontSize: 36, marginBottom: 8 }}>🎓</p>
          <p style={{ color: "#6b7280" }}>কোনো approved কোর্স নেই</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {enrollments.map(en => (
            <CertRow key={en._id} enrollment={en} />
          ))}
        </div>
      )}
    </div>
  );
};

const CertRow = ({ enrollment }) => {
  const courseId = enrollment.course?._id || enrollment.course;
  const title = enrollment.course?.title || "Course";
  const [elig, setElig] = useState(null);
  const [dl, setDl] = useState(false);

  useEffect(() => {
    api.get(`/certificates/${courseId}/eligibility`)
      .then(r => setElig(r.data))
      .catch(() => setElig({ eligible: false }));
  }, [courseId]);

  const download = async () => {
    setDl(true);
    try {
      const res = await api.get(`/certificates/${courseId}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url; a.download = `certificate-${elig?.certificateId || courseId}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Download failed");
    } finally { setDl(false); }
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12, padding: "14px 18px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: elig?.eligible ? "linear-gradient(135deg,#7c3aed,#06b6d4)" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FiAward size={16} color={elig?.eligible ? "#fff" : "#4b5563"} />
        </div>
        <div>
          <p style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{title}</p>
          {elig?.certificateId && <p style={{ color: "#6b7280", fontSize: 11, fontFamily: "monospace" }}>{elig.certificateId}</p>}
        </div>
      </div>
      {elig?.eligible ? (
        <button onClick={download} disabled={dl}
          style={{ background: "linear-gradient(90deg,#7c3aed,#06b6d4)", border: "none", color: "#fff", borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: dl ? 0.7 : 1 }}>
          {dl ? "..." : "Download"}
        </button>
      ) : (
        <span style={{ color: "#4b5563", fontSize: 12 }}>
          {elig ? `${elig.doneCount || 0}/${elig.totalLectures || 0} done` : "Loading..."}
        </span>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// Main Page
// ════════════════════════════════════════════════════════════════════════════
const StudentProfile = () => {
  const { user, setUser } = useAuth();
  const [active, setActive] = useState("profile");

  const handleUpdate = (updated) => {
    // update AuthContext user if setter available
    if (typeof setUser === "function") setUser(prev => ({ ...prev, ...updated }));
  };

  const profilePct = (() => {
    const fields = [user?.name, user?.email, user?.phone, user?.designation, user?.bio, user?.profileImage];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  })();

  const studentId = user?._id ? `STU-${user._id.slice(-8).toUpperCase()}` : "—";

  return (
    <DashboardLayout>
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

        {/* ── Left sidebar card ──────────────────────────────────────── */}
        <div style={{
          width: 240, flexShrink: 0,
          background: "linear-gradient(160deg,#110224,#0d011f)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 18, padding: "24px 16px",
          position: "sticky", top: 24,
        }}>
          {/* Avatar + info */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{
              width: 84, height: 84, borderRadius: "50%", margin: "0 auto 12px",
              border: "3px solid transparent",
              backgroundImage: "linear-gradient(#0d011f,#0d011f), linear-gradient(135deg,#7c3aed,#06b6d4)",
              backgroundOrigin: "border-box",
              backgroundClip: "padding-box, border-box",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Avatar src={user?.profileImage} email={user?.email} size={78} />
            </div>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{user?.name}</p>
            <p style={{ color: "#a78bfa", fontSize: 11, marginBottom: 2, fontWeight: 600 }}>{studentId}</p>
            <p style={{ color: "#6b7280", fontSize: 11 }}>{user?.email}</p>
            {user?.phone && <p style={{ color: "#6b7280", fontSize: 11 }}>{user.phone}</p>}

            {/* Progress bar */}
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "#9ca3af", fontSize: 10 }}>Complete your profile</span>
                <span style={{ color: profilePct === 100 ? "#22c55e" : "#a78bfa", fontSize: 10, fontWeight: 700 }}>{profilePct}%</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 4, height: 5 }}>
                <div style={{ height: "100%", borderRadius: 4, background: profilePct === 100 ? "#22c55e" : "linear-gradient(90deg,#7c3aed,#06b6d4)", width: `${profilePct}%`, transition: "width 0.4s" }} />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginBottom: 12 }} />

          {/* Menu */}
          <nav>
            {MENU.map(item => (
              <button key={item.id} onClick={() => setActive(item.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 10, padding: "10px 12px", borderRadius: 10, marginBottom: 4, cursor: "pointer",
                  background: active === item.id ? "rgba(124,58,237,0.18)" : "transparent",
                  border: active === item.id ? "1px solid rgba(124,58,237,0.3)" : "1px solid transparent",
                  color: active === item.id ? "#a78bfa" : "#9ca3af",
                  fontWeight: active === item.id ? 600 : 400,
                  fontSize: 13, textAlign: "left", transition: "all 0.15s",
                }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 15 }}>{item.icon}</span>
                  {item.label}
                </span>
                {active === item.id && <FiChevronRight size={13} />}
              </button>
            ))}
          </nav>
        </div>

        {/* ── Right content panel ───────────────────────────────────── */}
        <div style={{
          flex: 1, minWidth: 0,
          background: "linear-gradient(160deg,#110224,#0d011f)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 18, padding: 28,
        }}>
          {active === "profile"  && <SectionProfile user={user} onUpdate={handleUpdate} />}
          {active === "devices"  && <SectionDevices />}
          {active === "courses"  && <SectionCourses />}
          {active === "certs"    && <SectionCerts />}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentProfile;
