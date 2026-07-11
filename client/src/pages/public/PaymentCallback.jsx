// client/src/pages/public/PaymentCallback.jsx
// SSLCommerz payment শেষ করে এই পেজে redirect করে (?status=success|failed|cancelled).
// Backend ইতোমধ্যে validate করে enrollment auto-approve করে ফেলেছে (server-side),
// এই পেজ শুধু ফলাফল দেখায় আর dashboard-এ পাঠিয়ে দেয়।

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiCheckCircle, FiXCircle, FiAlertTriangle } from "react-icons/fi";
import PublicLayout from "../../components/layout/PublicLayout";

const STATUS_CONFIG = {
  success: {
    icon: <FiCheckCircle size={52} color="#22c55e" />,
    title: "Payment সফল হয়েছে! 🎉",
    desc: "তোমার এনরোলমেন্ট automatically approve হয়ে গেছে। এখনই কোর্স শুরু করতে পারো।",
    cta: "Dashboard এ যাও",
    ctaLink: "/student/dashboard",
  },
  failed: {
    icon: <FiXCircle size={52} color="#f87171" />,
    title: "Payment ব্যর্থ হয়েছে",
    desc: "তোমার পেমেন্ট সম্পন্ন হয়নি। আবার চেষ্টা করো, অথবা manual bKash/Nagad পদ্ধতিতে enroll করো।",
    cta: "আবার চেষ্টা করো",
    ctaLink: "/courses",
  },
  cancelled: {
    icon: <FiAlertTriangle size={52} color="#facc15" />,
    title: "Payment বাতিল করা হয়েছে",
    desc: "তুমি payment প্রক্রিয়া মাঝপথে বন্ধ করে দিয়েছো। কোনো টাকা কাটা হয়নি।",
    cta: "কোর্স পেজে ফিরে যাও",
    ctaLink: "/courses",
  },
};

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status") || "failed";
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.failed;

  return (
    <PublicLayout>
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4 py-12">
        <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
          <div className="mb-4 flex justify-center">{config.icon}</div>
          <h1 className="text-xl font-bold text-white mb-2">{config.title}</h1>
          <p className="text-gray-400 text-sm mb-8">{config.desc}</p>
          <Link to={config.ctaLink}
            className="inline-block bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-6 py-3 rounded-xl text-sm transition-colors">
            {config.cta}
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
};

export default PaymentCallback;
