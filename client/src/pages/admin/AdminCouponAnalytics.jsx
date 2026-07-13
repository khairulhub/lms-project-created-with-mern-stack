// client/src/pages/admin/AdminCouponAnalytics.jsx
// প্রতিটা coupon কতবার ব্যবহার হলো (approved enrollment অনুযায়ী), কত discount
// দেওয়া হলো, আর কত revenue এসেছে সেই coupon দিয়ে — এক নজরে।

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiTag, FiTrendingUp, FiDollarSign, FiPercent } from "react-icons/fi";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";

const SummaryCard = ({ icon, label, value, accent }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex-1 min-w-[160px]">
    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: `${accent}22`, color: accent }}>
      {icon}
    </div>
    <p className="text-white font-bold text-xl">{value}</p>
    <p className="text-gray-500 text-xs mt-0.5">{label}</p>
  </div>
);

const AdminCouponAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/coupons-analytics")
      .then(({ data }) => setData(data))
      .catch(() => setData({ summary: {}, coupons: [] }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-white">Coupon Analytics</h1>
          <Link to="/admin/coupons" className="text-cyan-400 hover:text-cyan-300 text-sm">← Coupon manage করো</Link>
        </div>
        <p className="text-gray-400 mb-6">কোন coupon কতটা কার্যকর সেটা এক নজরে দেখো</p>

        {loading ? (
          <div className="text-center py-16">
            <div style={{ width: 30, height: 30, border: "3px solid #7c3aed", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <>
            <div className="flex gap-3 flex-wrap mb-6">
              <SummaryCard icon={<FiTag size={15} />} accent="#06b6d4" label="মোট Coupon" value={data.summary.totalCoupons} />
              <SummaryCard icon={<FiPercent size={15} />} accent="#a855f7" label="Active Coupon" value={data.summary.activeCoupons} />
              <SummaryCard icon={<FiTrendingUp size={15} />} accent="#22c55e" label="মোট ব্যবহার (approved)" value={data.summary.totalApprovedUses} />
              <SummaryCard icon={<FiDollarSign size={15} />} accent="#f59e0b" label="মোট Discount দেওয়া হয়েছে" value={`৳${(data.summary.totalDiscountGiven || 0).toLocaleString()}`} />
            </div>

            {data.coupons.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 text-center">
                <p className="text-6xl mb-4">🏷️</p>
                <p className="text-white font-semibold">এখনো কোনো coupon নেই</p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-gray-900 border border-gray-800 rounded-xl">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 text-xs border-b border-gray-800">
                      <th className="px-4 py-3 font-medium">Code</th>
                      <th className="px-4 py-3 font-medium">Discount</th>
                      <th className="px-4 py-3 font-medium">Used / Max</th>
                      <th className="px-4 py-3 font-medium">Approved Enrollments</th>
                      <th className="px-4 py-3 font-medium">Discount দেওয়া হয়েছে</th>
                      <th className="px-4 py-3 font-medium">Revenue এসেছে</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.coupons.map((c) => (
                      <tr key={c._id} className="border-b border-gray-800/60 last:border-0">
                        <td className="px-4 py-3 text-white text-xs font-bold">{c.code}</td>
                        <td className="px-4 py-3 text-gray-300 text-xs">
                          {c.discountType === "flat" ? `৳${c.discountValue}` : `${c.discountValue}%`}
                        </td>
                        <td className="px-4 py-3 text-gray-300 text-xs">{c.usedCount} / {c.maxUses ?? "∞"}</td>
                        <td className="px-4 py-3 text-cyan-400 text-xs font-bold">{c.approvedUses}</td>
                        <td className="px-4 py-3 text-amber-400 text-xs">৳{c.totalDiscountGiven.toLocaleString()}</td>
                        <td className="px-4 py-3 text-emerald-400 text-xs font-bold">৳{c.totalRevenue.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-[11px] font-semibold"
                            style={{ color: c.isActive ? "#4ade80" : "#9ca3af", background: c.isActive ? "rgba(34,197,94,0.12)" : "rgba(156,163,175,0.12)" }}>
                            {c.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminCouponAnalytics;
