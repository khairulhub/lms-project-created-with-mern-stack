import { useState } from "react";
import { Link } from "react-router-dom";
import PublicLayout from "../../components/layout/PublicLayout";
import CourseHeroSection from "./CourseDetails/CourseHeroSection";
import CoursePaymentSection from "./CourseDetails/CoursePaymentSection";
import {
  FiCheck, FiChevronDown, FiChevronUp, FiStar,
  FiPlay, FiThumbsUp,
} from "react-icons/fi";

// ─── Stars ───────────────────────────────────────────────────────────────────
const Stars = ({ rating, large = false }) => (
  <span className="inline-flex gap-0.5">
    {[1,2,3,4,5].map(n => (
      <FiStar key={n} size={large ? 18 : 13}
        className={n <= Math.round(rating) ? "text-yellow-400" : "text-gray-600"}
        style={n <= Math.round(rating) ? { fill: "#facc15" } : {}}
      />
    ))}
  </span>
);

// ─── Accordion ───────────────────────────────────────────────────────────────
const Accordion = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-purple-900 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
        style={{ background: open ? "#220a40" : "#1a0533" }}
      >
        <span className="text-white font-semibold text-sm pr-4">{title}</span>
        {open
          ? <FiChevronUp className="text-purple-400 shrink-0" />
          : <FiChevronDown className="text-purple-400 shrink-0" />
        }
      </button>
      {open && (
        <div className="px-5 py-4" style={{ background: "#12032a" }}>
          {children}
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// SECTION 1 — HERO (now imported from ./CourseDetails/CourseHeroSection,
// fetches its own data from /api/course-hero — admin-editable)
// ════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════
// SECTION 2 — PAYMENT BAR (now imported from
// ./CourseDetails/CoursePaymentSection, fetches its own data from
// /api/course-payment/settings + /api/course-payment/methods —
// admin-editable from Admin → Course Details → Payment Method)
// ════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════
// SECTION 3 — HIGHLIGHTS
// ════════════════════════════════════════════════════════════════
const HighlightsSection = () => (
  <section style={{ background: "#0d011f" }} className="py-16 px-4">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-extrabold text-white text-center mb-3">
        এই কোর্সে তুমি কী পাবে?
      </h2>
      <p className="text-gray-400 text-center text-sm mb-10">
        একটাই কোর্সে সবকিছু — শেখা, প্র্যাকটিস, প্রজেক্ট এবং ক্যারিয়ার সাপোর্ট
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { emoji: "🤖", title: "AI-Powered Learning", desc: "AI tools দিয়ে faster এবং smarter ভাবে কোড শেখো" },
          { emoji: "📋", title: "Structured Path", desc: "Week-by-week structured curriculum তোমাকে গাইড করবে" },
          { emoji: "🌐", title: "Full Stack Skills", desc: "Frontend থেকে Backend — সব কিছু এক জায়গায়" },
          { emoji: "💼", title: "Job Ready", desc: "ইন্টারভিউ প্রেপ, CV রিভিউ এবং জব সাপোর্ট" },
        ].map(item => (
          <div key={item.title}
            className="rounded-2xl p-5 border border-purple-800 hover:border-purple-500 transition-all group"
            style={{ background: "linear-gradient(135deg, #1a0533, #120326)" }}>
            <div className="text-4xl mb-3">{item.emoji}</div>
            <h3 className="text-white font-bold text-sm mb-2 group-hover:text-purple-300 transition-colors">{item.title}</h3>
            <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Tech tags */}
      <div className="text-center">
        <p className="text-gray-500 text-xs mb-4">যা যা শিখবে:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {["HTML", "CSS", "Tailwind", "JavaScript", "React", "Node.js", "Express", "MongoDB", "Firebase", "Git", "REST API", "JWT"].map(t => (
            <span key={t} className="border border-purple-800 text-purple-200 text-xs font-medium px-3 py-1.5 rounded-full"
              style={{ background: "#1a0533" }}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  </section>
);

// ════════════════════════════════════════════════════════════════
// SECTION 4 — VIDEO
// ════════════════════════════════════════════════════════════════
const VideoSection = () => (
  <section style={{ background: "#120326" }} className="py-16 px-4">
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-extrabold text-white text-center mb-3">
        কোর্সের একটু আভাস নাও
      </h2>
      <p className="text-gray-400 text-center text-sm mb-8">ফ্রি প্রিভিউতে দেখো আমরা কীভাবে পড়াই</p>
      <div className="relative w-full rounded-2xl overflow-hidden border border-purple-800" style={{ aspectRatio: "16/9", background: "#0d011f" }}>
        <iframe
          src="https://www.youtube.com/embed/zAbT_zvSaM4"
          title="Course Preview"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  </section>
);

// ════════════════════════════════════════════════════════════════
// SECTION 5 — WHAT YOU'LL LEARN
// ════════════════════════════════════════════════════════════════
const WhatYouLearnSection = () => (
  <section style={{ background: "#0d011f" }} className="py-16 px-4">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-extrabold text-white text-center mb-3">
        কী কী শিখবে এই কোর্সে?
      </h2>
      <p className="text-gray-400 text-center text-sm mb-10">
        শেষ করলে তুমি একজন দক্ষ Full Stack Developer হয়ে যাবে
      </p>
      <div className="rounded-2xl border border-purple-800 p-8"
        style={{ background: "linear-gradient(135deg, #1a0533, #120326)" }}>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            "HTML5 ও CSS3 দিয়ে সুন্দর ওয়েবসাইট বানানো",
            "Tailwind CSS দিয়ে Responsive Design",
            "JavaScript ES6+ এর সব আধুনিক ফিচার",
            "React.js দিয়ে Dynamic UI তৈরি",
            "React Router, Context API, Hooks",
            "Node.js ও Express দিয়ে REST API",
            "MongoDB ও Mongoose দিয়ে Database",
            "Firebase Authentication সেটআপ",
            "JWT দিয়ে Secure Login System",
            "Git ও GitHub ব্যবহার",
            "Vercel ও Netlify তে Deploy করা",
            "Interview Preparation ও DSA Basics",
          ].map((t, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)" }}>
                <FiCheck size={11} className="text-green-400" />
              </div>
              <span className="text-gray-300 text-sm leading-relaxed">{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

// ════════════════════════════════════════════════════════════════
// SECTION 6 — CURRICULUM
// ════════════════════════════════════════════════════════════════
const CurriculumSection = () => {
  const modules = [
    { week: "Week 1-2", title: "HTML & CSS Foundation", lessons: 18, duration: "6h 30m",
      topics: ["HTML5 Semantic Elements", "CSS Box Model ও Flexbox", "CSS Grid Layout", "Responsive Design", "Tailwind CSS Basics", "Mini Project: Portfolio Page"] },
    { week: "Week 3-5", title: "JavaScript Essentials", lessons: 24, duration: "9h 15m",
      topics: ["Variables, Functions, Scope", "Arrays ও Objects", "DOM Manipulation", "Events ও Event Listeners", "ES6+: Arrow Functions, Destructuring", "Promises, Async/Await, Fetch API"] },
    { week: "Week 6-9", title: "React.js Deep Dive", lessons: 30, duration: "13h 40m",
      topics: ["React Fundamentals ও JSX", "Components, Props, State", "useState, useEffect, useContext", "React Router v6", "Form Handling", "Project: E-commerce App"] },
    { week: "Week 10-12", title: "Backend — Node.js & Express", lessons: 22, duration: "9h 20m",
      topics: ["Node.js Basics ও NPM", "Express Framework", "REST API Design", "Middleware", "JWT Authentication", "File Upload"] },
    { week: "Week 13-14", title: "Database — MongoDB", lessons: 16, duration: "6h 45m",
      topics: ["MongoDB Atlas Setup", "CRUD Operations", "Mongoose Schema", "Relationships", "Aggregation Pipeline"] },
    { week: "Week 15-16", title: "Final Project ও Job Prep", lessons: 14, duration: "7h 00m",
      topics: ["Full Stack MERN Project", "GitHub Portfolio", "Resume Building", "Interview Prep", "Freelancing Tips", "Job Application Guide"] },
  ];

  const totalLessons = modules.reduce((a, m) => a + m.lessons, 0);

  return (
    <section style={{ background: "#120326" }} className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white text-center mb-2">
          কোর্সের সিলেবাস
        </h2>
        <p className="text-gray-400 text-center text-sm mb-10">
          {totalLessons} টি লেসন · {modules.length} টি মডিউল · ১৬ সপ্তাহ
        </p>
        <div className="space-y-3">
          {modules.map((m, i) => (
            <Accordion key={i}
              title={`${m.week} — ${m.title}  (${m.lessons} লেসন · ${m.duration})`}
              defaultOpen={i === 0}>
              <div className="grid sm:grid-cols-2 gap-3">
                {m.topics.map((topic, j) => (
                  <div key={j} className="flex items-center gap-2.5 text-sm text-gray-300">
                    <FiPlay size={11} className="text-purple-400 shrink-0" />
                    {topic}
                  </div>
                ))}
              </div>
            </Accordion>
          ))}
        </div>
      </div>
    </section>
  );
};

// ════════════════════════════════════════════════════════════════
// SECTION 7 — PROJECTS
// ════════════════════════════════════════════════════════════════
const ProjectsSection = () => (
  <section style={{ background: "#0d011f" }} className="py-16 px-4">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-extrabold text-white text-center mb-3">
        বাস্তব প্রজেক্ট বানাবে
      </h2>
      <p className="text-gray-400 text-center text-sm mb-10">
        শুধু থিওরি না — ৪টি real-world project যা portfolio তে রাখতে পারবে
      </p>
      <div className="grid sm:grid-cols-2 gap-5">
        {[
          { emoji: "🛒", title: "E-Commerce Platform", tech: ["React", "Node.js", "MongoDB"], desc: "পূর্ণ ফিচারযুক্ত ই-কমার্স অ্যাপ — product listing, cart, payment, admin panel" },
          { emoji: "📚", title: "LMS Platform", tech: ["React", "Firebase", "Express"], desc: "Course management system, video player, quiz system সহ" },
          { emoji: "💬", title: "Real-time Chat App", tech: ["Socket.io", "React", "Node"], desc: "Real-time messaging, group chat, online status" },
          { emoji: "🏠", title: "Property Listing Site", tech: ["React", "MongoDB", "JWT"], desc: "Property search, filter, booking এবং review system" },
        ].map(p => (
          <div key={p.title}
            className="rounded-2xl p-6 border border-purple-800 hover:border-purple-500 transition-all group"
            style={{ background: "linear-gradient(135deg, #1a0533, #120326)" }}>
            <div className="text-4xl mb-4">{p.emoji}</div>
            <h3 className="text-white font-bold text-base mb-2 group-hover:text-purple-300 transition-colors">{p.title}</h3>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed">{p.desc}</p>
            <div className="flex flex-wrap gap-2">
              {p.tech.map(t => (
                <span key={t} className="text-purple-300 text-xs px-2.5 py-1 rounded-full border border-purple-700"
                  style={{ background: "rgba(124,58,237,0.15)" }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ════════════════════════════════════════════════════════════════
// SECTION 8 — SUPPORT
// ════════════════════════════════════════════════════════════════
const SupportSection = () => (
  <section style={{ background: "#120326" }} className="py-16 px-4">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-extrabold text-white text-center mb-3">
        তুমি একা না — আমরা আছি পাশে
      </h2>
      <p className="text-gray-400 text-center text-sm mb-10">
        শেখার পথে যেকোনো সমস্যায় তোমাকে সাহায্য করতে আমাদের টিম সবসময় প্রস্তুত
      </p>
      <div className="grid sm:grid-cols-3 gap-5">
        {[
          { emoji: "🧑‍🏫", title: "Mentor Support", desc: "Expert mentors তোমার সকল প্রশ্নের উত্তর দেবে। সপ্তাহে ৫ দিন লাইভ সেশন।" },
          { emoji: "👥", title: "Community Group", desc: "হাজারো শিক্ষার্থীদের নিয়ে গঠিত প্রাইভেট community group-এ যোগ দাও।" },
          { emoji: "🎯", title: "Conceptual Session", desc: "কঠিন বিষয় বুঝতে না পারলে বিশেষ conceptual session-এ অংশ নাও।" },
        ].map(s => (
          <div key={s.title}
            className="rounded-2xl p-6 text-center border border-purple-800 hover:border-purple-500 transition-all"
            style={{ background: "linear-gradient(135deg, #1a0533, #120326)" }}>
            <div className="text-5xl mb-4">{s.emoji}</div>
            <h3 className="text-white font-bold mb-2">{s.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ════════════════════════════════════════════════════════════════
// SECTION 9 — CAREER
// ════════════════════════════════════════════════════════════════
const CareerSection = () => (
  <section style={{ background: "#0d011f" }} className="py-16 px-4">
    <div className="max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-4">
            কোর্স শেষে তোমার ক্যারিয়ার 🚀
          </h2>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            আমাদের ৫০০+ গ্র্যাজুয়েট দেশে এবং বিদেশে সফলভাবে কাজ করছে।
            চাকরি, ফ্রিল্যান্সিং বা নিজের স্টার্টআপ — যেকোনো পথে প্রস্তুত করব।
          </p>
          <div className="space-y-3">
            {[
              "🏢 Top Tech Company তে জব পাওয়ার সুযোগ",
              "💻 Upwork, Fiverr এ Freelancing শুরু",
              "📁 শক্তিশালী GitHub Portfolio তৈরি",
              "📝 Professional CV ও LinkedIn Profile",
              "🎤 Mock Interview ও Job Referral সাপোর্ট",
            ].map((item, i) => (
              <p key={i} className="text-gray-300 text-sm">{item}</p>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { value: "৫০০+", label: "সফল গ্র্যাজুয়েট", from: "#7c3aed", to: "#6d28d9" },
            { value: "৮৫%", label: "জব পেয়েছে", from: "#db2777", to: "#be185d" },
            { value: "৩x", label: "স্যালারি বৃদ্ধি", from: "#4f46e5", to: "#4338ca" },
            { value: "৬০+", label: "হায়ারিং পার্টনার", from: "#0891b2", to: "#0e7490" },
          ].map(s => (
            <div key={s.label}
              className="rounded-2xl p-6 text-center"
              style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }}>
              <div className="text-3xl font-extrabold text-white mb-1">{s.value}</div>
              <div className="text-white text-xs opacity-80">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

// ════════════════════════════════════════════════════════════════
// SECTION 10 — REVIEWS
// ════════════════════════════════════════════════════════════════
const ReviewsSection = () => {
  const reviews = [
    { name: "রাহিম উদ্দিন", role: "Junior Developer @ TechCorp", seed: "rahim", rating: 5,
      text: "এই কোর্সটা আমার জীবন বদলে দিয়েছে। ৬ মাসে জব পেয়েছি। Jhankar ভাই এত ভালো পড়ান যে কঠিন বিষয়ও সহজ মনে হয়!" },
    { name: "ফাতেমা খাতুন", role: "Freelancer @ Upwork", seed: "fatema", rating: 5,
      text: "আমি গৃহিণী ছিলাম, কোডিং জানতাম না। এখন মাসে ৫০k+ ইনকাম করি। এই কোর্স সত্যিকারের জীবন পরিবর্তন করে।" },
    { name: "করিম হোসেন", role: "Full Stack Dev @ StartupBD", seed: "karim", rating: 5,
      text: "Projects গুলো এত real-world যে job interview তে সরাসরি কাজে লেগেছে। Community support অসাধারণ!" },
    { name: "নাফিসা আক্তার", role: "React Developer @ RemoteJob", seed: "nafisa", rating: 5,
      text: "বিদেশ থেকে remote job পেয়েছি এই কোর্সের পরে। Mentor support ছাড়া এত দূর আসতে পারতাম না।" },
    { name: "সজীব আহমেদ", role: "Software Engineer @ BJIT", seed: "sajib", rating: 4,
      text: "Curriculum অনেক comprehensive। Node.js ও React একসাথে শিখতে পেরেছি যা অনেক জায়গায় আলাদা করে শেখায়।" },
    { name: "মারিয়া বেগম", role: "Frontend Dev @ Agency", seed: "maria", rating: 5,
      text: "মেয়ে হিসেবে tech এ আসতে ভয় ছিল। এই community আমাকে confident করেছে। ধন্যবাদ Programming Hero!" },
  ];

  return (
    <section style={{ background: "#120326" }} className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white text-center mb-3">
          শিক্ষার্থীরা কী বলছে?
        </h2>
        <div className="flex items-center justify-center gap-3 mb-10">
          <Stars rating={4.8} large />
          <span className="text-yellow-400 font-bold text-xl">৪.৮</span>
          <span className="text-gray-400 text-sm">(১২,৪৮০ রিভিউ)</span>
        </div>

        {/* Rating bars */}
        <div className="max-w-sm mx-auto mb-10">
          {[
            { star: 5, pct: 78 },
            { star: 4, pct: 15 },
            { star: 3, pct: 5 },
            { star: 2, pct: 1 },
            { star: 1, pct: 1 },
          ].map(r => (
            <div key={r.star} className="flex items-center gap-3 text-xs mb-2">
              <span className="text-gray-400 w-3">{r.star}</span>
              <FiStar size={11} className="text-yellow-400" style={{ fill: "#facc15" }} />
              <div className="flex-1 rounded-full h-2" style={{ background: "#1a0533" }}>
                <div className="h-2 rounded-full" style={{ width: `${r.pct}%`, background: "#facc15" }} />
              </div>
              <span className="text-gray-500 w-6">{r.pct}%</span>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map((r, i) => (
            <div key={i} className="rounded-2xl p-5 border border-purple-800"
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
          ))}
        </div>
      </div>
    </section>
  );
};

// ════════════════════════════════════════════════════════════════
// SECTION 11 — FAQ
// ════════════════════════════════════════════════════════════════
const FAQSection = () => (
  <section style={{ background: "#0d011f" }} className="py-16 px-4">
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-extrabold text-white text-center mb-3">
        সচরাচর জিজ্ঞাসা
      </h2>
      <p className="text-gray-400 text-center text-sm mb-10">
        তোমার মনে যা আসছে সেই প্রশ্নের উত্তর এখানে আছে
      </p>
      <div className="space-y-3">
        {[
          { q: "কোনো পূর্ব অভিজ্ঞতা ছাড়া কি এই কোর্স করা যাবে?", a: "হ্যাঁ! একদম শুরু থেকে শেখানো হয়। Computer চালাতে পারলেই যথেষ্ট।" },
          { q: "কোর্সটি কতদিনে শেষ করা যাবে?", a: "সাধারণত ১৬ সপ্তাহে শেষ হয়। তবে লাইফটাইম অ্যাক্সেস থাকায় নিজের গতিতে শিখতে পারবে।" },
          { q: "পেমেন্ট কীভাবে করব?", a: "bKash, Nagad, Rocket, ক্রেডিট/ডেবিট কার্ড বা ব্যাংক ট্রান্সফার — সব উপায়ে করা যাবে।" },
          { q: "Certificate কি দেওয়া হবে?", a: "হ্যাঁ, কোর্স সম্পন্ন করলে আন্তর্জাতিকভাবে স্বীকৃত Certificate পাবে।" },
          { q: "Job guarantee কি আছে?", a: "আমরা ১০০% job guarantee দিই না, তবে job support, mock interview এবং referral দিয়ে থাকি। ৮৫% গ্র্যাজুয়েট ৬ মাসের মধ্যে জব পেয়েছে।" },
          { q: "কোর্সের ভাষা কী?", a: "সম্পূর্ণ বাংলায় পড়ানো হয়। তবে code এবং technical terms ইংরেজিতে থাকে।" },
          { q: "মানি-ব্যাক গ্যারান্টি কি সত্যিই আছে?", a: "হ্যাঁ, ৩০ দিনের মধ্যে সন্তুষ্ট না হলে সম্পূর্ণ টাকা ফেরত — কোনো প্রশ্ন ছাড়াই।" },
        ].map((faq, i) => (
          <Accordion key={i} title={faq.q}>
            <p className="text-gray-300 text-sm leading-relaxed">{faq.a}</p>
          </Accordion>
        ))}
      </div>
    </div>
  </section>
);

// ════════════════════════════════════════════════════════════════
// SECTION 12 — FINAL CTA
// ════════════════════════════════════════════════════════════════
const CTASection = () => (
  <section className="py-16 px-4"
    style={{ background: "linear-gradient(135deg, #3b0764, #1a0533, #500724)" }}>
    <div className="max-w-3xl mx-auto text-center">
      <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
        আজই শুরু করো তোমার ক্যারিয়ার জার্নি 🚀
      </h2>
      <p className="text-purple-200 text-base mb-8 leading-relaxed">
        হাজারো শিক্ষার্থী ইতিমধ্যে শুরু করে ফেলেছে। তুমি কি পিছিয়ে থাকবে?
        আজই ভর্তি হও এবং ৩০ দিনের মানি-ব্যাক গ্যারান্টি উপভোগ করো।
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        <Link to="/enroll"
          className="bg-white hover:bg-gray-100 font-extrabold px-10 py-4 rounded-2xl transition-all hover:scale-105 text-lg"
          style={{ color: "#3b0764" }}>
          এখনই ভর্তি হও — ৳৪,৫০০
        </Link>
        <button className="flex items-center justify-center gap-2 text-white font-medium px-8 py-4 rounded-2xl transition-colors border-2"
          style={{ borderColor: "rgba(255,255,255,0.3)" }}>
          <FiPlay size={16} /> Free Demo দেখো
        </button>
      </div>
      <div className="flex flex-wrap justify-center gap-6 text-sm text-purple-300">
        <span>✅ ৩০ দিনের মানি-ব্যাক</span>
        <span>✅ লাইফটাইম অ্যাক্সেস</span>
        <span>✅ Certificate</span>
        <span>✅ Community Support</span>
      </div>
    </div>
  </section>
);

// ════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════
const CourseDetails = () => (
  <PublicLayout>
    <CourseHeroSection />
    <CoursePaymentSection />
    <HighlightsSection />
    <VideoSection />
    <WhatYouLearnSection />
    <CurriculumSection />
    <ProjectsSection />
    <SupportSection />
    <CareerSection />
    <ReviewsSection />
    <FAQSection />
    <CTASection />
  </PublicLayout>
);

export default CourseDetails;
