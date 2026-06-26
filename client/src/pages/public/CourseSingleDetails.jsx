import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import PublicLayout from "../../components/layout/PublicLayout";
import {
  FiStar, FiUsers, FiClock, FiCheck, FiChevronDown, FiChevronUp,
  FiChevronLeft, FiChevronRight, FiPlay, FiShield, FiAward, FiSmartphone,
  FiThumbsUp, FiTag, FiRepeat, FiGlobe, FiShoppingCart, FiSend,
  FiVideo, FiPlayCircle, FiX,
} from "react-icons/fi";

// ════════════════════════════════════════════════════════════════════════
// STATIC / DUMMY DATA — design-only stage.
//
// Eikhane DB theke kichu fetch kora hoyni — Categories page-er ekti course
// card e click korle, ei page-e oi course-er `id` URL param hisebe ashe
// (useParams() diye nicher line e dhora hoise), kintu seita diye kono API
// call kora hocche na ekhono. Page-tar design/layout আগে thik kore felেছি,
// pore নিজে DB connect korar somoy nicher commented-out block ta uncomment
// kore dile pura page real data diye bhore jabe — kono onno kothao change
// korar dorkar nei.
//
// Connect korar somoy ei DUMMY_COURSE / DUMMY_INSTRUCTOR remove kore felun
// ebong nicher commented block ta active koren:
//
//   const [course, setCourse] = useState(null);
//   const [loading, setLoading] = useState(true);
//   useEffect(() => {
//     api.get(`/courses/${id}`)
//       .then((res) => setCourse(res.data))   // res.data.createdBy = instructor
//       .catch(() => toast.error("Course load korte parlam na"))
//       .finally(() => setLoading(false));
//   }, [id]);
//
// (`api` ar `toast` import korte hobe upore — onno admin page e jevabe
// kora ache thik shei pattern. Course model er `createdBy` field-e admin/
// instructor-er reference already ache, tai instructor info ei course
// fetch-er sathei chole asbe — alada call lagbe na.)
// ════════════════════════════════════════════════════════════════════════
const DUMMY_COURSE = {
  emoji: "🚀",
  image: "", // imgBB URL thakle eta bhorbe, na thakle emoji full-hero te dekhabe
  // DB connect korar somoy course.introVideo field theke asbe (YouTube/direct mp4 URL)
  introVideo: "https://www.youtube.com/embed/dQw4w9WgXcQ", // placeholder — replace with real URL
  badge: "HOT",
  tags: ["Bestseller", "Full Stack"],
  title: "Complete MERN Stack Development",
  description:
    "HTML, CSS, JavaScript, React, Node.js, MongoDB সহ সম্পূর্ণ Full Stack Web Development শেখো শুরু থেকে শেষ পর্যন্ত। বাস্তব প্রজেক্ট বানিয়ে পোর্টফোলিও তৈরি করো এবং ক্যারিয়ার শুরু করো।",
  rating: 4.8,
  reviewCount: 1248,
  students: "32,500",
  hours: "60+",
  price: 4500,
  originalPrice: 12000,
  category: { name: "MERN Stack", icon: "⚛️" },
  lastUpdated: "জুন ২০২৬",
  language: "বাংলা",
};

// course.createdBy theke ashbe — DB connect na hoya porjonto dummy.
const DUMMY_INSTRUCTOR = {
  name: "Jhankar Mahbub",
  title: "Lead Instructor · Full Stack Engineer",
  avatarSeed: "jhankar",
  rating: 4.9,
  reviewCount: 8540,
  students: "45,200",
  courseCount: 6,
  bio: "৮+ বছরের ইন্ডাস্ট্রি এক্সপেরিয়েন্স নিয়ে Ex-Google Engineer। হাজারো শিক্ষার্থীকে web development শিখিয়ে ক্যারিয়ার গড়তে সাহায্য করেছেন।",
};

const WHAT_YOU_GET = [
  "৬০+ ঘণ্টা HD ভিডিও কনটেন্ট",
  "৪টি বাস্তব প্রজেক্ট (পোর্টফোলিও-রেডি)",
  "লাইফটাইম অ্যাক্সেস",
  "মোবাইল ও ডেস্কটপ থেকে দেখার সুবিধা",
  "কোর্স শেষে সার্টিফিকেট",
  "প্রাইভেট কমিউনিটি গ্রুপ অ্যাক্সেস",
  "সাপ্তাহিক লাইভ মেন্টরশিপ সেশন",
  "৩০ দিনের মানি-ব্যাক গ্যারান্টি",
];

const REQUIREMENTS = [
  "একটি কম্পিউটার (Windows / Mac / Linux যেকোনো একটি)",
  "ইন্টারনেট সংযোগ",
  "কোনো পূর্ব প্রোগ্রামিং জ্ঞান লাগবে না — শূন্য থেকে শেখানো হবে",
];

// Each module ("section" — Udemy er bhashay) ekhon nije nije total duration/
// lecture-count gun na kore — CurriculumSection component nicher lectures
// theke shoja calculate kore. Tai DB connect korar somoy shudhu eki shape-er
// (title + lectures[{title,duration,preview}]) array dile hobe, alada kore
// kono count/total field pathate hobe na.
const CURRICULUM = [
  {
    title: "HTML, CSS ও JavaScript Fundamentals",
    lectures: [
      { title: "কোর্স পরিচিতি", duration: "5:32", preview: true },
      { title: "ডেভেলপমেন্ট এনভায়রনমেন্ট সেটআপ", duration: "8:10", preview: true },
      { title: "HTML স্ট্রাকচার ও ট্যাগ পরিচিতি", duration: "14:25", preview: false },
      { title: "CSS দিয়ে স্টাইলিং বেসিকস", duration: "16:48", preview: false },
      { title: "Flexbox ও Grid Layout", duration: "22:05", preview: false },
      { title: "JavaScript ভ্যারিয়েবল ও ফাংশন", duration: "19:30", preview: false },
      { title: "DOM Manipulation প্র্যাকটিস", duration: "17:42", preview: false },
    ],
  },
  {
    title: "React.js দিয়ে Frontend Development",
    lectures: [
      { title: "React কী এবং কেন শিখব", duration: "6:15", preview: true },
      { title: "Components ও JSX বেসিকস", duration: "18:20", preview: false },
      { title: "Props ও State ব্যবস্থাপনা", duration: "21:50", preview: false },
      { title: "useEffect ও Hooks পরিচিতি", duration: "24:10", preview: false },
      { title: "React Router দিয়ে Navigation", duration: "19:35", preview: false },
      { title: "Forms ও Validation হ্যান্ডলিং", duration: "23:05", preview: false },
    ],
  },
  {
    title: "Node.js ও Express দিয়ে Backend",
    lectures: [
      { title: "Node.js রানটাইম পরিচিতি", duration: "9:40", preview: true },
      { title: "Express সার্ভার সেটআপ", duration: "15:22", preview: false },
      { title: "REST API ডিজাইন প্যাটার্ন", duration: "20:15", preview: false },
      { title: "Middleware ও Error Handling", duration: "18:48", preview: false },
      { title: "JWT দিয়ে Authentication", duration: "26:30", preview: false },
    ],
  },
  {
    title: "MongoDB ও Database Design",
    lectures: [
      { title: "MongoDB Atlas সেটআপ", duration: "7:55", preview: true },
      { title: "Schema ও Model ডিজাইন", duration: "16:40", preview: false },
      { title: "Mongoose দিয়ে CRUD অপারেশন", duration: "22:18", preview: false },
      { title: "Aggregation ও Indexing", duration: "19:12", preview: false },
    ],
  },
  {
    title: "Authentication ও Deployment",
    lectures: [
      { title: "Password Hashing ও bcrypt", duration: "12:05", preview: false },
      { title: "Render-এ Backend Deploy", duration: "14:30", preview: false },
      { title: "Vercel-এ Frontend Deploy", duration: "11:48", preview: false },
      { title: "Environment Variables ও Security", duration: "10:22", preview: false },
    ],
  },
  {
    title: "৪টি রিয়েল-ওয়ার্ল্ড প্রজেক্ট",
    lectures: [
      { title: "প্রজেক্ট ১ — E-Commerce অ্যাপ", duration: "45:10", preview: true },
      { title: "প্রজেক্ট ২ — LMS প্ল্যাটফর্ম", duration: "52:30", preview: false },
      { title: "প্রজেক্ট ৩ — রিয়েল-টাইম চ্যাট অ্যাপ", duration: "38:45", preview: false },
      { title: "প্রজেক্ট ৪ — প্রপার্টি লিস্টিং সাইট", duration: "41:20", preview: false },
    ],
  },
];

// "Mm:ss" -> total seconds, used to sum up section/course duration.
const toSeconds = (d) => {
  const [m, s] = d.split(":").map(Number);
  return m * 60 + (s || 0);
};

// total seconds -> "Xh Ym" style label (matches Udemy's "10h 19m total length")
const formatTotal = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const REVIEWS = [
  { name: "রাহিম উদ্দিন", role: "Junior Developer @ TechCorp", seed: "rahim", rating: 5,
    text: "এই কোর্সটা আমার জীবন বদলে দিয়েছে। ৬ মাসে জব পেয়েছি। শেখানোর স্টাইল অসাধারণ।" },
  { name: "ফাতেমা খাতুন", role: "Freelancer @ Upwork", seed: "fatema", rating: 5,
    text: "এখন মাসে ৫০k+ ইনকাম করি। সত্যিকারের জীবন পরিবর্তনকারী কোর্স।" },
  { name: "করিম হোসেন", role: "Full Stack Dev @ StartupBD", seed: "karim", rating: 4,
    text: "Projects গুলো এত real-world যে job interview-এ সরাসরি কাজে লেগেছে।" },
  { name: "নাফিসা আক্তার", role: "React Developer @ RemoteJob", seed: "nafisa", rating: 5,
    text: "বিদেশ থেকে remote job পেয়েছি এই কোর্সের পরে। Mentor support ছাড়া এত দূর আসতে পারতাম না।" },
  { name: "সজীব আহমেদ", role: "Software Engineer @ BJIT", seed: "sajib", rating: 4,
    text: "Curriculum অনেক comprehensive। Node.js ও React একসাথে শিখতে পেরেছি।" },
];

const FAQ = [
  { q: "কোনো পূর্ব অভিজ্ঞতা ছাড়া কি এই কোর্স করা যাবে?", a: "হ্যাঁ! একদম শুরু থেকে শেখানো হয়। Computer চালাতে পারলেই যথেষ্ট।" },
  { q: "কোর্সটি কতদিনে শেষ করা যাবে?", a: "সাধারণত ১৬ সপ্তাহে শেষ হয়, তবে লাইফটাইম অ্যাক্সেস থাকায় নিজের গতিতে শিখতে পারবে।" },
  { q: "Certificate কি দেওয়া হবে?", a: "হ্যাঁ, কোর্স সম্পন্ন করলে সার্টিফিকেট পাবে।" },
  { q: "মানি-ব্যাক গ্যারান্টি কি সত্যিই আছে?", a: "হ্যাঁ, ৩০ দিনের মধ্যে সন্তুষ্ট না হলে সম্পূর্ণ টাকা ফেরত।" },
];

// ── Video Preview Modal ─────────────────────────────────────────────────
// `videoSrc` = YouTube embed URL অথবা direct mp4 link।
// DB connect korar somoy course.introVideo (card thumbnail click) অথবা
// lecture.videoUrl (preview lecture click) pass korle hobe — same modal use hobe.
const VideoModal = ({ isOpen, onClose, title, videoSrc, freeVideos = [] }) => {
  const [activeVideo, setActiveVideo] = useState(videoSrc);

  useEffect(() => {
    setActiveVideo(videoSrc);
  }, [videoSrc]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  // YouTube embed URL detect
  const isYoutube = activeVideo?.includes("youtube.com/embed") || activeVideo?.includes("youtu.be");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.88)" }}
      onClick={onClose}
    >
      {/*
        Modal — 80vh high, centered, flex column.
        - Header   : shrink-0 (fixed)
        - Video    : shrink-0, height = 40vh  (fixed)
        - List     : flex-1, overflow-y-auto  (scrollable remainder)
      */}
      <div
        className="relative w-full max-w-2xl mx-4 rounded-2xl border border-purple-800 flex flex-col overflow-hidden"
        style={{ background: "#12032a", height: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header — fixed, never scrolls ───────────────────────────── */}
        <div
          className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-purple-900"
          style={{ background: "#1a0533" }}
        >
          <div className="min-w-0 pr-4">
            <p className="text-purple-400 text-xs font-medium mb-0.5">Course Preview</p>
            <h3 className="text-white font-bold text-sm truncate">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* ── Video — fixed 40vh, never scrolls ───────────────────────── */}
        <div className="shrink-0 w-full bg-black" style={{ height: "40vh" }}>
          {isYoutube ? (
            <iframe
              key={activeVideo}
              src={activeVideo + "?autoplay=1"}
              className="w-full h-full"
              allow="autoplay; fullscreen"
              allowFullScreen
              title={title}
            />
          ) : (
            <video
              key={activeVideo}
              src={activeVideo}
              className="w-full h-full"
              controls
              autoPlay
            />
          )}
        </div>

        {/* ── Scrollable area — fills remaining space inside 80vh ──────── */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#6d28d9 #12032a" }}
        >
          {freeVideos.length > 0 && (
            <div className="px-5 pt-4 pb-5">
              <p className="text-white font-semibold text-sm mb-3">Free Sample Videos:</p>
              <div className="space-y-1">
                {freeVideos.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveVideo(v.videoUrl || videoSrc)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left border ${
                      activeVideo === (v.videoUrl || videoSrc)
                        ? "border-purple-600"
                        : "border-transparent hover:bg-purple-900/40"
                    }`}
                    style={
                      activeVideo === (v.videoUrl || videoSrc)
                        ? { background: "rgba(109,40,217,0.25)" }
                        : {}
                    }
                  >
                    {/* Mini thumbnail */}
                    <div
                      className="w-14 h-10 rounded-lg shrink-0 flex items-center justify-center"
                      style={{ background: "#2d0a5e" }}
                    >
                      <FiPlay className="text-cyan-400" size={14} />
                    </div>
                    <span className="flex-1 text-gray-200 text-sm leading-snug text-left">{v.title}</span>
                    <span className="text-gray-500 text-xs shrink-0 tabular-nums">{v.duration}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Small shared bits ───────────────────────────────────────────────────
const Stars = ({ rating, large = false, onRate = null }) => (
  <span className="inline-flex gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <FiStar key={n} size={large ? 22 : 13}
        onClick={onRate ? () => onRate(n) : undefined}
        className={`${n <= Math.round(rating) ? "text-yellow-400" : "text-gray-600"} ${onRate ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
        style={n <= Math.round(rating) ? { fill: "#facc15" } : {}}
      />
    ))}
  </span>
);

const Accordion = ({ title, children, defaultOpen = false, right = null }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-purple-900 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors"
        style={{ background: open ? "#220a40" : "#1a0533" }}
      >
        <span className="text-white font-semibold text-sm">{title}</span>
        <span className="flex items-center gap-3 shrink-0">
          {right}
          {open ? <FiChevronUp className="text-purple-400" /> : <FiChevronDown className="text-purple-400" />}
        </span>
      </button>
      {open && (
        <div className="px-5 py-4" style={{ background: "#12032a" }}>
          {children}
        </div>
      )}
    </div>
  );
};

// ── Curriculum / "Course content" block — Udemy style ──────────────────
// Header shows total sections/lectures/length + an "Expand all sections"
// toggle (controls every accordion at once). Each section accordion shows
// its own lecture-count + duration on the right of the header bar; opening
// it reveals individual lecture rows with a small video icon, the lecture
// title, a "Preview" pill (only for lectures marked preview:true), and the
// duration on the far right — same structure as the screenshot reference.
const CurriculumSection = ({ modules, onPreviewClick }) => {
  const [openMap, setOpenMap] = useState(() => modules.map((_, i) => i === 0)); // first section open by default

  const allOpen = openMap.every(Boolean);
  const toggleAll = () => setOpenMap(modules.map(() => !allOpen));
  const toggleOne = (idx) => setOpenMap((prev) => prev.map((v, i) => (i === idx ? !v : v)));

  const totalLectures = modules.reduce((sum, m) => sum + m.lectures.length, 0);
  const totalSeconds = modules.reduce(
    (sum, m) => sum + m.lectures.reduce((s, l) => s + toSeconds(l.duration), 0),
    0
  );

  return (
    <div>
      {/* Header row — stats left, expand-all link right (matches reference image) */}
      <div className="flex items-end justify-between flex-wrap gap-2 mb-4">
        <div>
          <p className="text-gray-400 text-sm">
            {modules.length} sections · {totalLectures} lectures · {formatTotal(totalSeconds)} total length
          </p>
        </div>
        <button onClick={toggleAll}
          className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold transition-colors">
          {allOpen ? "Collapse all sections" : "Expand all sections"}
        </button>
      </div>

      <div className="border border-purple-900 rounded-xl overflow-hidden divide-y divide-purple-900">
        {modules.map((m, i) => {
          const sectionSeconds = m.lectures.reduce((s, l) => s + toSeconds(l.duration), 0);
          const open = openMap[i];
          return (
            <div key={i}>
              {/* Section header bar */}
              <button onClick={() => toggleOne(i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors"
                style={{ background: open ? "#220a40" : "#1a0533" }}>
                <span className="flex items-center gap-3 min-w-0">
                  {open ? <FiChevronUp className="text-purple-400 shrink-0" /> : <FiChevronDown className="text-purple-400 shrink-0" />}
                  <span className="text-white font-semibold text-sm truncate">{i + 1}. {m.title}</span>
                </span>
                <span className="text-gray-500 text-xs whitespace-nowrap shrink-0">
                  {m.lectures.length} lectures · {formatTotal(sectionSeconds)}
                </span>
              </button>

              {/* Lecture rows */}
              {open && (
                <div style={{ background: "#0d011f" }}>
                  {m.lectures.map((l, li) => (
                    <div key={li}
                      className="flex items-center justify-between gap-4 px-5 py-3 border-t border-purple-950/60 first:border-t-0">
                      <span className="flex items-center gap-3 min-w-0">
                        <FiVideo className="text-gray-500 shrink-0" size={15} />
                        <span className="text-gray-300 text-sm truncate">{l.title}</span>
                      </span>
                      <span className="flex items-center gap-4 shrink-0">
                        {l.preview && (
                          <button
                            onClick={() => onPreviewClick?.(l)}
                            className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 text-xs font-semibold transition-colors"
                          >
                            <FiPlayCircle size={14} /> Preview
                          </button>
                        )}
                        <span className="text-gray-500 text-xs w-12 text-right">{l.duration}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};


const ReviewCard = ({ r }) => (
  <div className="rounded-2xl p-5 border border-purple-800 h-full"
    style={{ background: "linear-gradient(135deg, #1a0533, #0d011f)" }}>
    <div className="flex items-start gap-3 mb-3">
      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${r.seed}`}
        className="w-10 h-10 rounded-full shrink-0" style={{ background: "#2d0a5e" }} alt={r.name} />
      <div>
        <p className="text-white font-semibold text-sm">{r.name}</p>
        <p className="text-purple-400 text-xs">{r.role}</p>
      </div>
    </div>
    <Stars rating={r.rating} />
    <p className="text-gray-300 text-sm mt-3 leading-relaxed">"{r.text}"</p>
    <button className="flex items-center gap-1.5 text-gray-600 hover:text-gray-400 text-xs mt-4 transition-colors">
      <FiThumbsUp size={11} /> Helpful
    </button>
  </div>
);

// ── Auto-sliding review carousel ─────────────────────────────────────────
// Slides through REVIEWS, 1 at a time on mobile / 3 at a time on desktop —
// kept simple (CSS transform translateX) so it's easy to swap dummy reviews
// for DB-fetched ones later (just feed a different array as `reviews` prop).
const ReviewSlider = ({ reviews }) => {
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % reviews.length);
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, [reviews.length]);

  const goTo = (i) => {
    clearInterval(timerRef.current);
    setIndex(((i % reviews.length) + reviews.length) % reviews.length);
    // restart the auto-slide timer after a manual interaction
    timerRef.current = setInterval(() => setIndex((p) => (p + 1) % reviews.length), 4000);
  };

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl">
        <div className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}>
          {reviews.map((r, i) => (
            <div key={i} className="w-full shrink-0 px-1">
              <ReviewCard r={r} />
            </div>
          ))}
        </div>
      </div>

      {/* Prev / Next */}
      <button onClick={() => goTo(index - 1)}
        className="hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-gray-900 border border-purple-800 text-purple-300 items-center justify-center hover:border-purple-500 transition-colors">
        <FiChevronLeft size={16} />
      </button>
      <button onClick={() => goTo(index + 1)}
        className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-gray-900 border border-purple-800 text-purple-300 items-center justify-center hover:border-purple-500 transition-colors">
        <FiChevronRight size={16} />
      </button>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2 mt-5">
        {reviews.map((_, i) => (
          <button key={i} onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-cyan-400" : "w-1.5 bg-gray-700"}`} />
        ))}
      </div>
    </div>
  );
};

// ── Review submission form (shared shape — used for both student → course,
// and student → instructor review boxes below) ──────────────────────────
const ReviewForm = ({ heading, placeholder, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    // DB connect korar somoy: api.post(...) call ekhane hobe.
    onSubmit?.({ rating, name: name.trim() || "Anonymous", text: text.trim() });
    setSent(true);
    setName(""); setText(""); setRating(5);
    setTimeout(() => setSent(false), 3000);
  };

  const inputClass = "w-full bg-gray-900 border border-purple-900 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors";

  return (
    <form onSubmit={submit}
      className="rounded-2xl p-5 border border-purple-800"
      style={{ background: "linear-gradient(135deg, #1a0533, #0d011f)" }}>
      <h3 className="text-white font-semibold text-sm mb-4">{heading}</h3>

      <div className="mb-3">
        <label className="block text-xs text-gray-400 mb-1.5">তোমার রেটিং</label>
        <Stars rating={rating} large onRate={setRating} />
      </div>

      <div className="mb-3">
        <input value={name} onChange={(e) => setName(e.target.value)}
          placeholder="তোমার নাম (ঐচ্ছিক)" className={inputClass} />
      </div>

      <div className="mb-4">
        <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)}
          placeholder={placeholder} className={inputClass + " resize-none"} />
      </div>

      <button type="submit"
        className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
        <FiSend size={14} /> {sent ? "ধন্যবাদ! জমা হয়েছে ✓" : "রিভিউ জমা দাও"}
      </button>
    </form>
  );
};

// ════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════
const CourseSingleDetails = () => {
  // `id` ekhon kichu use hocche na (DUMMY_COURSE diye design kora hocche),
  // kintu route theke already ashche — DB connect korar somoy upore
  // commented block-e ei id ta diyeই api.get(`/courses/${id}`) call hobe.
  const { id } = useParams();
  const course = DUMMY_COURSE;       // ← DB connect korar somoy ei line replace hobe
  const instructor = DUMMY_INSTRUCTOR; // ← course.createdBy theke asbe

  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState(null); // { ok: bool, text: string }

  // Video preview modal state
  // DB connect korar somoy: activeVideo.videoUrl = lecture.videoUrl (DB theke ashbe)
  const [videoModal, setVideoModal] = useState({ open: false, title: "", videoSrc: "" });

  // Collect all preview:true lectures for the "Free Sample Videos" list in modal
  const previewLectures = CURRICULUM.flatMap((m) =>
    m.lectures.filter((l) => l.preview)
  );

  const openVideoModal = (title, videoSrc) => {
    setVideoModal({ open: true, title, videoSrc });
  };
  const closeVideoModal = () => setVideoModal((v) => ({ ...v, open: false }));

  const discountPct = course.originalPrice > course.price
    ? Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)
    : 0;

  // Coupon-tao design-stage e static — kono real validation/DB call nei.
  // DB connect korar somoy ei function-take api.post("/coupons/apply", ...)
  // diye replace korle hobe.
  const applyCoupon = (e) => {
    e.preventDefault();
    if (!coupon.trim()) return;
    setCouponMsg({ ok: false, text: "এই কুপন কোডটি বৈধ নয় (ডেমো — পরে DB-এর সাথে যুক্ত হবে)" });
  };

  const handleStudentReview = (review) => {
    // DB connect korar somoy: api.post(`/courses/${id}/reviews`, review)
    console.log("New course review (static demo, not saved):", review);
  };

  const handleInstructorReview = (review) => {
    // DB connect korar somoy: api.post(`/instructors/${instructor.id}/reviews`, review)
    console.log("New instructor review (static demo, not saved):", review);
  };

  return (
    <PublicLayout>
      {/* ── Video Preview Modal ─────────────────────────────────────────── */}
      <VideoModal
        isOpen={videoModal.open}
        onClose={closeVideoModal}
        title={videoModal.title}
        videoSrc={videoModal.videoSrc}
        freeVideos={previewLectures.map((l) => ({
          title: l.title,
          duration: l.duration,
          // DB connect korar somoy: l.videoUrl — ekhon course.introVideo use korche
          videoUrl: course.introVideo,
        }))}
      />

      {/* ── HERO — full-width image/emoji banner, text below ──────────── */}
      <section style={{ background: "#0a0118" }}>
        <div className="relative w-full h-[58vh] min-h-[320px] max-h-[560px] overflow-hidden">
          {course.image ? (
            <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[9rem] sm:text-[12rem]"
              style={{ background: "linear-gradient(135deg, #1a0533, #3b0764, #0a0118)" }}>
              {course.emoji}
            </div>
          )}
          {/* dark gradient overlay so it blends into the text section below */}
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to top, #0a0118 0%, rgba(10,1,24,0.2) 40%, transparent 75%)" }} />
        </div>

        <div className="max-w-6xl mx-auto px-4 -mt-6 relative pb-10">
          {course.category && (
            <span className="inline-flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
              {course.category.icon} {course.category.name}
            </span>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {course.badge && (
              <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">{course.badge}</span>
            )}
            {course.tags?.map((t) => (
              <span key={t} className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-medium px-3 py-1 rounded-full">
                {t}
              </span>
            ))}
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4 max-w-3xl">
            {course.title}
          </h1>
          <p className="text-gray-300 text-base leading-relaxed mb-6 max-w-2xl">
            {course.description}
          </p>

          <div className="flex flex-wrap items-center gap-5 text-sm">
            <span className="flex items-center gap-1.5 text-yellow-400 font-bold">
              <Stars rating={course.rating} /> {course.rating}
              <span className="text-gray-500 font-normal">({course.reviewCount.toLocaleString()} reviews)</span>
            </span>
            <span className="flex items-center gap-1.5 text-gray-400">
              <FiUsers size={14} /> {course.students} students
            </span>
            <span className="flex items-center gap-1.5 text-gray-400">
              <FiClock size={14} /> {course.hours} hours
            </span>
            <span className="flex items-center gap-1.5 text-gray-400">
              <FiGlobe size={14} /> {course.language}
            </span>
            <span className="text-gray-500">সর্বশেষ আপডেট: {course.lastUpdated}</span>
          </div>
        </div>
      </section>

      {/* ── BODY ──────────────────────────────────────────────────────── */}
      <section style={{ background: "#0d011f" }} className="py-14 px-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-10">

          {/* Left — main content */}
          <div className="lg:col-span-2 space-y-12">

            {/* What you'll get */}
            <div>
              <h2 className="text-xl font-bold text-white mb-5">এই কোর্সে যা পাবে</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {WHAT_YOU_GET.map((item) => (
                  <div key={item} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <FiCheck className="text-cyan-400 mt-0.5 shrink-0" size={16} />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div>
              <h2 className="text-xl font-bold text-white mb-5">প্রয়োজনীয়তা</h2>
              <ul className="space-y-2">
                {REQUIREMENTS.map((r) => (
                  <li key={r} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Curriculum — "Course content" Udemy-style layout */}
            <div>
              <h2 className="text-xl font-bold text-white mb-4">কোর্স কারিকুলাম</h2>
              <CurriculumSection
                modules={CURRICULUM}
                onPreviewClick={(lecture) =>
                  openVideoModal(lecture.title, course.introVideo)
                  // DB connect korar somoy: lecture.videoUrl pass korte hobe
                }
              />
            </div>

            {/* Reviews — auto-sliding carousel */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white">শিক্ষার্থীদের রিভিউ</h2>
                <span className="flex items-center gap-1.5 text-yellow-400 font-bold text-sm">
                  <Stars rating={course.rating} /> {course.rating}
                  <span className="text-gray-500 font-normal">({course.reviewCount.toLocaleString()})</span>
                </span>
              </div>
              <ReviewSlider reviews={REVIEWS} />
            </div>

            {/* Student review submission */}
            <div>
              <h2 className="text-xl font-bold text-white mb-5">তোমার মতামত জানাও</h2>
              <ReviewForm
                heading="এই কোর্স সম্পর্কে রিভিউ লিখো"
                placeholder="কোর্স সম্পর্কে তোমার অভিজ্ঞতা শেয়ার করো..."
                onSubmit={handleStudentReview}
              />
            </div>

            {/* Instructor */}
            <div>
              <h2 className="text-xl font-bold text-white mb-5">কোর্স ইন্সট্রাক্টর</h2>
              <div className="rounded-2xl p-6 border border-purple-800 flex flex-col sm:flex-row gap-5"
                style={{ background: "linear-gradient(135deg, #1a0533, #12032a)" }}>
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${instructor.avatarSeed}`}
                  className="w-20 h-20 rounded-2xl shrink-0" style={{ background: "#2d0a5e" }} alt={instructor.name} />
                <div className="flex-1">
                  <p className="text-white font-bold text-lg">{instructor.name}</p>
                  <p className="text-purple-400 text-sm mb-3">{instructor.title}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-3">
                    <span className="flex items-center gap-1.5 text-yellow-400 font-semibold">
                      <Stars rating={instructor.rating} /> {instructor.rating} instructor rating
                    </span>
                    <span className="flex items-center gap-1.5"><FiUsers size={13} /> {instructor.students} students</span>
                    <span className="flex items-center gap-1.5"><FiAward size={13} /> {instructor.courseCount} courses</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{instructor.bio}</p>
                </div>
              </div>
            </div>

            {/* Instructor review submission */}
            <div>
              <h2 className="text-xl font-bold text-white mb-5">ইন্সট্রাক্টরকে রিভিউ দাও</h2>
              <ReviewForm
                heading={`${instructor.name}-কে নিয়ে তোমার মতামত`}
                placeholder="ইন্সট্রাক্টরের পড়ানোর স্টাইল কেমন লাগলো?"
                onSubmit={handleInstructorReview}
              />
            </div>

            {/* FAQ */}
            <div>
              <h2 className="text-xl font-bold text-white mb-5">সচরাচর জিজ্ঞাসা</h2>
              <div className="space-y-3">
                {FAQ.map((f, i) => (
                  <Accordion key={i} title={f.q}>
                    <p className="text-gray-300 text-sm leading-relaxed">{f.a}</p>
                  </Accordion>
                ))}
              </div>
            </div>
          </div>

          {/* Right — sticky purchase card */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 rounded-2xl border border-purple-800 overflow-hidden"
              style={{ background: "linear-gradient(135deg, #1a0533, #12032a)" }}>

              {/* Intro video thumbnail — click korle VideoModal khulbe */}
              <button
                onClick={() => openVideoModal(course.title, course.introVideo)}
                className="relative w-full h-36 flex items-center justify-center overflow-hidden border-b border-purple-900 group"
                style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(219,39,119,0.1))" }}
              >
                {course.image ? (
                  <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl group-hover:scale-110 transition-transform duration-300">
                    {course.emoji}
                  </span>
                )}
                {/* Play overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/0 group-hover:bg-black/40 transition-all duration-300">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/60 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
                    <FiPlay className="text-white ml-0.5" size={20} />
                  </div>
                  <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300">
                    Preview this course
                  </span>
                </div>
              </button>

              <div className="p-6">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-white font-extrabold text-3xl">৳{course.price.toLocaleString()}</span>
                  {course.originalPrice > course.price && (
                    <span className="text-gray-500 line-through text-base">৳{course.originalPrice.toLocaleString()}</span>
                  )}
                </div>
                {discountPct > 0 && (
                  <p className="text-green-400 text-sm font-semibold mb-5">{discountPct}% ছাড়, সীমিত সময়ের জন্য</p>
                )}

                {/* Coupon code field */}
                <form onSubmit={applyCoupon} className="flex gap-2 mb-5">
                  <div className="flex-1 flex items-center gap-2 bg-gray-900 border border-purple-900 rounded-xl px-3">
                    <FiTag className="text-purple-400 shrink-0" size={14} />
                    <input value={coupon} onChange={(e) => { setCoupon(e.target.value); setCouponMsg(null); }}
                      placeholder="কুপন কোড থাকলে দাও"
                      className="w-full bg-transparent text-white placeholder-gray-500 text-sm py-2.5 focus:outline-none" />
                  </div>
                  <button type="submit"
                    className="px-4 rounded-xl text-sm font-semibold bg-purple-700 hover:bg-purple-600 text-white transition-colors shrink-0">
                    Apply
                  </button>
                </form>
                {couponMsg && (
                  <p className={`text-xs mb-4 -mt-2 ${couponMsg.ok ? "text-green-400" : "text-red-400"}`}>{couponMsg.text}</p>
                )}

                <button type="button"
                  className="w-full flex items-center justify-center gap-2 border-2 border-purple-500 text-purple-200 font-bold px-6 py-3.5 rounded-xl text-base hover:bg-purple-500/10 transition-colors mb-3">
                  <FiShoppingCart size={16} /> Add to Cart
                </button>
                <Link to="/enroll"
                  className="w-full block text-center font-extrabold px-6 py-3.5 rounded-xl text-white text-base transition-all hover:scale-[1.02] mb-3"
                  style={{ background: "linear-gradient(90deg, #7c3aed, #db2777)" }}>
                  Enroll Now
                </Link>

                {/* This course includes */}
                <div className="mt-6 pt-6 border-t border-purple-900">
                  <p className="text-gray-400 text-xs font-semibold mb-3 uppercase tracking-wide">This course includes</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                      <FiPlay className="text-cyan-400 shrink-0" size={16} /> {course.hours} ঘণ্টা ভিডিও
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                      <FiRepeat className="text-cyan-400 shrink-0" size={16} /> লাইফটাইম অ্যাক্সেস
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                      <FiSmartphone className="text-cyan-400 shrink-0" size={16} /> মোবাইল ও ডেস্কটপে অ্যাক্সেস
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                      <FiAward className="text-cyan-400 shrink-0" size={16} /> কোর্স শেষে সার্টিফিকেট
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                      <FiShield className="text-cyan-400 shrink-0" size={16} /> ৩০ দিনের মানি-ব্যাক গ্যারান্টি
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default CourseSingleDetails;
