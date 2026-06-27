import { useEffect, useRef, useState } from "react";
import { FiStar, FiThumbsUp, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import api from "../../../utils/api";

// ── FALLBACKS ─────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  heading: "শিক্ষার্থীরা কী বলছে?",
  avgRating: 4.8,
  totalReviews: "১২,৪৮০",
  displayStyle: "grid-slider",
  autoSlideMs: 3000,
  ratingBars: [
    { star: 5, pct: 78 }, { star: 4, pct: 15 },
    { star: 3, pct: 5  }, { star: 2, pct: 1  }, { star: 1, pct: 1 },
  ],
};

const DEFAULT_REVIEWS = [
  { _id: "r1", name: "রাহিম উদ্দিন",  role: "Junior Developer @ TechCorp",  avatarSeed: "rahim",  rating: 5, text: "এই কোর্সটা আমার জীবন বদলে দিয়েছে। ৬ মাসে জব পেয়েছি।" },
  { _id: "r2", name: "ফাতেমা খাতুন", role: "Freelancer @ Upwork",            avatarSeed: "fatema", rating: 5, text: "আমি গৃহিণী ছিলাম, কোডিং জানতাম না। এখন মাসে ৫০k+ ইনকাম করি।" },
  { _id: "r3", name: "করিম হোসেন",   role: "Full Stack Dev @ StartupBD",    avatarSeed: "karim",  rating: 5, text: "Projects গুলো এত real-world যে job interview তে কাজে লেগেছে।" },
  { _id: "r4", name: "নাফিসা আক্তার",role: "React Developer @ RemoteJob",   avatarSeed: "nafisa", rating: 5, text: "বিদেশ থেকে remote job পেয়েছি এই কোর্সের পরে।" },
  { _id: "r5", name: "সজীব আহমেদ",   role: "Software Engineer @ BJIT",      avatarSeed: "sajib",  rating: 4, text: "Curriculum অনেক comprehensive। Node.js ও React একসাথে শিখতে পেরেছি।" },
  { _id: "r6", name: "মারিয়া বেগম",  role: "Frontend Dev @ Agency",         avatarSeed: "maria",  rating: 5, text: "মেয়ে হিসেবে tech এ আসতে ভয় ছিল। এই community আমাকে confident করেছে।" },
];

// ── Stars ─────────────────────────────────────────────────────────────────
const Stars = ({ rating, large }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <FiStar
        key={s}
        size={large ? 20 : 13}
        className="text-yellow-400"
        style={{ fill: s <= Math.round(rating) ? "#facc15" : "none" }}
      />
    ))}
  </div>
);

// ── Rating summary block (shared) ─────────────────────────────────────────
const RatingSummary = ({ settings, compact }) => (
  <div className={compact ? "" : "max-w-sm mx-auto mb-10"}>
    <div className={`flex items-center gap-3 mb-${compact ? "4" : "6"} ${compact ? "" : "justify-center"}`}>
      <Stars rating={settings.avgRating} large />
      <span className="text-yellow-400 font-bold text-xl">{settings.avgRating}</span>
      <span className="text-gray-400 text-sm">({settings.totalReviews} রিভিউ)</span>
    </div>
    <div className="space-y-2">
      {(settings.ratingBars || []).map((r) => (
        <div key={r.star} className="flex items-center gap-3 text-xs">
          <span className="text-gray-400 w-3">{r.star}</span>
          <FiStar size={11} className="text-yellow-400" style={{ fill: "#facc15" }} />
          <div className="flex-1 rounded-full h-2" style={{ background: "#1a0533" }}>
            <div className="h-2 rounded-full transition-all" style={{ width: `${r.pct}%`, background: "#facc15" }} />
          </div>
          <span className="text-gray-500 w-6">{r.pct}%</span>
        </div>
      ))}
    </div>
  </div>
);

// ── Review Card ───────────────────────────────────────────────────────────
const ReviewCard = ({ review, full }) => (
  <div
    className={`rounded-2xl p-5 border border-purple-800 flex flex-col ${full ? "h-full" : ""}`}
    style={{ background: "linear-gradient(135deg, #1a0533, #0d011f)" }}
  >
    <div className="flex items-start gap-3 mb-3">
      <img
        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.avatarSeed || review.name}`}
        className="w-10 h-10 rounded-full shrink-0"
        style={{ background: "#2d0a5e" }}
        alt={review.name}
      />
      <div>
        <p className="text-white font-semibold text-sm">{review.name}</p>
        <p className="text-purple-400 text-xs">{review.role}</p>
      </div>
    </div>
    <Stars rating={review.rating} />
    <p className="text-gray-300 text-sm mt-3 leading-relaxed flex-1">"{review.text}"</p>
    <button className="flex items-center gap-1.5 text-gray-600 hover:text-gray-400 text-xs mt-4 transition-colors">
      <FiThumbsUp size={11} /> Helpful
    </button>
  </div>
);

// ── Design 1: Grid Slider — heading+stars top, 3-card auto-slider ─────────
const GridSlider = ({ settings, reviews }) => {
  const [current, setCurrent] = useState(0);
  const total = reviews.length;
  const timerRef = useRef(null);

  const visibleCount = Math.min(3, total);

  const next = () => setCurrent((c) => (c + 1) % total);
  const prev = () => setCurrent((c) => (c - 1 + total) % total);

  const resetTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(next, settings.autoSlideMs || 3000);
  };

  useEffect(() => {
    if (total <= visibleCount) return;
    timerRef.current = setInterval(next, settings.autoSlideMs || 3000);
    return () => clearInterval(timerRef.current);
  }, [total, settings.autoSlideMs]);

  const getVisible = () => {
    if (total === 0) return [];
    return Array.from({ length: visibleCount }, (_, i) => reviews[(current + i) % total]);
  };

  return (
    <div>
      {/* Heading + rating */}
      <h2 className="text-2xl md:text-3xl font-extrabold text-white text-center mb-3">
        {settings.heading}
      </h2>
      <RatingSummary settings={settings} />

      {/* 3-card slider */}
      <div className="relative">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {getVisible().map((r, i) => (
            <div key={r._id + i} className="animate-fadeIn">
              <ReviewCard review={r} full />
            </div>
          ))}
        </div>

        {/* Controls */}
        {total > visibleCount && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button onClick={() => { prev(); resetTimer(); }}
              className="w-10 h-10 rounded-full border border-purple-700 flex items-center justify-center text-purple-300 hover:bg-purple-700/30 transition-colors">
              <FiChevronLeft size={18} />
            </button>
            <div className="flex gap-2">
              {reviews.map((_, i) => (
                <button key={i} onClick={() => { setCurrent(i); resetTimer(); }}
                  className={`h-2 rounded-full transition-all duration-300 ${i === current ? "bg-purple-400 w-5" : "bg-purple-800 hover:bg-purple-600 w-2"}`} />
              ))}
            </div>
            <button onClick={() => { next(); resetTimer(); }}
              className="w-10 h-10 rounded-full border border-purple-700 flex items-center justify-center text-purple-300 hover:bg-purple-700/30 transition-colors">
              <FiChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Design 2: Side Slider — heading+stars LEFT, 1-card slider RIGHT ───────
const SideSlider = ({ settings, reviews }) => {
  const [current, setCurrent] = useState(0);
  const total = reviews.length;
  const timerRef = useRef(null);

  const next = () => setCurrent((c) => (c + 1) % total);
  const prev = () => setCurrent((c) => (c - 1 + total) % total);

  const resetTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(next, settings.autoSlideMs || 3000);
  };

  useEffect(() => {
    if (total <= 1) return;
    timerRef.current = setInterval(next, settings.autoSlideMs || 3000);
    return () => clearInterval(timerRef.current);
  }, [total, settings.autoSlideMs]);

  return (
    <div className="grid lg:grid-cols-2 gap-12 items-center">
      {/* Left — heading + rating summary */}
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-6">
          {settings.heading}
        </h2>
        <RatingSummary settings={settings} compact />
      </div>

      {/* Right — single card auto-slider */}
      <div>
        {total > 0 && (
          <div className="relative">
            <ReviewCard review={reviews[current]} full />

            {/* Controls */}
            {total > 1 && (
              <div className="flex items-center justify-between mt-5">
                <div className="flex gap-2">
                  {reviews.map((_, i) => (
                    <button key={i} onClick={() => { setCurrent(i); resetTimer(); }}
                      className={`h-2 rounded-full transition-all duration-300 ${i === current ? "bg-purple-400 w-5" : "bg-purple-800 hover:bg-purple-600 w-2"}`} />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { prev(); resetTimer(); }}
                    className="w-9 h-9 rounded-full border border-purple-700 flex items-center justify-center text-purple-300 hover:bg-purple-700/30 transition-colors">
                    <FiChevronLeft size={16} />
                  </button>
                  <button onClick={() => { next(); resetTimer(); }}
                    className="w-9 h-9 rounded-full border border-purple-700 flex items-center justify-center text-purple-300 hover:bg-purple-700/30 transition-colors">
                    <FiChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────
// Home page testimonials — merges TWO sources together:
//   1) Global CourseReview (admin-curated, platform-wide testimonials —
//      managed via AdminCourseReviews.jsx, GET /course-reviews)
//   2) Every course's real, admin-approved StudentCourseReview entries
//      (GET /student-reviews/active-all — across ALL courses, not just one)
// Unlike the single-course details page (which prioritizes real student
// reviews and only falls back to admin-curated ones when there are none),
// this Home section always shows BOTH together for a broader social-proof mix.
const CourseReviewsSection = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [reviews,  setReviews]  = useState(DEFAULT_REVIEWS);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/course-reviews"),
      api.get("/student-reviews/active-all").catch(() => ({ data: [] })),
    ]).then(([globalRes, studentRes]) => {
      setSettings(globalRes.data.settings || DEFAULT_SETTINGS);

      const globalReviews  = globalRes.data.reviews || [];
      const studentReviews = (studentRes.data || []).map((r) => ({
        _id:        r._id,
        name:       r.name || "Anonymous",
        role:       r.course?.title ? `Student · ${r.course.title}` : "Student",
        avatarSeed: r.name || "guest",
        rating:     r.rating || 5,
        text:       r.text || "",
      }));

      const merged = [...studentReviews, ...globalReviews];
      setReviews(merged.length ? merged : DEFAULT_REVIEWS);
    }).catch(() => {
      setSettings(DEFAULT_SETTINGS);
      setReviews(DEFAULT_REVIEWS);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <section style={{ background: "#120326" }} className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-800/40 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : settings.displayStyle === "side-slider" ? (
          <SideSlider settings={settings} reviews={reviews} />
        ) : (
          <GridSlider settings={settings} reviews={reviews} />
        )}
      </div>
    </section>
  );
};

export default CourseReviewsSection;
