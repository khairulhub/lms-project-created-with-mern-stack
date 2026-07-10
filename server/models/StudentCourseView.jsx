// client/src/pages/student/StudentCourseView.jsx
// Programming Hero–style enrolled course viewer.
// Left: video player. Right: scrollable module/lecture list.
// Lectures play one by one; finishing one auto-advances to the next.

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";

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

// ── Sidebar: module list ──────────────────────────────────────────────────
const Sidebar = ({ curriculum, flatLectures, activeLecture, onSelect, completed }) => {
  const [openSections, setOpenSections] = useState(() =>
    curriculum.reduce((acc, _, i) => ({ ...acc, [i]: i === 0 }), {})
  );

  const toggle = (i) =>
    setOpenSections((prev) => ({ ...prev, [i]: !prev[i] }));

  const totalLectures = flatLectures.length;
  const totalSeconds = flatLectures.reduce((s, l) => s + toSeconds(l.duration), 0);
  const doneCount = completed.size;

  return (
    <div className="flex flex-col h-full" style={{ background: "#0d011f" }}>
      {/* Header */}
      <div className="shrink-0 px-4 py-4 border-b" style={{ borderColor: "#1a0533" }}>
        <p className="text-white font-bold text-sm mb-1">কোর্স কন্টেন্ট</p>
        <p className="text-gray-500 text-xs">
          {curriculum.length} Section · {totalLectures} Lecture · {formatTotal(totalSeconds)}
        </p>
        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{doneCount}/{totalLectures} সম্পন্ন</span>
            <span>{totalLectures > 0 ? Math.round((doneCount / totalLectures) * 100) : 0}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full" style={{ background: "#1f2937" }}>
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                background: "linear-gradient(90deg,#7c3aed,#06b6d4)",
                width: `${totalLectures > 0 ? (doneCount / totalLectures) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#3b0764 #0d011f" }}>
        {curriculum.map((section, si) => {
          const sectionLectures = flatLectures.filter((l) => l.sectionIndex === si);
          const sectionSeconds = sectionLectures.reduce((s, l) => s + toSeconds(l.duration), 0);
          const isOpen = openSections[si];

          return (
            <div key={si} className="border-b" style={{ borderColor: "#1a0533" }}>
              {/* Section header */}
              <button
                onClick={() => toggle(si)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/5"
              >
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

              {/* Lectures */}
              {isOpen && (
                <div>
                  {sectionLectures.map((lec) => {
                    const isActive = activeLecture?.globalIndex === lec.globalIndex;
                    const isDone = completed.has(String(lec._id));

                    return (
                      <button
                        key={lec.globalIndex}
                        onClick={() => onSelect(lec)}
                        className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
                        style={{
                          background: isActive
                            ? "linear-gradient(90deg, rgba(124,58,237,0.25), rgba(6,182,212,0.08))"
                            : "transparent",
                          borderLeft: isActive ? "3px solid #7c3aed" : "3px solid transparent",
                        }}
                      >
                        {/* Icon */}
                        <div
                          className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                          style={{
                            background: isDone
                              ? "rgba(34,197,94,0.2)"
                              : isActive
                              ? "rgba(124,58,237,0.3)"
                              : "rgba(255,255,255,0.05)",
                            border: isDone
                              ? "1px solid rgba(34,197,94,0.5)"
                              : isActive
                              ? "1px solid rgba(124,58,237,0.6)"
                              : "1px solid rgba(255,255,255,0.1)",
                          }}
                        >
                          {isDone ? (
                            <CheckIcon size={11} />
                          ) : isActive ? (
                            <PlayIcon size={9} />
                          ) : (
                            <PlayIcon size={9} />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p
                            className="text-xs leading-snug"
                            style={{ color: isActive ? "#e9d5ff" : isDone ? "#9ca3af" : "#d1d5db" }}
                          >
                            {lec.title}
                          </p>
                          {lec.duration && (
                            <p className="text-gray-600 text-xs mt-0.5">{lec.duration}</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
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

  const [course, setCourse] = useState(null);
  const [detail, setDetail] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeLecture, setActiveLecture] = useState(null);
  const [completed, setCompleted] = useState(new Set());
  const [progressLoaded, setProgressLoaded] = useState(false);
  const lastWatchedRef = useRef(null); // lecture _id থেকে resume করার জন্য, curriculum লোড হওয়ার আগে ধরে রাখা হয়

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
        const [courseRes, detailRes, progressRes] = await Promise.allSettled([
          api.get(`/courses/${courseId}`),
          api.get(`/course-details/${courseId}`),
          api.get(`/progress/${courseId}`),
        ]);

        if (courseRes.status === "fulfilled") setCourse(courseRes.value.data);
        if (detailRes.status === "fulfilled") setDetail(detailRes.value.data);

        // 3. Restore completed lectures + last-watched lecture (refresh/device-safe)
        if (progressRes.status === "fulfilled") {
          const { completedLectures = [], lastWatchedLecture = null } = progressRes.value.data || {};
          setCompleted(new Set(completedLectures.map(String)));
          lastWatchedRef.current = lastWatchedLecture ? String(lastWatchedLecture) : null;
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
      const resumeAt = lastWatchedRef.current
        ? flatLectures.find((l) => String(l._id) === lastWatchedRef.current)
        : null;
      setActiveLecture(resumeAt || flatLectures[0]);
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

  const markCompleted = useCallback((lec) => {
    if (!lec?._id) return;
    const key = String(lec._id);
    setCompleted((prev) => {
      if (prev.has(key)) return prev; // already done — backend call এড়িয়ে চলো
      return new Set([...prev, key]);
    });
    // Persist করো backend-এ — refresh দিলে বা অন্য device এ গেলেও progress থাকবে
    api.put(`/progress/${courseId}/lecture/${lec._id}`, { completed: true }).catch(() => {});
  }, [courseId]);

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

      {/* ── Main layout: video + sidebar ─────────────────────────────── */}
      <div className="flex flex-col lg:flex-row" style={{ minHeight: "calc(100vh - 120px)" }}>

        {/* LEFT — video + controls */}
        <div className="flex-1 flex flex-col" style={{ background: "#0a0118" }}>

          {/* Video */}
          <div className="w-full" style={{ background: "#000" }}>
            <VideoPlayer lecture={activeLecture} onEnded={handleVideoEnded} />
          </div>

          {/* ── Part label + Prev/Next bar ───────────────────────────── */}
          <div
            className="flex items-center justify-between gap-3 px-4 py-3 border-b"
            style={{ background: "#0d011f", borderColor: "#1a0533" }}
          >
            <div className="min-w-0">
              <span className="text-gray-500 text-xs">
                Part-{String((activeLecture?.globalIndex ?? 0) + 1).padStart(2, "0")}
              </span>
              <p className="text-white font-semibold text-sm truncate mt-0.5">
                {activeLecture?.title || "Lecture"}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={goPrev}
                disabled={!hasPrev}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#d1d5db",
                }}
              >
                Previous
              </button>
              <button
                onClick={goNext}
                disabled={!hasNext}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30"
                style={{
                  background: hasNext
                    ? "linear-gradient(90deg,#7c3aed,#06b6d4)"
                    : "rgba(255,255,255,0.07)",
                  border: "1px solid transparent",
                  color: "#fff",
                }}
              >
                Next
              </button>
            </div>
          </div>

          {/* ── Tabs: Copyright Warning · Conceptual Session · Notes ──── */}
          <LectureTabs
            activeLecture={activeLecture}
            isLectureDone={isLectureDone}
            onMarkComplete={() => markCompleted(activeLecture)}
          />

          {/* Course complete banner */}
          {!hasNext && completed.size === flatLectures.length && (
            <div
              className="mx-4 mb-4 rounded-2xl p-5 text-center"
              style={{
                background:
                  "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(6,182,212,0.1))",
                border: "1px solid rgba(34,197,94,0.3)",
              }}
            >
              <p className="text-3xl mb-2">🎉</p>
              <p className="text-white font-bold text-base mb-1">কোর্স সম্পন্ন!</p>
              <p className="text-gray-400 text-sm">
                অভিনন্দন! তুমি পুরো কোর্সটি শেষ করেছো।
              </p>
            </div>
          )}
        </div>

        {/* RIGHT — module/lecture sidebar */}
        <div
          className="w-full lg:w-80 xl:w-96 shrink-0 border-t lg:border-t-0 lg:border-l overflow-hidden flex flex-col"
          style={{ borderColor: "#1a0533" }}
        >
          <Sidebar
            curriculum={curriculum}
            flatLectures={flatLectures}
            activeLecture={activeLecture}
            onSelect={selectLecture}
            completed={completed}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentCourseView;
