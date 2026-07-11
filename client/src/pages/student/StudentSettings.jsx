// client/src/pages/student/StudentSettings.jsx
// Account settings — password change (Firebase reauth + updatePassword),
// account info দেখা, আর account deletion request (helpdesk ticket হিসেবে
// admin এর কাছে যায়, কারণ delete করাটা admin-only action)।

import { useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { FiLock, FiUser, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../contexts/AuthContext";
import { auth } from "../../utils/firebase";
import api from "../../utils/api";

const Card = ({ title, icon, children }) => (
  <div
    style={{
      background: "linear-gradient(160deg,#110224,#0d011f)",
      border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "20px 22px", marginBottom: 20,
    }}
  >
    <div className="flex items-center gap-2 mb-4">
      <span style={{ color: "#a78bfa" }}>{icon}</span>
      <p style={{ color: "#fff", fontWeight: 700, fontSize: 14.5 }}>{title}</p>
    </div>
    {children}
  </div>
);

const Field = ({ label, value }) => (
  <div style={{ marginBottom: 12 }}>
    <p style={{ color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>{label}</p>
    <p style={{ color: "#e5e7eb", fontSize: 13.5, fontWeight: 500 }}>{value}</p>
  </div>
);

const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", color: "#9ca3af", fontSize: 12, marginBottom: 6, fontWeight: 500 }}>{label}</label>
    <input
      {...props}
      style={{
        width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 13.5, outline: "none",
      }}
    />
  </div>
);

const StudentSettings = () => {
  const { user } = useAuth();

  // firebase provider চেক — google হলে password change এখানে করা যাবে না
  const provider = auth.currentUser?.providerData?.[0]?.providerId || "password";
  const isPasswordUser = provider === "password";

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);

  const [delReason, setDelReason] = useState("");
  const [delLoading, setDelLoading] = useState(false);
  const [delSent, setDelSent] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.next.length < 6) return toast.error("নতুন password কমপক্ষে ৬ ক্যারেক্টার হতে হবে।");
    if (pwForm.next !== pwForm.confirm) return toast.error("নতুন password আর confirm password মিলছে না।");

    setPwLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, pwForm.current);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, pwForm.next);
      toast.success("Password সফলভাবে পরিবর্তন হয়েছে।");
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        toast.error("বর্তমান password ঠিক নেই।");
      } else if (err.code === "auth/too-many-requests") {
        toast.error("অনেকবার চেষ্টা হয়েছে, একটু পর আবার চেষ্টা করো।");
      } else {
        toast.error("Password পরিবর্তন করতে সমস্যা হয়েছে।");
      }
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteRequest = async () => {
    setDelLoading(true);
    try {
      await api.post("/helpdesk/tickets", {
        subject: "Account Deletion Request",
        message: delReason.trim()
          ? `আমি আমার অ্যাকাউন্ট ডিলিট করতে চাই। কারণ: ${delReason.trim()}`
          : "আমি আমার অ্যাকাউন্ট স্থায়ীভাবে ডিলিট করতে চাই।",
        category: "account",
        priority: "high",
      });
      setDelSent(true);
      toast.success("Request পাঠানো হয়েছে। Admin review করে যোগাযোগ করবে।");
    } catch {
      toast.error("Request পাঠাতে সমস্যা হয়েছে, Helpdesk থেকে সরাসরি ticket খোলো।");
    } finally {
      setDelLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-gray-400 mb-6">Account আর security সংক্রান্ত সেটিংস</p>

        {/* ── Account Info ───────────────────────────────────────────── */}
        <Card title="Account Info" icon={<FiUser size={16} />}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="নাম" value={user?.name} />
            <Field label="ইমেইল" value={user?.email} />
            <Field label="Role" value={user?.role} />
            <Field label="Login পদ্ধতি" value={isPasswordUser ? "Email/Password" : "Google"} />
            <Field label="যোগ দিয়েছে" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" }) : "—"} />
          </div>
        </Card>

        {/* ── Password & Security ───────────────────────────────────── */}
        <Card title="Password পরিবর্তন করো" icon={<FiLock size={16} />}>
          {!isPasswordUser ? (
            <p style={{ color: "#9ca3af", fontSize: 13 }}>
              তুমি Google দিয়ে সাইন আপ করেছো, তাই এই সিস্টেমে আলাদা password নেই।
              Password পরিবর্তনের জন্য সরাসরি তোমার Google Account সেটিংসে যাও।
            </p>
          ) : (
            <form onSubmit={handleChangePassword}>
              <Input label="বর্তমান Password" type="password" required
                value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} />
              <Input label="নতুন Password" type="password" required
                value={pwForm.next} onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })} />
              <Input label="নতুন Password আবার লেখো" type="password" required
                value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} />
              <button type="submit" disabled={pwLoading}
                style={{
                  background: "linear-gradient(90deg,#7c3aed,#06b6d4)", color: "#fff", fontWeight: 700, fontSize: 13,
                  padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer", opacity: pwLoading ? 0.6 : 1,
                }}>
                {pwLoading ? "পরিবর্তন হচ্ছে..." : "Password Update করো"}
              </button>
            </form>
          )}
        </Card>

        {/* ── Danger Zone ────────────────────────────────────────────── */}
        <Card title="Danger Zone" icon={<FiAlertTriangle size={16} color="#f87171" />}>
          {delSent ? (
            <div className="flex items-center gap-2" style={{ color: "#86efac", fontSize: 13 }}>
              <FiCheckCircle size={16} /> Request পাঠানো হয়েছে — Helpdesk থেকে status ট্র্যাক করতে পারবে।
            </div>
          ) : (
            <>
              <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 12 }}>
                অ্যাকাউন্ট ডিলিট করা স্থায়ী পদক্ষেপ। Security-এর জন্য admin manual review করে ডিলিট করে —
                এখান থেকে request পাঠালে admin তোমার সাথে Helpdesk-এর মাধ্যমে যোগাযোগ করবে।
              </p>
              <textarea
                placeholder="কারণ লিখো (ঐচ্ছিক)"
                value={delReason}
                onChange={(e) => setDelReason(e.target.value)}
                rows={2}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 13, outline: "none", marginBottom: 12, resize: "vertical",
                }}
              />
              <button onClick={handleDeleteRequest} disabled={delLoading}
                style={{
                  background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#f87171",
                  fontWeight: 700, fontSize: 13, padding: "10px 20px", borderRadius: 10, cursor: "pointer", opacity: delLoading ? 0.6 : 1,
                }}>
                {delLoading ? "পাঠানো হচ্ছে..." : "Account Deletion Request পাঠাও"}
              </button>
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentSettings;
