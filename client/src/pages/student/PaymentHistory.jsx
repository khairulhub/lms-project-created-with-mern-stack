// client/src/pages/student/PaymentHistory.jsx
// SSLCommerz দিয়ে করা সব payment attempt (success/failed/cancelled) — invoice
// আবার download করার সুযোগসহ।

import { useEffect, useState } from "react";
import { FiDownload, FiCheckCircle, FiXCircle, FiClock, FiAlertTriangle } from "react-icons/fi";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";

const STATUS_UI = {
  success:   { icon: <FiCheckCircle size={13} />, label: "সফল",     color: "#4ade80", bg: "rgba(34,197,94,0.12)" },
  failed:    { icon: <FiXCircle size={13} />,      label: "ব্যর্থ",   color: "#f87171", bg: "rgba(239,68,68,0.12)" },
  cancelled: { icon: <FiAlertTriangle size={13} />,label: "বাতিল",   color: "#facc15", bg: "rgba(234,179,8,0.12)" },
  pending:   { icon: <FiClock size={13} />,        label: "পেন্ডিং", color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
};

const PaymentHistory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    api.get("/payments/my")
      .then(({ data }) => setItems(data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (tranId) => {
    setDownloadingId(tranId);
    try {
      const res = await api.get(`/payments/invoice/${tranId}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${tranId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Invoice download করা যায়নি।");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Payment History</h1>
        <p className="text-gray-400 mb-6">SSLCommerz দিয়ে করা তোমার সব payment</p>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ width: 30, height: 30, border: "3px solid #7c3aed", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 text-center">
            <p className="text-6xl mb-4">🧾</p>
            <p className="text-white font-semibold mb-2">এখনো কোনো payment হয়নি</p>
            <p className="text-gray-500 text-sm">SSLCommerz দিয়ে কোনো কোর্স কিনলে এখানে transaction history দেখতে পারবে।</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {items.map((t) => {
              const ui = STATUS_UI[t.status] || STATUS_UI.pending;
              return (
                <div key={t._id}
                  style={{
                    background: "linear-gradient(160deg,#110224,#0d011f)",
                    border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 18px",
                  }}
                  className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <p style={{ color: "#fff", fontWeight: 700, fontSize: 13.5 }} className="truncate">
                      {t.course?.emoji ? `${t.course.emoji} ` : ""}{t.course?.title || "কোর্স"}
                    </p>
                    <p style={{ color: "#6b7280", fontSize: 11.5, marginTop: 3 }}>
                      {new Date(t.createdAt).toLocaleDateString("bn-BD", { year: "numeric", month: "short", day: "numeric" })}
                      {" · "}Tran ID: {t.tranId}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>৳{t.amount?.toLocaleString()}</span>
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ color: ui.color, background: ui.bg }}>
                      {ui.icon} {ui.label}
                    </span>
                    {t.status === "success" && (
                      <button onClick={() => handleDownload(t.tranId)} disabled={downloadingId === t.tranId}
                        title="Invoice Download করো"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        style={{ background: "rgba(255,255,255,0.06)", color: "#d1d5db" }}>
                        <FiDownload size={12} /> {downloadingId === t.tranId ? "..." : "Invoice"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PaymentHistory;
