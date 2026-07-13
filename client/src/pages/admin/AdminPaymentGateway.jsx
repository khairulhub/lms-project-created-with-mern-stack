// client/src/pages/admin/AdminPaymentGateway.jsx
// SSLCommerz Store ID/Password আর Live/Test toggle — .env touch না করেই
// admin panel থেকে set করা যায়। Site বিক্রি করার পর নতুন owner নিজের
// credentials নিজেই বসাতে পারবে এখান থেকে।

import { useEffect, useState } from "react";
import { FiLock, FiSave, FiExternalLink, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";

const inputClass = "w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors";
const labelClass = "block text-xs font-medium text-gray-400 mb-1.5";

const AdminPaymentGateway = () => {
  const [storeId, setStoreId] = useState("");
  const [storePasswd, setStorePasswd] = useState(""); // blank = "unchanged" on save
  const [isLive, setIsLive] = useState(false);
  const [hasStoredPasswd, setHasStoredPasswd] = useState(false);
  const [usingEnvFallback, setUsingEnvFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get("/admin/payment-settings")
      .then(({ data }) => {
        setStoreId(data.sslStoreId || "");
        setIsLive(!!data.isLive);
        setHasStoredPasswd(!!data.sslStorePasswd);
        setUsingEnvFallback(!!data.usingEnvFallback);
      })
      .catch(() => toast.error("Settings load করা যায়নি।"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { sslStoreId: storeId.trim(), isLive };
      if (storePasswd.trim()) payload.sslStorePasswd = storePasswd.trim();
      await api.put("/admin/payment-settings", payload);
      toast.success("Payment gateway settings saved!");
      setStorePasswd("");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save করা যায়নি।");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-white mb-1">Payment Gateway</h1>
        <p className="text-gray-400 mb-6">SSLCommerz দিয়ে automated payment (bKash/Nagad/Card) সেট করো</p>

        {loading ? (
          <div className="text-center py-16">
            <div style={{ width: 30, height: 30, border: "3px solid #7c3aed", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <>
            {usingEnvFallback && (
              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-5 text-amber-300 text-xs">
                <FiAlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>এখনো admin panel এ কিছু set করা হয়নি — সার্ভারের `.env` ফাইলের credentials ব্যবহার হচ্ছে। এখানে save করলে সেটা override হয়ে যাবে।</span>
              </div>
            )}

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-5">
              <div className="flex items-center gap-2 mb-5">
                <FiLock className="text-cyan-400" size={16} />
                <p className="text-white font-bold text-sm">SSLCommerz Credentials</p>
              </div>

              <div className="mb-4">
                <label className={labelClass}>Store ID</label>
                <input className={inputClass} value={storeId} onChange={(e) => setStoreId(e.target.value)}
                  placeholder="যেমন: yourstore1234live" />
              </div>

              <div className="mb-4">
                <label className={labelClass}>
                  Store Password (API/Secret Key) {hasStoredPasswd && <span className="text-emerald-400">— already set ✓</span>}
                </label>
                <input className={inputClass} type="password" value={storePasswd} onChange={(e) => setStorePasswd(e.target.value)}
                  placeholder={hasStoredPasswd ? "পরিবর্তন করতে চাইলেই শুধু নতুন value লেখো" : "Store Password দাও"} />
                <p className="text-gray-500 text-xs mt-1">খালি রাখলে আগেরটাই থেকে যাবে।</p>
              </div>

              <div className="flex items-center justify-between bg-gray-800/60 rounded-xl px-4 py-3 mb-2">
                <div>
                  <p className="text-white text-sm font-semibold">{isLive ? "Live Mode (আসল টাকা কাটবে)" : "Test/Sandbox Mode"}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {isLive ? "Real payment হবে — শুধু production-ready live credentials দিয়েই on করো।" : "Sandbox credentials দিয়ে বিনা পয়সায় টেস্ট করা যাবে।"}
                  </p>
                </div>
                <button
                  onClick={() => setIsLive((v) => !v)}
                  className="relative w-12 h-6 rounded-full transition-colors shrink-0"
                  style={{ background: isLive ? "#22c55e" : "#4b5563" }}
                >
                  <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all"
                    style={{ left: isLive ? 26 : 2 }} />
                </button>
              </div>

              {isLive && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 mt-3 text-red-300 text-xs">
                  <FiAlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>Live mode অন করার আগে নিশ্চিত হও যে উপরের Store ID/Password টা SSLCommerz-এর <strong>live</strong> merchant account থেকে নেওয়া — sandbox credentials দিয়ে live mode এ কিছু কাজ করবে না।</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-gray-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
                <FiSave size={14} /> {saving ? "Saving..." : "Save Settings"}
              </button>
              <a href="https://developer.sslcommerz.com/registration/" target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs">
                Sandbox account বানাও <FiExternalLink size={12} />
              </a>
            </div>

            <div className="flex items-start gap-2 text-gray-500 text-xs mt-6">
              <FiCheckCircle size={13} className="mt-0.5 shrink-0" />
              <span>এই ফিচারের কারণে site বিক্রি বা transfer করলে নতুন owner কোড/`.env` টাচ না করেই এখান থেকে নিজের SSLCommerz account বসাতে পারবে।</span>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminPaymentGateway;
