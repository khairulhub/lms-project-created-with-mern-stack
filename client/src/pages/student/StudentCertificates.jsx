// client/src/pages/student/StudentCertificates.jsx
// Student এর সব earned certificate দেখায় এবং download করতে দেয়।
// প্রতিটা enrolled & completed course-এর জন্য eligibility চেক করে certificate card দেখায়।

import { useEffect, useState } from "react";
import { FiAward, FiDownload, FiCheckCircle, FiLock, FiExternalLink } from "react-icons/fi";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";

const CertificateCard = ({ enrollment }) => {
  const [eligibility, setEligibility] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const courseId = enrollment.course?._id || enrollment.course;
  const courseTitle = enrollment.course?.title || "Course";

  useEffect(() => {
    api.get(`/certificates/${courseId}/eligibility`)
      .then((res) => setEligibility(res.data))
      .catch(() => setEligibility({ eligible: false, reason: "error" }));
  }, [courseId]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/certificates/${courseId}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate-${eligibility?.certificateId || courseId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err?.response?.data?.message || "Download করতে সমস্যা হয়েছে।");
    } finally {
      setDownloading(false);
    }
  };

  const progress = eligibility
    ? Math.round(((eligibility.doneCount || 0) / (eligibility.totalLectures || 1)) * 100)
    : 0;

  const isEligible = eligibility?.eligible;
  const hasCert = !!eligibility?.certificateId;

  return (
    <div
      className="rounded-2xl border p-5 flex flex-col gap-4 transition-all hover:border-purple-500/40"
      style={{
        background: "linear-gradient(135deg, #0d011f, #110224)",
        borderColor: isEligible ? "rgba(124,58,237,0.35)" : "rgba(255,255,255,0.07)",
      }}
    >
      {/* Top — icon + course title */}
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: isEligible
              ? "linear-gradient(135deg,#7c3aed,#06b6d4)"
              : "rgba(255,255,255,0.05)",
          }}
        >
          <FiAward size={20} className={isEligible ? "text-white" : "text-gray-600"} />
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm leading-snug">{courseTitle}</p>
          {hasCert && (
            <p className="text-gray-500 text-xs mt-0.5 font-mono">{eligibility.certificateId}</p>
          )}
        </div>
      </div>

      {/* Progress bar (only if not yet eligible) */}
      {!isEligible && eligibility && eligibility.reason === "incomplete" && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>অগ্রগতি</span>
            <span>{eligibility.doneCount}/{eligibility.totalLectures} lecture</span>
          </div>
          <div className="w-full h-1.5 rounded-full" style={{ background: "#1f2937" }}>
            <div
              className="h-1.5 rounded-full transition-all duration-700"
              style={{
                background: "linear-gradient(90deg,#7c3aed,#06b6d4)",
                width: `${progress}%`,
              }}
            />
          </div>
          <p className="text-gray-600 text-xs mt-1.5">
            সম্পন্ন করলে সার্টিফিকেট পাবে
          </p>
        </div>
      )}

      {/* Status chip */}
      {eligibility && (
        <div className="flex items-center gap-1.5">
          {isEligible ? (
            <span className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
              <FiCheckCircle size={13} /> সার্টিফিকেট অর্জিত
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <FiLock size={12} />
              {eligibility.reason === "incomplete"
                ? `${progress}% সম্পন্ন`
                : "কোর্স শেষ করো"}
            </span>
          )}
        </div>
      )}

      {/* Issue date */}
      {hasCert && eligibility?.issuedAt && (
        <p className="text-gray-600 text-xs -mt-2">
          ইস্যু: {new Date(eligibility.issuedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-auto pt-1">
        {isEligible ? (
          <>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-60"
              style={{
                background: "linear-gradient(90deg,#7c3aed,#06b6d4)",
                color: "#fff",
              }}
            >
              <FiDownload size={13} />
              {downloading ? "তৈরি হচ্ছে..." : "ডাউনলোড করো"}
            </button>
            {hasCert && (
              <Link
                to={`/verify-certificate/${eligibility.certificateId}`}
                target="_blank"
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white transition-colors"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <FiExternalLink size={12} /> Verify
              </Link>
            )}
          </>
        ) : (
          <Link
            to="/student/enrolled"
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            কোর্সে যাও →
          </Link>
        )}
      </div>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────
const StudentCertificates = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // approved enrollments — certificate শুধু approved student পাবে
    api.get("/enrollments/my")
      .then((res) => {
        const approved = (res.data || []).filter((e) => e.status === "approved");
        setEnrollments(approved);
      })
      .catch(() => setEnrollments([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)" }}
          >
            <FiAward size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">আমার সার্টিফিকেট</h1>
        </div>
        <p className="text-gray-400 text-sm ml-13 pl-0.5">
          কোর্স সম্পন্ন করলে সার্টিফিকেট ডাউনলোড করতে পারবে।
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/5 p-5 animate-pulse h-52"
              style={{ background: "#0d011f" }}
            >
              <div className="flex gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-gray-800" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 bg-gray-800 rounded w-3/4" />
                  <div className="h-2 bg-gray-800 rounded w-1/2" />
                </div>
              </div>
              <div className="h-1.5 bg-gray-800 rounded mt-4" />
              <div className="h-8 bg-gray-800 rounded-xl mt-6" />
            </div>
          ))}
        </div>
      ) : enrollments.length === 0 ? (
        <div
          className="rounded-2xl border border-white/5 p-16 text-center"
          style={{ background: "#0d011f" }}
        >
          <p className="text-5xl mb-4">🎓</p>
          <p className="text-white font-semibold mb-2">এখনো কোনো কোর্সে ভর্তি হওনি</p>
          <p className="text-gray-500 text-sm mb-6">কোর্সে ভর্তি হও এবং সম্পন্ন করলে সার্টিফিকেট পাবে।</p>
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: "linear-gradient(90deg,#7c3aed,#06b6d4)" }}
          >
            কোর্স দেখো
          </Link>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="flex items-center gap-4 mb-6">
            <div
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-300"
              style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)" }}
            >
              মোট কোর্স: <span className="text-white font-bold">{enrollments.length}</span>
            </div>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {enrollments.map((enrollment) => (
              <CertificateCard
                key={enrollment._id}
                enrollment={enrollment}
              />
            ))}
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default StudentCertificates;
