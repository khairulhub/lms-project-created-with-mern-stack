// client/src/pages/student/CourseLeaderboard.jsx
// একটা course-এর জন্য Quiz + Assignment leaderboard — overall এবং per-module।
// Student রা দেখতে পারবে কে কোথায় আছে; admin top performer চিনে reward দিতে পারবে।

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FiAward, FiArrowLeft, FiTrendingUp } from "react-icons/fi";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";

const TABS = [
  { id: "quiz_overall", label: "🧩 Overall Quiz" },
  { id: "asgn_overall", label: "📝 Overall Assignment" },
  { id: "quiz_module",  label: "🧩 Module-wise Quiz" },
  { id: "asgn_module",  label: "📝 Module-wise Assignment" },
];

const RankBadge = ({ rank }) => {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  return (
    <div style={{
      width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
      background: rank <= 3 ? "linear-gradient(135deg,#7c3aed,#06b6d4)" : "rgba(255,255,255,0.06)",
      color: "#fff", fontWeight: 800, fontSize: medal ? 16 : 13, flexShrink: 0,
    }}>
      {medal || rank}
    </div>
  );
};

const LeaderRow = ({ row, isMe, scoreLabel, scoreValue }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
    borderRadius: 12, marginBottom: 8,
    background: isMe ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.02)",
    border: isMe ? "1px solid rgba(124,58,237,0.35)" : "1px solid rgba(255,255,255,0.05)",
  }}>
    <RankBadge rank={row.rank} />
    <img src={row.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.email}`}
      style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} alt="" />
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ color: "#fff", fontWeight: 600, fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {row.name} {isMe && <span style={{ color: "#a78bfa", fontSize: 11 }}>(তুমি)</span>}
      </p>
      <p style={{ color: "#6b7280", fontSize: 11 }}>{scoreLabel}</p>
    </div>
    <div style={{ textAlign: "right", flexShrink: 0 }}>
      <p style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>{scoreValue}</p>
    </div>
  </div>
);

const CourseLeaderboard = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [tab, setTab] = useState("quiz_overall");
  const [curriculum, setCurriculum] = useState([]);
  const [selectedModule, setSelectedModule] = useState(0);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseName, setCourseName] = useState("");

  useEffect(() => {
    api.get(`/courses/${courseId}`).then(r => setCourseName(r.data?.title || "")).catch(() => {});
    api.get(`/course-details/${courseId}`).then(r => setCurriculum(r.data?.curriculum || [])).catch(() => {});
  }, [courseId]);

  useEffect(() => {
    setLoading(true);
    let url = "";
    if (tab === "quiz_overall") url = `/leaderboard/quiz/${courseId}/overall`;
    else if (tab === "asgn_overall") url = `/leaderboard/assignment/${courseId}/overall`;
    else if (tab === "quiz_module" && curriculum[selectedModule]) url = `/leaderboard/quiz/${courseId}/section/${curriculum[selectedModule]._id}`;
    else if (tab === "asgn_module") url = `/leaderboard/assignment/${courseId}/module/${selectedModule}`;

    if (!url) { setData([]); setLoading(false); return; }

    api.get(url).then(r => setData(r.data || [])).catch(() => setData([])).finally(() => setLoading(false));
  }, [tab, courseId, selectedModule, curriculum]);

  const showModuleSelector = tab === "quiz_module" || tab === "asgn_module";
  const isQuizTab = tab.startsWith("quiz");

  return (
    <DashboardLayout>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link to={`/student/course/${courseId}`} style={{ color: "#9ca3af", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 10, textDecoration: "none" }}>
          <FiArrowLeft size={14} /> কোর্সে ফিরে যাও
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: "linear-gradient(135deg,#7c3aed,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FiAward size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ color: "#fff", fontWeight: 800, fontSize: 20 }}>Leaderboard</h1>
            <p style={{ color: "#6b7280", fontSize: 12 }}>{courseName}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSelectedModule(0); }}
            style={{
              padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
              background: tab === t.id ? "linear-gradient(90deg,#7c3aed,#06b6d4)" : "rgba(255,255,255,0.05)",
              border: tab === t.id ? "1px solid transparent" : "1px solid rgba(255,255,255,0.1)",
              color: tab === t.id ? "#fff" : "#9ca3af",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Module selector */}
      {showModuleSelector && curriculum.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <select
            value={selectedModule}
            onChange={e => setSelectedModule(Number(e.target.value))}
            style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10, padding: "8px 14px", color: "#fff", fontSize: 13, maxWidth: 360,
            }}>
            {curriculum.map((sec, i) => (
              <option key={sec._id || i} value={i} style={{ background: "#1a0533", color: "#fff" }}>
                Module {i + 1}: {sec.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* List */}
      <div style={{
        background: "linear-gradient(160deg,#110224,#0d011f)",
        border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: 20,
      }}>
        {loading ? (
          <div style={{ textAlign: "center", color: "#6b7280", padding: 40 }}>
            <div style={{ width: 28, height: 28, border: "3px solid #7c3aed", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : data.length === 0 ? (
          <div style={{ textAlign: "center", color: "#4b5563", padding: 40 }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>📊</p>
            এখনো কোনো ডেটা নেই
          </div>
        ) : (
          data.map(row => (
            <LeaderRow
              key={row.userId}
              row={row}
              isMe={String(row.userId) === String(user?._id)}
              scoreLabel={
                tab === "quiz_overall" ? `${row.modulesAttempted}টা module attempted · avg ${row.avgScore}%` :
                tab === "asgn_overall" ? `${row.modulesGraded}টা module graded · avg ${row.avgMark}` :
                tab === "quiz_module" ? `${row.attempts} attempt · ${row.passed ? "পাস ✓" : "ফেল"}` :
                `Status: ${row.status}`
              }
              scoreValue={
                tab === "quiz_overall" ? `${row.totalScore}` :
                tab === "asgn_overall" ? `${row.totalMark} / ${row.modulesGraded * 50}` :
                tab === "quiz_module" ? `${row.bestScore}%` :
                `${row.mark} / 50`
              }
            />
          ))
        )}
      </div>

      <p style={{ color: "#4b5563", fontSize: 11, marginTop: 14, textAlign: "center" }}>
        <FiTrendingUp size={11} style={{ display: "inline", marginRight: 4 }} />
        Quiz score = সব module-এর best score এর sum। Assignment score = admin দেওয়া mark এর sum।
      </p>
    </DashboardLayout>
  );
};

export default CourseLeaderboard;
