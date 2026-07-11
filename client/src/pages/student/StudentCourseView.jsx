// client/src/pages/student/StudentCourseView.jsx
// Programming Hero–style enrolled course viewer.
// Left: video player. Right: scrollable module/lecture list.
// Lectures play one by one; finishing one auto-advances to the next.

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";

// ── helpers ──────────────────────────────────────────────────────────────
const isYouTube = (url = "") =>
  url.includes("youtube.com") || url.includes("youtu.be");

const toEmbedUrl = (url = "") => {
  if (!url) return "";
  // already an embed URL
  if (url.includes("youtube.com/embed")) return url;
  // youtu.be/<id>
  const short = url.match(/youtu\.be\/([^?&]+)/);
  if (short) return `https://www.youtube.com/embed/${short[1]}`;
  // ?v=<id>
  const long = url.match(/[?&]v=([^&]+)/);
  if (long) return `https://www.youtube.com/embed/${long[1]}`;
  return url; // return as-is (mp4, etc.)
};

const toSeconds = (d = "") => {
  if (!d) return 0;
  const parts = d.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return (parts[0] || 0) * 60 + (parts[1] || 0);
};

const formatTotal = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// flatten curriculum into a single lecture array with section info
const flattenCurriculum = (curriculum = []) => {
  const flat = [];
  curriculum.forEach((section, si) => {
    (section.lectures || []).forEach((lec, li) => {
      flat.push({ ...lec, sectionIndex: si, lectureIndex: li, globalIndex: flat.length });
    });
  });
  return flat;
};

// ── Chevron icons (inline, no lucide dependency) ─────────────────────────
const ChevDown = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={className}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const ChevRight = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={className}>
    <polyline points="9 6 15 12 9 18" />
  </svg>
);
const PlayIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);
const CheckIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const ArrowLeft = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);
const MessageSquare = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

// ── Video Player ──────────────────────────────────────────────────────────
const VideoPlayer = ({ lecture, onEnded }) => {
  const videoRef = useRef(null);
  const url = lecture?.videoUrl || "";
  const embedUrl = toEmbedUrl(url);
  const youtube = isYouTube(url);

  // For mp4 videos, attach ended event
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const handler = () => onEnded?.();
    el.addEventListener("ended", handler);
    return () => el.removeEventListener("ended", handler);
  }, [onEnded, lecture]);

  if (!url) {
    return (
      <div className="w-full aspect-video flex flex-col items-center justify-center gap-3"
        style={{ background: "#0d011f" }}>
        <span className="text-5xl opacity-30">🎥</span>
        <p className="text-gray-500 text-sm">এই lecture-এর ভিডিও এখনো যোগ করা হয়নি।</p>
      </div>
    );
  }

  if (youtube) {
    return (
      <div className="w-full aspect-video">
        <iframe
          key={embedUrl}
          src={`${embedUrl}?autoplay=1&rel=0`}
          className="w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title={lecture?.title || "Video"}
        />
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      key={url}
      src={url}
      controls
      autoPlay
      className="w-full aspect-video bg-black"
      style={{ maxHeight: "70vh" }}
    />
  );
};

// ── LectureTabs: Copyright Warning · Conceptual Session · Notes ──────────
// ছবির মতো: video এর নিচে ৩টা tab — Copyright Warning (লাল dot), Conceptual Session, Notes
const LectureTabs = ({ activeLecture, isLectureDone, onMarkComplete }) => {
  const [activeTab, setActiveTab] = useState("notes");

  // Tab সুইচ হলে রিসেট করো না, শুধু active tab পরিবর্তন করো
  const tabs = [
    { key: "copyright", label: "Copyright Warning", dot: true },
    { key: "conceptual", label: "Conceptual Session" },
    { key: "notes", label: "Notes" },
  ];

  return (
    <div className="flex flex-col" style={{ background: "#0a0118", minHeight: "220px" }}>
      {/* Tab bar */}
      <div
        className="flex items-center gap-0 border-b px-4"
        style={{ borderColor: "#1a0533" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors border-b-2 -mb-[1px]"
            style={{
              borderBottomColor:
                activeTab === tab.key ? "#7c3aed" : "transparent",
              color:
                activeTab === tab.key
                  ? "#e9d5ff"
                  : "#6b7280",
            }}
          >
            {tab.dot && (
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: "#ef4444" }}
              />
            )}
            {tab.label}
          </button>
        ))}

        {/* Mark complete — tab bar এর ডান পাশে */}
        <div className="ml-auto">
          <button
            onClick={onMarkComplete}
            disabled={isLectureDone}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-60"
            style={{
              background: isLectureDone
                ? "rgba(34,197,94,0.15)"
                : "rgba(124,58,237,0.2)",
              border: isLectureDone
                ? "1px solid rgba(34,197,94,0.4)"
                : "1px solid rgba(124,58,237,0.4)",
              color: isLectureDone ? "#4ade80" : "#c084fc",
            }}
          >
            <CheckIcon size={11} />
            {isLectureDone ? "সম্পন্ন ✓" : "সম্পন্ন করো"}
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div
        className="px-5 py-5"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#3b0764 #0a0118" }}
      >
        {activeTab === "copyright" && (
          <div className="space-y-4">
            <div
              className="flex items-start gap-3 p-4 rounded-xl"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
              }}
            >
              <span className="text-red-400 text-lg shrink-0 mt-0.5">⚠️</span>
              <div>
                <p className="text-red-400 font-semibold text-sm mb-2">
                  Copyright Warning
                </p>
                <p className="text-gray-300 text-sm leading-relaxed">
                  এই কোর্সের সমস্ত কন্টেন্ট — ভিডিও, নোট, কোড — সম্পূর্ণ কপিরাইটযুক্ত।
                  অনুমতি ছাড়া রেকর্ড করা, শেয়ার করা বা পুনরায় বিতরণ করা সম্পূর্ণ
                  নিষিদ্ধ এবং আইনগতভাবে দণ্ডনীয়।
                </p>
              </div>
            </div>
            <div
              className="p-4 rounded-xl text-sm text-gray-400 leading-relaxed"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p className="font-semibold text-gray-300 mb-2">মনে রেখো:</p>
              <ul className="space-y-1.5 list-disc list-inside">
                <li>Screen recording করা নিষিদ্ধ</li>
                <li>Social media তে video share করা যাবে না</li>
                <li>Third-party platform এ upload করা সম্পূর্ণ নিষিদ্ধ</li>
                <li>Paid course content বিক্রি করা আইনগত অপরাধ</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === "conceptual" && (
          <div className="space-y-4">
            <div
              className="flex items-center gap-2 p-3 rounded-xl mb-2"
              style={{
                background: "rgba(124,58,237,0.1)",
                border: "1px solid rgba(124,58,237,0.25)",
              }}
            >
              <span className="text-purple-400">🎯</span>
              <p className="text-purple-300 text-xs font-semibold">
                এই lecture এর Conceptual Session
              </p>
            </div>

            {activeLecture?.conceptualSession ? (
              <div
                className="p-4 rounded-xl text-sm text-gray-300 leading-relaxed whitespace-pre-wrap"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {activeLecture.conceptualSession}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-3xl mb-3">📚</p>
                <p className="text-gray-500 text-sm">
                  এই lecture এর conceptual session এখনো যোগ করা হয়নি।
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "notes" && (
          <div className="space-y-4">
            <div
              className="flex items-center gap-2 p-3 rounded-xl mb-2"
              style={{
                background: "rgba(6,182,212,0.08)",
                border: "1px solid rgba(6,182,212,0.2)",
              }}
            >
              <span className="text-cyan-400">📝</span>
              <p className="text-cyan-300 text-xs font-semibold">
                Lecture Notes
              </p>
            </div>

            {activeLecture?.notes ? (
              <div
                className="p-4 rounded-xl text-sm text-gray-300 leading-relaxed whitespace-pre-wrap"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
                dangerouslySetInnerHTML={{ __html: activeLecture.notes }}
              />
            ) : (
              <div className="text-center py-10">
                <p className="text-3xl mb-3">📄</p>
                <p className="text-gray-500 text-sm">
                  এই lecture এর notes এখনো যোগ করা হয়নি।
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Sidebar: module list with quiz + assignment indicators ────────────────
const Sidebar = ({ courseId, curriculum, flatLectures, activeLecture, onSelect, completed, quizAttempts, quizExists, asgnExists, activePanel, onOpenQuiz, onOpenAssignment, bookmarked, onToggleBookmark }) => {
  const [openSections, setOpenSections] = useState(() =>
    curriculum.reduce((acc, _, i) => ({ ...acc, [i]: i === 0 }), {})
  );
  const toggle = (i) => setOpenSections((prev) => ({ ...prev, [i]: !prev[i] }));
  const totalLectures = flatLectures.length;
  const totalSeconds = flatLectures.reduce((s, l) => s + toSeconds(l.duration), 0);
  const doneCount = completed.size;

  return (
    <div className="flex flex-col h-full" style={{ background: "#0d011f" }}>
      {/* Header */}
      <div className="shrink-0 px-4 py-4 border-b" style={{ borderColor: "#1a0533" }}>
        <div className="flex items-center justify-between mb-1">
          <p className="text-white font-bold text-sm">কোর্স কন্টেন্ট</p>
          <Link to={`/student/course/${courseId}/leaderboard`}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
            style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#a78bfa" }}>
            🏆 Leaderboard
          </Link>
        </div>
        <p className="text-gray-500 text-xs">
          {curriculum.length} Module · {totalLectures} Lecture · {formatTotal(totalSeconds)}
        </p>
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{doneCount}/{totalLectures} সম্পন্ন</span>
            <span>{totalLectures > 0 ? Math.round((doneCount / totalLectures) * 100) : 0}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full" style={{ background: "#1f2937" }}>
            <div className="h-1.5 rounded-full transition-all duration-500"
              style={{ background: "linear-gradient(90deg,#7c3aed,#06b6d4)", width: `${totalLectures > 0 ? (doneCount / totalLectures) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#3b0764 #0d011f" }}>
        {curriculum.map((section, si) => {
          const sectionLectures = flatLectures.filter((l) => l.sectionIndex === si);
          const sectionSeconds = sectionLectures.reduce((s, l) => s + toSeconds(l.duration), 0);
          const isOpen = openSections[si];
          // section lectures সব done হলে quiz দেখানো হবে
          const sectionDone = sectionLectures.length > 0 && sectionLectures.every(l => completed.has(String(l._id)));
          const quizMeta = quizExists[String(section._id)] || null; // null = quiz নেই অথবা inactive
          const quizPassed = quizAttempts[String(section._id)]?.passed;
          const quizTaken = !!quizAttempts[String(section._id)];
          const asgnMeta = asgnExists[si] || null; // null = assignment নেই অথবা inactive
          // quiz না থাকলে module complete-এর শর্ত হিসেবে sectionDone-ই যথেষ্ট ধরা হবে
          const quizGateOk = quizMeta ? quizPassed : sectionDone;
          const isQuizActive = activePanel?.type === "quiz" && activePanel?.si === si;
          const isAsgnActive = activePanel?.type === "assignment" && activePanel?.si === si;

          return (
            <div key={si} className="border-b" style={{ borderColor: "#1a0533" }}>
              {/* Module header */}
              <button onClick={() => toggle(si)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="shrink-0 text-purple-400">
                    {isOpen ? <ChevDown size={14} /> : <ChevRight size={14} />}
                  </span>
                  <span className="text-white font-semibold text-xs leading-snug">
                    {si + 1}. {section.title}
                  </span>
                </div>
                <span className="text-gray-600 text-xs whitespace-nowrap shrink-0">
                  {sectionLectures.length} · {formatTotal(sectionSeconds)}
                </span>
              </button>

              {isOpen && (
                <div>
                  {/* Lectures */}
                  {sectionLectures.map((lec) => {
                    const isActive = activeLecture?.globalIndex === lec.globalIndex;
                    const isDone = completed.has(String(lec._id));
                    return (
                      <button key={lec.globalIndex} onClick={() => onSelect(lec)}
                        className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
                        style={{
                          background: isActive ? "linear-gradient(90deg,rgba(124,58,237,0.25),rgba(6,182,212,0.08))" : "transparent",
                          borderLeft: isActive ? "3px solid #7c3aed" : "3px solid transparent",
                        }}>
                        <div className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                          style={{
                            background: isDone ? "rgba(34,197,94,0.2)" : isActive ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.05)",
                            border: isDone ? "1px solid rgba(34,197,94,0.5)" : isActive ? "1px solid rgba(124,58,237,0.6)" : "1px solid rgba(255,255,255,0.1)",
                          }}>
                          {isDone ? <CheckIcon size={11} /> : <PlayIcon size={9} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs leading-snug" style={{ color: isActive ? "#e9d5ff" : isDone ? "#9ca3af" : "#d1d5db" }}>
                            {lec.title}
                          </p>
                          {lec.duration && <p className="text-gray-600 text-xs mt-0.5">{lec.duration}</p>}
                        </div>
                        {onToggleBookmark && (
                          <span
                            role="button"
                            title={bookmarked?.has(String(lec._id)) ? "Bookmark সরাও" : "পরে দেখার জন্য Bookmark করো"}
                            onClick={(e) => { e.stopPropagation(); onToggleBookmark(lec, section._id); }}
                            className="shrink-0 mt-0.5 px-1"
                            style={{ color: bookmarked?.has(String(lec._id)) ? "#facc15" : "#4b5563", cursor: "pointer" }}
                          >
                            {bookmarked?.has(String(lec._id)) ? "★" : "☆"}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {/* Quiz row — admin quiz active রাখলেই দেখাবে */}
                  {quizMeta && (
                    <button onClick={() => sectionDone && onOpenQuiz(si, section._id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                      style={{
                        borderLeft: isQuizActive ? "3px solid #a855f7" : "3px solid transparent",
                        background: isQuizActive ? "rgba(168,85,247,0.12)" : sectionDone ? "rgba(168,85,247,0.05)" : "transparent",
                        opacity: sectionDone ? 1 : 0.4,
                        cursor: sectionDone ? "pointer" : "default",
                      }}>
                      <div className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-xs"
                        style={{ background: quizPassed ? "rgba(34,197,94,0.2)" : "rgba(168,85,247,0.15)", border: `1px solid ${quizPassed ? "rgba(34,197,94,0.4)" : "rgba(168,85,247,0.3)"}` }}>
                        {quizPassed ? "✓" : "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-snug" style={{ color: quizPassed ? "#86efac" : isQuizActive ? "#e9d5ff" : "#c4b5fd" }}>
                          🧩 {quizMeta.title || "Section Quiz"}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
                          {!sectionDone ? "সব lecture শেষ করো" : quizPassed ? "পাস ✓" : quizTaken ? "আবার দাও" : "Quiz দাও"}
                        </p>
                      </div>
                    </button>
                  )}

                  {/* Assignment row — admin assignment active রাখলেই দেখাবে */}
                  {asgnMeta && (
                    <button onClick={() => quizGateOk && onOpenAssignment(si)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                      style={{
                        borderLeft: isAsgnActive ? "3px solid #f59e0b" : "3px solid transparent",
                        background: isAsgnActive ? "rgba(245,158,11,0.1)" : quizGateOk ? "rgba(245,158,11,0.05)" : "transparent",
                        opacity: quizGateOk ? 1 : 0.35,
                        cursor: quizGateOk ? "pointer" : "default",
                        borderBottom: "none",
                      }}>
                      <div className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-xs"
                        style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}>
                        📝
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-snug" style={{ color: isAsgnActive ? "#fde68a" : "#fbbf24" }}>
                          {asgnMeta.title || "Module Assignment"}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
                          {!quizGateOk ? (quizMeta ? "Quiz পাস করো আগে" : "সব lecture শেষ করো") : "Submit করো"}
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════
const StudentCourseView = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [course, setCourse] = useState(null);
  const [detail, setDetail] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeLecture, setActiveLecture] = useState(null);
  const [completed, setCompleted] = useState(new Set());
  const [progressLoaded, setProgressLoaded] = useState(false);
  const lastWatchedRef = useRef(null);
  const jumpToLectureRef = useRef(searchParams.get("lecture") || null);
  const [bookmarked, setBookmarked] = useState(new Set()); // lectureId (string) → bookmarked

  // Quiz + Assignment state
  const [quizAttempts, setQuizAttempts] = useState({}); // sectionId → last attempt
  const [quizExists, setQuizExists] = useState({});     // sectionId → quiz meta (only if active)
  const [asgnExists, setAsgnExists] = useState({});      // moduleIndex → assignment meta (only if active)
  const [activePanel, setActivePanel] = useState(null); // { type:"quiz"|"assignment", si, sectionId? }
  const [quizData, setQuizData] = useState(null);       // current quiz being shown
  const [quizAnswers, setQuizAnswers] = useState({});   // questionId → selectedOptionId
  const [quizResult, setQuizResult] = useState(null);   // result after submit
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [asgnData, setAsgnData] = useState(null);       // current assignment
  const [asgnText, setAsgnText] = useState("");
  const [asgnFile, setAsgnFile] = useState("");
  const [asgnSubmitting, setAsgnSubmitting] = useState(false);

  // Load course + detail + check enrollment + progress
  useEffect(() => {
    if (!courseId) return;

    const fetchAll = async () => {
      try {
        setLoading(true);

        // 1. Check enrollment status
        const enrollRes = await api.get(`/enrollments/check/${courseId}`);
        if (enrollRes.data.status !== "approved") {
          setError("তুমি এই কোর্সে enrolled নেই অথবা এখনো approve হয়নি।");
          setLoading(false);
          return;
        }
        setEnrollment(enrollRes.data);

        // 2. Load course basic info + curriculum + saved progress (parallel)
        const [courseRes, detailRes, progressRes, attemptsRes, quizListRes, asgnListRes, bookmarksRes] = await Promise.allSettled([
          api.get(`/courses/${courseId}`),
          api.get(`/course-details/${courseId}`),
          api.get(`/progress/${courseId}`),
          api.get(`/quizzes/${courseId}/my-attempts`),
          api.get(`/quizzes/${courseId}/list`),
          api.get(`/assignments/${courseId}`),
          api.get(`/bookmarks/course/${courseId}`),
        ]);

        if (courseRes.status === "fulfilled") setCourse(courseRes.value.data);
        if (detailRes.status === "fulfilled") setDetail(detailRes.value.data);

        // 3. Restore completed lectures + last-watched lecture (refresh/device-safe)
        if (progressRes.status === "fulfilled") {
          const { completedLectures = [], lastWatchedLecture = null } = progressRes.value.data || {};
          setCompleted(new Set(completedLectures.map(String)));
          lastWatchedRef.current = lastWatchedLecture ? String(lastWatchedLecture) : null;
        }
        // 4. Load quiz attempts map: sectionId → last attempt
        if (attemptsRes.status === "fulfilled") {
          const map = {};
          (attemptsRes.value.data || []).forEach(a => { map[String(a.sectionId)] = a; });
          setQuizAttempts(map);
        }
        // 5. Load active quiz existence — sidebar এ inactive/missing quiz hide করার জন্য
        if (quizListRes.status === "fulfilled") {
          const map = {};
          (quizListRes.value.data || []).forEach(q => { map[String(q.sectionId)] = q; });
          setQuizExists(map);
        }
        // 6. Load active assignment existence — moduleIndex → assignment
        if (asgnListRes.status === "fulfilled") {
          const map = {};
          (asgnListRes.value.data || []).forEach(a => { map[a.moduleIndex] = a; });
          setAsgnExists(map);
        }
        // 7. Load this course-এর bookmarked lecture id গুলো (Bookmark page থেকে জাম্প/স্টার state)
        if (bookmarksRes.status === "fulfilled") {
          setBookmarked(new Set((bookmarksRes.value.data || []).map(String)));
        }
        setProgressLoaded(true);

      } catch (err) {
        if (err.response?.status === 401) navigate("/login");
        else setError("কোর্স লোড করতে সমস্যা হয়েছে।");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [courseId, navigate]);

  // Build curriculum from detail data
  const curriculum = detail?.curriculum?.length
    ? detail.curriculum.map((s) => ({
        _id: s._id,
        title: s.title,
        lectures: (s.lectures || []).map((l) => ({
          _id: l._id,
          title: l.title,
          duration: l.duration,
          videoUrl: l.videoUrl || "",
        })),
      }))
    : [];

  const flatLectures = flattenCurriculum(curriculum);

  // প্রথমবার curriculum লোড হলে: last-watched lecture থাকলে সেখান থেকে resume
  // করো (refresh/device change এর পরও), না থাকলে প্রথম lecture select করো।
  useEffect(() => {
    if (flatLectures.length > 0 && !activeLecture && progressLoaded) {
      // Bookmark page থেকে ?lecture=<id> দিয়ে এলে সেটাই প্রথমে দেখাও, না হলে
      // last-watched থেকে resume, না হলে প্রথম lecture
      const jumpTo = jumpToLectureRef.current
        ? flatLectures.find((l) => String(l._id) === jumpToLectureRef.current)
        : null;
      jumpToLectureRef.current = null;
      const resumeAt = !jumpTo && lastWatchedRef.current
        ? flatLectures.find((l) => String(l._id) === lastWatchedRef.current)
        : null;
      setActiveLecture(jumpTo || resumeAt || flatLectures[0]);
    }
  }, [flatLectures.length, progressLoaded]);

  const selectLecture = useCallback((lec) => {
    setActiveLecture(lec);
    // scroll to top on mobile
    window.scrollTo({ top: 0, behavior: "smooth" });

    // "এখন কোন lecture দেখছি" সেটা backend-এ সেভ করো — refresh বা অন্য
    // device থেকে এলেও এই lecture থেকেই resume করতে পারবে।
    if (lec?._id) {
      api.put(`/progress/${courseId}/last-watched`, { lectureId: lec._id }).catch(() => {});
    }
  }, [courseId]);

  const [downloadingCert, setDownloadingCert] = useState(false);

  // Certificate PDF download — blob হিসেবে ফেচ করে browser-এ download
  // trigger করে। responseType "blob" দরকার, কারণ `api`-এর default axios
  // instance JSON parse করার চেষ্টা করবে অন্যথায় এবং PDF bytes ভেঙে যাবে।
  const downloadCertificate = useCallback(async () => {
    if (!courseId) return;
    setDownloadingCert(true);
    try {
      const res = await api.get(`/certificates/${courseId}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `certificate-${courseId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      // err.response.data ব্লব হয়ে আসবে (responseType blob বলায়), তাই error
      // message বের করার জন্য সেটাকে আগে টেক্সট-এ পার্স করতে হবে
      let message = "Certificate ডাউনলোড করতে সমস্যা হয়েছে।";
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          message = JSON.parse(text)?.message || message;
        } catch {}
      }
      toast.error(message);
    } finally {
      setDownloadingCert(false);
    }
  }, [courseId]);

  // ── Bookmark (save for later) toggle — optimistic UI update ──────────────
  const toggleLectureBookmark = useCallback((lec, sectionId) => {
    if (!lec?._id) return;
    const key = String(lec._id);
    const willBookmark = !bookmarked.has(key);

    setBookmarked((prev) => {
      const next = new Set(prev);
      if (willBookmark) next.add(key); else next.delete(key);
      return next;
    });

    api.post("/bookmarks/toggle", {
      courseId,
      sectionId,
      lectureId: lec._id,
      courseTitle: course?.title || "",
      lectureTitle: lec.title || "",
    }).catch(() => {
      // fail হলে UI state আগের মতো ফিরিয়ে দাও
      setBookmarked((prev) => {
        const next = new Set(prev);
        if (willBookmark) next.delete(key); else next.add(key);
        return next;
      });
      toast.error("Bookmark করতে সমস্যা হয়েছে।");
    });
  }, [bookmarked, courseId, course]);

  const markCompleted = useCallback((lec) => {
    if (!lec?._id) return;
    const key = String(lec._id);
    setCompleted((prev) => {
      if (prev.has(key)) return prev;
      return new Set([...prev, key]);
    });
    api.put(`/progress/${courseId}/lecture/${lec._id}`, { completed: true }).catch(() => {});
  }, [courseId]);

  // ── Quiz handlers ────────────────────────────────────────────────────────
  const openQuiz = useCallback(async (si, sectionId) => {
    setActivePanel({ type: "quiz", si, sectionId });
    setQuizResult(null);
    setQuizAnswers({});
    setQuizData(null);
    try {
      const { data } = await api.get(`/quizzes/${courseId}/section/${sectionId}`);
      setQuizData(data);
      // prefill previous attempt answers if any
    } catch (err) {
      if (err.response?.status === 404) {
        setQuizData({ quiz: null, lastAttempt: null });
      } else toast.error("Quiz লোড করতে সমস্যা");
    }
  }, [courseId]);

  const submitQuiz = useCallback(async () => {
    if (!quizData?.quiz) return;
    const answers = Object.entries(quizAnswers).map(([questionId, selectedOptionId]) => ({ questionId, selectedOptionId }));
    if (answers.length < quizData.quiz.questions.length) {
      return toast.error("সব প্রশ্নের উত্তর দাও");
    }
    setQuizSubmitting(true);
    try {
      const { data } = await api.post(`/quizzes/${courseId}/section/${activePanel.sectionId}/submit`, { answers });
      setQuizResult(data);
      // update attempts map
      setQuizAttempts(prev => ({
        ...prev,
        [String(activePanel.sectionId)]: { sectionId: activePanel.sectionId, score: data.score, passed: data.passed },
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Submit failed");
    } finally { setQuizSubmitting(false); }
  }, [courseId, quizData, quizAnswers, activePanel]);

  // ── Assignment handlers ──────────────────────────────────────────────────
  const openAssignment = useCallback(async (si) => {
    setActivePanel({ type: "assignment", si });
    setAsgnData(null);
    setAsgnText("");
    setAsgnFile("");
    try {
      const { data } = await api.get(`/assignments/${courseId}`);
      const asgn = data.find(a => a.moduleIndex === si);
      setAsgnData(asgn || null);
      if (asgn?.mySubmission) {
        setAsgnText(asgn.mySubmission.answerText || "");
        setAsgnFile(asgn.mySubmission.fileUrl || "");
      }
    } catch { toast.error("Assignment লোড করতে সমস্যা"); }
  }, [courseId]);

  const submitAssignment = useCallback(async () => {
    if (!asgnData) return;
    if (!asgnText.trim() && !asgnFile.trim()) return toast.error("উত্তর বা file URL দাও");
    setAsgnSubmitting(true);
    try {
      await api.post(`/assignments/${courseId}/submit`, { moduleIndex: activePanel.si, answerText: asgnText, fileUrl: asgnFile });
      toast.success("Assignment submitted! 🎉");
      openAssignment(activePanel.si); // reload to show status
    } catch (err) {
      toast.error(err.response?.data?.message || "Submit failed");
    } finally { setAsgnSubmitting(false); }
  }, [courseId, asgnData, asgnText, asgnFile, activePanel]);

  const handleVideoEnded = useCallback(() => {
    if (!activeLecture) return;
    markCompleted(activeLecture);

    // Auto-advance to next lecture
    const next = flatLectures.find((l) => l.globalIndex === activeLecture.globalIndex + 1);
    if (next) {
      setTimeout(() => selectLecture(next), 800);
    }
  }, [activeLecture, flatLectures, markCompleted, selectLecture]);

  const goNext = () => {
    if (!activeLecture) return;
    markCompleted(activeLecture);
    const next = flatLectures.find((l) => l.globalIndex === activeLecture.globalIndex + 1);
    if (next) selectLecture(next);
  };

  const goPrev = () => {
    if (!activeLecture) return;
    const prev = flatLectures.find((l) => l.globalIndex === activeLecture.globalIndex - 1);
    if (prev) selectLecture(prev);
  };

  // ── Loading ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
            <p className="text-gray-400 text-sm">কোর্স লোড হচ্ছে...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Error / Not enrolled ──────────────────────────────────────────────
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <p className="text-5xl mb-4">🔒</p>
          <h2 className="text-white font-bold text-xl mb-2">অ্যাক্সেস নেই</h2>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <Link
            to="/student/enrolled"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: "linear-gradient(90deg,#7c3aed,#db2777)" }}
          >
            আমার কোর্স দেখো
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // ── No curriculum ─────────────────────────────────────────────────────
  if (curriculum.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <p className="text-5xl mb-4">📭</p>
          <h2 className="text-white font-bold text-xl mb-2">কন্টেন্ট আসছে শীঘ্রই</h2>
          <p className="text-gray-400 text-sm mb-6">
            এই কোর্সের ভিডিও কন্টেন্ট এখনো যোগ করা হয়নি। একটু অপেক্ষা করো।
          </p>
          <Link
            to="/student/enrolled"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: "linear-gradient(90deg,#7c3aed,#06b6d4)" }}
          >
            <ArrowLeft size={14} /> ফিরে যাও
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const hasPrev = activeLecture?.globalIndex > 0;
  const hasNext = activeLecture?.globalIndex < flatLectures.length - 1;
  const isLectureDone = activeLecture ? completed.has(String(activeLecture._id)) : false;

  return (
    <DashboardLayout hidePadding>
      {/* ── Top bar ───────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between gap-4 px-4 py-3 border-b shrink-0"
        style={{ background: "#0a0118", borderColor: "#1a0533" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/student/enrolled"
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs transition-colors shrink-0"
          >
            <ArrowLeft size={14} /> ফিরে যাও
          </Link>
          <span className="text-gray-700 hidden sm:block">|</span>
          <p className="text-white font-semibold text-sm truncate hidden sm:block">
            {course?.title || "কোর্স"}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to={`/student/course/${courseId}/chat`}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: "rgba(6,182,212,0.12)", color: "#22d3ee" }}
          >
            <MessageSquare size={13} /> <span className="hidden sm:inline">Instructor কে মেসেজ</span>
          </Link>
          <span className="text-gray-500 text-xs hidden sm:block">
            {completed.size}/{flatLectures.length} সম্পন্ন
          </span>
          <div className="w-24 h-1.5 rounded-full hidden sm:block" style={{ background: "#1f2937" }}>
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                background: "linear-gradient(90deg,#7c3aed,#06b6d4)",
                width: `${flatLectures.length > 0 ? (completed.size / flatLectures.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Main layout: video/quiz/assignment + sidebar ────────────── */}
      <div className="flex flex-col lg:flex-row" style={{ minHeight: "calc(100vh - 120px)" }}>

        {/* LEFT — video OR quiz OR assignment panel */}
        <div className="flex-1 flex flex-col" style={{ background: "#0a0118" }}>

          {/* ── Quiz Panel ─────────────────────────────────────────────── */}
          {activePanel?.type === "quiz" && (
            <div className="flex-1 overflow-y-auto p-6" style={{ maxWidth: 700 }}>
              {!quizData ? (
                <div className="text-gray-500 text-center py-16">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  Quiz লোড হচ্ছে...
                </div>
              ) : !quizData.quiz ? (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">🧩</p>
                  <p className="text-white font-semibold">এই section এ এখনো quiz যোগ করা হয়নি</p>
                  <button onClick={() => setActivePanel(null)} className="mt-4 text-purple-400 text-sm underline">ফিরে যাও</button>
                </div>
              ) : quizResult ? (
                /* ── Result screen ── */
                <div>
                  <div className="rounded-2xl p-6 text-center mb-6"
                    style={{ background: quizResult.passed ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${quizResult.passed ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}` }}>
                    <p className="text-4xl mb-2">{quizResult.passed ? "🎉" : "😔"}</p>
                    <p className="text-white font-bold text-xl mb-1">{quizResult.passed ? "পাস!" : "ফেল"}</p>
                    <p className="text-3xl font-black mb-1" style={{ color: quizResult.passed ? "#22c55e" : "#ef4444" }}>{quizResult.score}%</p>
                    <p className="text-gray-400 text-sm">{quizResult.correct}/{quizResult.total} সঠিক · Pass mark: {quizResult.passMark}%</p>
                  </div>
                  {/* Answer review */}
                  <div className="space-y-4">
                    {quizResult.questions.map((q, qi) => (
                      <div key={q._id} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <p className="text-white font-semibold text-sm mb-3">{qi + 1}. {q.question}</p>
                        <div className="space-y-2">
                          {q.options.map(opt => {
                            const isCorrect = opt.isCorrect;
                            const isYours = String(opt._id) === String(q.yourAnswer);
                            return (
                              <div key={opt._id} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                                style={{ background: isCorrect ? "rgba(34,197,94,0.1)" : isYours && !isCorrect ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${isCorrect ? "rgba(34,197,94,0.3)" : isYours && !isCorrect ? "rgba(239,68,68,0.25)" : "transparent"}` }}>
                                <span style={{ color: isCorrect ? "#22c55e" : isYours && !isCorrect ? "#ef4444" : "#6b7280" }}>
                                  {isCorrect ? "✓" : isYours && !isCorrect ? "✗" : "○"}
                                </span>
                                <span style={{ color: isCorrect ? "#86efac" : isYours && !isCorrect ? "#fca5a5" : "#9ca3af" }}>{opt.text}</span>
                                {isYours && <span className="ml-auto text-xs text-gray-500">তোমার উত্তর</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  {quizResult.attemptsLeft != null && (
                    <p className="text-center text-sm text-gray-500 mb-4">
                      {quizResult.attemptsLeft > 0
                        ? `আর ${quizResult.attemptsLeft} বার attempt বাকি আছে`
                        : "সর্বোচ্চ attempt শেষ — আর চেষ্টা করা যাবে না"}
                    </p>
                  )}
                  <div className="flex gap-3 mt-2">
                    {(quizResult.attemptsLeft == null || quizResult.attemptsLeft > 0) && (
                      <button onClick={() => { setQuizResult(null); setQuizAnswers({}); }} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "rgba(255,255,255,0.08)" }}>
                        আবার দাও
                      </button>
                    )}
                    <button onClick={() => setActivePanel(null)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "linear-gradient(90deg,#7c3aed,#06b6d4)" }}>
                      কোর্সে ফিরে যাও
                    </button>
                  </div>
                </div>
              ) : !quizData.canAttempt ? (
                /* ── No attempts left ── */
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">🚫</p>
                  <p className="text-white font-semibold mb-2">আর কোনো attempt বাকি নেই</p>
                  <p className="text-gray-500 text-sm mb-1">
                    সর্বোচ্চ {quizData.quiz.maxAttempts} বার attempt দেওয়া হয়ে গেছে।
                  </p>
                  {quizData.lastAttempt && (
                    <p className="text-gray-400 text-sm mt-3">
                      সর্বোচ্চ স্কোর: <span className="font-bold" style={{ color: quizData.lastAttempt.passed ? "#22c55e" : "#ef4444" }}>{quizData.lastAttempt.score}%</span>
                    </p>
                  )}
                  <button onClick={() => setActivePanel(null)} className="mt-5 text-purple-400 text-sm underline">ফিরে যাও</button>
                </div>
              ) : (
                /* ── Quiz questions ── */
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-white font-bold text-lg">{quizData.quiz.title}</h2>
                      <p className="text-gray-500 text-sm mt-0.5">
                        {quizData.quiz.questions.length}টা প্রশ্ন · Pass: {quizData.quiz.passMark}%
                        {quizData.quiz.maxAttempts > 0 && (
                          <> · attempt বাকি: <span style={{ color: quizData.attemptsLeft <= 1 ? "#f87171" : "#9ca3af" }}>{quizData.attemptsLeft}/{quizData.quiz.maxAttempts}</span></>
                        )}
                      </p>
                    </div>
                    <button onClick={() => setActivePanel(null)} className="text-gray-500 hover:text-white text-xs">✕ বন্ধ</button>
                  </div>
                  {quizData.lastAttempt && (
                    <div className="mb-4 px-4 py-2 rounded-xl text-sm" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "#fbbf24" }}>
                      আগের attempt: {quizData.lastAttempt.score}% · {quizData.lastAttempt.passed ? "পাস ✓" : "ফেল — আবার চেষ্টা করো"}
                    </div>
                  )}
                  <div className="space-y-5">
                    {quizData.quiz.questions.map((q, qi) => (
                      <div key={q._id} className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <p className="text-white font-semibold text-sm mb-4">{qi + 1}. {q.question}</p>
                        <div className="space-y-2.5">
                          {q.options.map(opt => {
                            const selected = quizAnswers[q._id] === String(opt._id);
                            return (
                              <button key={opt._id} onClick={() => setQuizAnswers(prev => ({ ...prev, [q._id]: String(opt._id) }))}
                                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-left transition-all"
                                style={{ background: selected ? "rgba(124,58,237,0.18)" : "rgba(255,255,255,0.03)", border: `1px solid ${selected ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.08)"}`, color: selected ? "#e9d5ff" : "#d1d5db" }}>
                                <span className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0 text-xs"
                                  style={{ borderColor: selected ? "#a78bfa" : "rgba(255,255,255,0.2)", background: selected ? "rgba(124,58,237,0.3)" : "transparent" }}>
                                  {selected ? "●" : ""}
                                </span>
                                {opt.text}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={submitQuiz} disabled={quizSubmitting}
                    className="mt-6 w-full py-3 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-60"
                    style={{ background: "linear-gradient(90deg,#7c3aed,#06b6d4)" }}>
                    {quizSubmitting ? "Submit হচ্ছে..." : "Quiz Submit করো"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Assignment Panel ────────────────────────────────────────── */}
          {activePanel?.type === "assignment" && (
            <div className="flex-1 overflow-y-auto p-6" style={{ maxWidth: 700 }}>
              {!asgnData ? (
                <div className="text-gray-500 text-center py-16">
                  <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  Assignment লোড হচ্ছে...
                </div>
              ) : !asgnData._id ? (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">📝</p>
                  <p className="text-white font-semibold">এই module এ এখনো assignment দেওয়া হয়নি</p>
                  <button onClick={() => setActivePanel(null)} className="mt-4 text-yellow-400 text-sm underline">ফিরে যাও</button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-white font-bold text-lg">{asgnData.title}</h2>
                    <button onClick={() => setActivePanel(null)} className="text-gray-500 hover:text-white text-xs">✕</button>
                  </div>
                  {asgnData.deadline && (
                    <p className="text-amber-400 text-xs mb-3">⏰ Deadline: {new Date(asgnData.deadline).toLocaleString("bn-BD")}</p>
                  )}
                  {asgnData.description && (
                    <div className="rounded-xl p-4 mb-5 text-sm text-gray-300" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
                      {asgnData.description}
                    </div>
                  )}

                  {/* Previous submission status */}
                  {asgnData.mySubmission && (
                    <div className="mb-5 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}>
                      <p className="text-green-400 font-semibold mb-1">✓ Submit করা হয়েছে</p>
                      <p className="text-gray-400">Status: <span style={{ color: asgnData.mySubmission.status === "accepted" ? "#22c55e" : asgnData.mySubmission.status === "rejected" ? "#ef4444" : "#fbbf24" }}>{asgnData.mySubmission.status}</span></p>
                      {asgnData.mySubmission.mark != null && <p className="text-gray-400">Mark: {asgnData.mySubmission.mark} / 50</p>}
                      {asgnData.mySubmission.feedback && <p className="text-gray-400 mt-1">Feedback: {asgnData.mySubmission.feedback}</p>}
                      <p className="text-gray-600 text-xs mt-1">আবার submit করলে overwrite হবে</p>
                    </div>
                  )}

                  {/* Answer form */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-gray-300 text-sm font-medium block mb-2">তোমার উত্তর লেখো *</label>
                      <textarea rows={6} value={asgnText} onChange={e => setAsgnText(e.target.value)}
                        placeholder="এখানে তোমার উত্তর লেখো..."
                        className="w-full rounded-xl px-4 py-3 text-sm text-white resize-none focus:outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                    </div>
                    <div>
                      <label className="text-gray-300 text-sm font-medium block mb-2">📁 Google Drive Link দাও</label>
                      <input value={asgnFile} onChange={e => setAsgnFile(e.target.value)}
                        placeholder="https://drive.google.com/file/d/..."
                        className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
                      <p className="text-gray-600 text-xs mt-1.5">
                        তোমার ফাইল Google Drive এ আপলোড করে "Anyone with the link" access দিয়ে link এখানে paste করো। GitHub repo link ও দিতে পারো।
                      </p>
                    </div>
                    <button onClick={submitAssignment} disabled={asgnSubmitting}
                      className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-60"
                      style={{ background: "linear-gradient(90deg,#eab308,#f97316)" }}>
                      {asgnSubmitting ? "Submit হচ্ছে..." : "Assignment Submit করো 🚀"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Video Panel (default) ────────────────────────────────────── */}
          {!activePanel && (
            <>
              {/* Video */}
              <div className="w-full" style={{ background: "#000" }}>
                <VideoPlayer lecture={activeLecture} onEnded={handleVideoEnded} />
              </div>

              {/* ── Part label + Prev/Next bar ─────────────────────────── */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b"
                style={{ background: "#0d011f", borderColor: "#1a0533" }}>
                <div className="min-w-0">
                  <span className="text-gray-500 text-xs">
                    Part-{String((activeLecture?.globalIndex ?? 0) + 1).padStart(2, "0")}
                  </span>
                  <p className="text-white font-semibold text-sm truncate mt-0.5">
                    {activeLecture?.title || "Lecture"}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={goPrev} disabled={!hasPrev}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#d1d5db" }}>
                    Previous
                  </button>
                  <button onClick={goNext} disabled={!hasNext}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30"
                    style={{ background: hasNext ? "linear-gradient(90deg,#7c3aed,#06b6d4)" : "rgba(255,255,255,0.07)", border: "1px solid transparent", color: "#fff" }}>
                    Next
                  </button>
                </div>
              </div>

              {/* ── Tabs ─────────────────────────────────────────────────── */}
              <LectureTabs
                activeLecture={activeLecture}
                isLectureDone={isLectureDone}
                onMarkComplete={() => markCompleted(activeLecture)}
              />
            </>
          )}
        </div>

        {/* RIGHT — module/lecture sidebar */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0 border-t lg:border-t-0 lg:border-l overflow-hidden flex flex-col"
          style={{ borderColor: "#1a0533" }}>
          <Sidebar
            courseId={courseId}
            curriculum={curriculum}
            flatLectures={flatLectures}
            activeLecture={activePanel ? null : activeLecture}
            onSelect={(lec) => { setActivePanel(null); selectLecture(lec); }}
            completed={completed}
            quizAttempts={quizAttempts}
            quizExists={quizExists}
            asgnExists={asgnExists}
            activePanel={activePanel}
            onOpenQuiz={openQuiz}
            onOpenAssignment={openAssignment}
            bookmarked={bookmarked}
            onToggleBookmark={toggleLectureBookmark}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentCourseView;
