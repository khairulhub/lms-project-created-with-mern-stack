// client/src/pages/student/Analysis.jsx
// Student performance dashboard — সব enrolled course মিলিয়ে progress, quiz
// average, assignment average আর certificate সংখ্যা এক জায়গায় দেখায়।

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiTrendingUp, FiAward, FiCheckCircle, FiBookOpen } from "react-icons/fi";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";

const SummaryCard = ({ icon, label, value, sub, accent }) => (
  <div
    style={{
      background: "linear-gradient(160deg,#110224,#0d011f)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16,
      padding: "18px 20px",
      flex: "1 1 200px",
      minWidth: 180,
    }}
  >
    <div
      style={{
        width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
        background: `${accent}22`, color: accent, marginBottom: 12,
      }}
    >
      {icon}
    </div>
    <p style={{ color: "#fff", fontWeight: 800, fontSize: 24 }}>{value}</p>
    <p style={{ color: "#9ca3af", fontSize: 12.5, marginTop: 2 }}>{label}</p>
    {sub && <p style={{ color: "#4b5563", fontSize: 11, marginTop: 4 }}>{sub}</p>}
  </div>
);

const ProgressBar = ({ percent, color = "#7c3aed" }) => (
  <div style={{ width: "100%", height: 6, borderRadius: 999, background: "#1f2937" }}>
    <div
      style={{
        width: `${percent}%`, height: 6, borderRadius: 999,
        background: `linear-gradient(90deg,${color},#06b6d4)`, transition: "width 0.5s",
      }}
    />
  </div>
);

const Analysis = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/analysis/me")
      .then(({ data }) => setData(data))
      .catch(() => setData({ summary: {}, courses: [] }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Analysis</h1>
        <p className="text-gray-400 mb-6">তোমার সামগ্রিক performance আর progress</p>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ width: 30, height: 30, border: "3px solid #7c3aed", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : !data?.courses?.length ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 text-center">
            <p className="text-6xl mb-4">📈</p>
            <p className="text-white font-semibold mb-2">এখনো কোনো ডেটা নেই</p>
            <p className="text-gray-500 text-sm">কোনো কোর্সে enroll করে lecture দেখা, quiz দেওয়া শুরু করলে এখানে তোমার performance দেখতে পারবে।</p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 28 }}>
              <SummaryCard icon={<FiBookOpen size={16} />} accent="#06b6d4"
                label="Enrolled কোর্স" value={data.summary.totalEnrolled} />
              <SummaryCard icon={<FiTrendingUp size={16} />} accent="#7c3aed"
                label="গড় Progress" value={`${data.summary.avgProgress}%`} />
              <SummaryCard icon={<FiCheckCircle size={16} />} accent="#a855f7"
                label="গড় Quiz স্কোর" value={data.summary.avgQuizScore !== null ? `${data.summary.avgQuizScore}%` : "—"}
                sub={data.summary.avgQuizScore === null ? "এখনো কোনো quiz দেওয়া হয়নি" : undefined} />
              <SummaryCard icon={<FiAward size={16} />} accent="#f59e0b"
                label="অর্জিত Certificate" value={data.summary.totalCertificates} />
            </div>

            {/* Per-course breakdown */}
            <p className="text-white font-semibold text-sm mb-3">কোর্স অনুযায়ী বিস্তারিত</p>
            <div className="flex flex-col gap-3">
              {data.courses.map((c) => (
                <div key={c.courseId}
                  style={{
                    background: "linear-gradient(160deg,#110224,#0d011f)",
                    border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "16px 18px",
                  }}>
                  <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(124,58,237,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                        {c.emoji || "📘"}
                      </div>
                      <Link to={`/student/course/${c.courseId}`} style={{ color: "#fff", fontWeight: 700, fontSize: 13.5, textDecoration: "none" }}>
                        {c.title}
                      </Link>
                      {c.certificateEarned && (
                        <span style={{ fontSize: 11, color: "#fbbf24", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 999, padding: "2px 8px", flexShrink: 0 }}>
                          🏅 Certified
                        </span>
                      )}
                    </div>
                    <Link to={`/student/course/${c.courseId}/leaderboard`} style={{ color: "#9ca3af", fontSize: 11.5, textDecoration: "none", flexShrink: 0 }}>
                      Leaderboard দেখো →
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1" style={{ color: "#9ca3af" }}>
                        <span>Progress</span>
                        <span>{c.completedCount}/{c.totalLectures} · {c.progressPercent}%</span>
                      </div>
                      <ProgressBar percent={c.progressPercent} color="#7c3aed" />
                    </div>
                    <div>
                      <p style={{ color: "#9ca3af", fontSize: 11.5, marginBottom: 4 }}>Quiz average</p>
                      <p style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
                        {c.quizAvg !== null ? `${c.quizAvg}%` : "—"}
                        <span style={{ color: "#6b7280", fontSize: 11, fontWeight: 400, marginLeft: 6 }}>
                          {c.quizAttempted > 0 ? `(${c.quizAttempted}টা module)` : "attempted নেই"}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p style={{ color: "#9ca3af", fontSize: 11.5, marginBottom: 4 }}>Assignment average</p>
                      <p style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
                        {c.asgnAvg !== null ? `${c.asgnAvg} / 50` : "—"}
                        <span style={{ color: "#6b7280", fontSize: 11, fontWeight: 400, marginLeft: 6 }}>
                          {c.asgnGraded > 0 ? `(${c.asgnGraded}টা graded)` : "graded নেই"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Analysis;
