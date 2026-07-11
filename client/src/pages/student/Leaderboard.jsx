// client/src/pages/student/Leaderboard.jsx
// সব enrolled course মিলিয়ে student এর নিজের rank + top 3 এর একটা overview।
// পুরো detailed leaderboard (module-wise) দেখতে CourseLeaderboard পেজে যেতে হবে —
// কারণ quiz/assignment score module-ভিত্তিক, তাই "true global" score তুলনা করা
// ঠিক না (একেক course এর module সংখ্যা আলাদা)। তাই per-course card approach।

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiAward, FiChevronRight } from "react-icons/fi";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";

const MiniRow = ({ row, isMe }) => (
  <div className="flex items-center gap-2.5" style={{ padding: "6px 0" }}>
    <div style={{
      width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
      background: row.rank <= 3 ? "linear-gradient(135deg,#7c3aed,#06b6d4)" : "rgba(255,255,255,0.06)",
      color: "#fff", fontWeight: 700, fontSize: 10.5, flexShrink: 0,
    }}>
      {row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : row.rank === 3 ? "🥉" : row.rank}
    </div>
    <p style={{ color: isMe ? "#a78bfa" : "#d1d5db", fontSize: 12.5, fontWeight: isMe ? 700 : 500, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
      {row.name} {isMe && "(তুমি)"}
    </p>
  </div>
);

const CourseLeaderboardCard = ({ enrollment, userId }) => {
  const course = enrollment.course;
  const [quizRows, setQuizRows] = useState(null);
  const [asgnRows, setAsgnRows] = useState(null);

  useEffect(() => {
    if (!course?._id) return;
    api.get(`/leaderboard/quiz/${course._id}/overall`).then((r) => setQuizRows(r.data || [])).catch(() => setQuizRows([]));
    api.get(`/leaderboard/assignment/${course._id}/overall`).then((r) => setAsgnRows(r.data || [])).catch(() => setAsgnRows([]));
  }, [course?._id]);

  const myQuizRow = quizRows?.find((r) => String(r.userId) === String(userId));
  const myAsgnRow = asgnRows?.find((r) => String(r.userId) === String(userId));

  return (
    <div style={{
      background: "linear-gradient(160deg,#110224,#0d011f)",
      border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "16px 18px",
    }}>
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <p style={{ color: "#fff", fontWeight: 700, fontSize: 13.5 }}>{course?.title || "কোর্স"}</p>
        <Link to={`/student/course/${course?._id}/leaderboard`}
          style={{ color: "#a78bfa", fontSize: 12, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}>
          পুরো leaderboard <FiChevronRight size={13} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <p style={{ color: "#9ca3af", fontSize: 11.5, marginBottom: 6 }}>
            🧩 Quiz — {myQuizRow ? `তোমার rank #${myQuizRow.rank}` : "attempt করোনি"}
          </p>
          {quizRows === null ? (
            <p style={{ color: "#4b5563", fontSize: 12 }}>লোড হচ্ছে...</p>
          ) : quizRows.length === 0 ? (
            <p style={{ color: "#4b5563", fontSize: 12 }}>এখনো ডেটা নেই</p>
          ) : (
            quizRows.slice(0, 3).map((r) => <MiniRow key={r.userId} row={r} isMe={String(r.userId) === String(userId)} />)
          )}
        </div>
        <div>
          <p style={{ color: "#9ca3af", fontSize: 11.5, marginBottom: 6 }}>
            📝 Assignment — {myAsgnRow ? `তোমার rank #${myAsgnRow.rank}` : "কিছু submit করোনি"}
          </p>
          {asgnRows === null ? (
            <p style={{ color: "#4b5563", fontSize: 12 }}>লোড হচ্ছে...</p>
          ) : asgnRows.length === 0 ? (
            <p style={{ color: "#4b5563", fontSize: 12 }}>এখনো ডেটা নেই</p>
          ) : (
            asgnRows.slice(0, 3).map((r) => <MiniRow key={r.userId} row={r} isMe={String(r.userId) === String(userId)} />)
          )}
        </div>
      </div>
    </div>
  );
};

const Leaderboard = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/enrollments/my")
      .then(({ data }) => setEnrollments((data || []).filter((e) => e.status === "approved" && e.course)))
      .catch(() => setEnrollments([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Leaderboard</h1>
        <p className="text-gray-400 mb-6">প্রতিটা enrolled কোর্সে তুমি কোথায় দাঁড়িয়ে আছো</p>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ width: 30, height: 30, border: "3px solid #7c3aed", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : enrollments.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 text-center">
            <p className="text-6xl mb-4">🏆</p>
            <p className="text-white font-semibold mb-2">এখনো কোনো কোর্সে enroll নেই</p>
            <p className="text-gray-500 text-sm">কোনো কোর্সে ভর্তি হয়ে quiz/assignment দিলে এখানে rank দেখতে পারবে।</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {enrollments.map((e) => (
              <CourseLeaderboardCard key={e._id} enrollment={e} userId={user?._id} />
            ))}
          </div>
        )}

        <p style={{ color: "#4b5563", fontSize: 11, marginTop: 16, textAlign: "center" }}>
          <FiAward size={11} style={{ display: "inline", marginRight: 4 }} />
          Rank প্রতিটা কোর্সের জন্য আলাদাভাবে হিসাব হয় — কারণ ভিন্ন কোর্সের module সংখ্যা ভিন্ন।
        </p>
      </div>
    </DashboardLayout>
  );
};

export default Leaderboard;
