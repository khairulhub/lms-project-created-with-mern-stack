// client/src/pages/admin/AdminTransactions.jsx
// SSLCommerz এর সব payment attempt — success/failed/cancelled/pending সবই,
// Enrollment list এ শুধু approved গুলো দেখা যায়, এখানে fail/cancel ও দেখা যাবে
// (debug করার জন্য দরকারি — কারো payment বারবার fail হলে এখানে ধরা পড়বে)।

import { useEffect, useState } from "react";
import { FiCheckCircle, FiXCircle, FiClock, FiAlertTriangle, FiFilter } from "react-icons/fi";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";

const STATUS_UI = {
  success:   { icon: <FiCheckCircle size={13} />, label: "Success",   color: "#4ade80", bg: "rgba(34,197,94,0.12)" },
  failed:    { icon: <FiXCircle size={13} />,      label: "Failed",   color: "#f87171", bg: "rgba(239,68,68,0.12)" },
  cancelled: { icon: <FiAlertTriangle size={13} />,label: "Cancelled",color: "#facc15", bg: "rgba(234,179,8,0.12)" },
  pending:   { icon: <FiClock size={13} />,        label: "Pending",  color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
};

const FILTERS = ["all", "success", "failed", "cancelled", "pending"];

const AdminTransactions = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    api.get("/admin/payments", { params: filter !== "all" ? { status: filter } : {} })
      .then(({ data }) => setItems(data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [filter]);

  const totals = items.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    if (t.status === "success") acc.revenue = (acc.revenue || 0) + t.amount;
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Payment Transactions</h1>
        <p className="text-gray-400 mb-6">SSLCommerz এর সব payment attempt (success/fail/cancel সবই)</p>

        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <FiFilter size={14} className="text-gray-500" />
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors"
              style={{
                background: filter === f ? "linear-gradient(90deg,#7c3aed,#06b6d4)" : "rgba(255,255,255,0.05)",
                color: filter === f ? "#fff" : "#9ca3af",
              }}>
              {f}
            </button>
          ))}
          {totals.revenue > 0 && (
            <span className="ml-auto text-sm text-emerald-400 font-bold">Total Revenue: ৳{totals.revenue.toLocaleString()}</span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div style={{ width: 30, height: 30, border: "3px solid #7c3aed", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 text-center">
            <p className="text-6xl mb-4">🧾</p>
            <p className="text-white font-semibold">কোনো transaction নেই</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-gray-900 border border-gray-800 rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs border-b border-gray-800">
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Course</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Tran ID</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => {
                  const ui = STATUS_UI[t.status] || STATUS_UI.pending;
                  return (
                    <tr key={t._id} className="border-b border-gray-800/60 last:border-0">
                      <td className="px-4 py-3">
                        <p className="text-white text-xs font-semibold">{t.user?.name || "-"}</p>
                        <p className="text-gray-500 text-[11px]">{t.user?.email || ""}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-xs">{t.course?.title || "-"}</td>
                      <td className="px-4 py-3 text-white text-xs font-bold">৳{t.amount?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-500 text-[11px]">{t.tranId}</td>
                      <td className="px-4 py-3 text-gray-500 text-[11px]">
                        {new Date(t.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold w-fit"
                          style={{ color: ui.color, background: ui.bg }}>
                          {ui.icon} {ui.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminTransactions;
