import { useEffect, useState } from "react";
import api from "../../utils/api";
import PublicLayout from "../../components/layout/PublicLayout";
import {
  FiChevronDown, FiChevronUp, FiStar,
} from "react-icons/fi";
import CourseHeroSection from "./CourseDetails/CourseHeroSection";
import CoursePaymentSection from "./CourseDetails/CoursePaymentSection";
import Category from "./CourseDetails/Category";
import CourseHighlightsSection from "./CourseDetails/CourseHighlightsSection";
import CourseVideoSection from "./CourseDetails/CourseVideoSection";
import CourseWhatYouLearnSection from "./CourseDetails/CourseWhatYouLearnSection";
import CourseCurriculumSection from "./CourseDetails/CourseCurriculumSection";
import CourseProjectsSection from "./CourseDetails/CourseProjectsSection";
import CourseCareerSection from "./CourseDetails/CourseCareerSection";
import CourseReviewsSection from "./CourseDetails/CourseReviewsSection";
import CourseFAQSection from "./CourseDetails/CourseFAQSection";
import CourseCTASection from "./CourseDetails/CourseCTASection";

// ═══════════════════════════════════════════════════════════════════════════
// Shared small components (used by the Course sections below)
// ═══════════════════════════════════════════════════════════════════════════
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

// COURSE SECTION 8 — SUPPORT
// ════════════════════════════════════════════════════════════════
const CourseSupportSection = () => (
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


const Home = () => {
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  // Which category's Highlights section is currently shown. Defaults to
  // "mern-stack" (the existing/default data); if that category doesn't
  // exist for some reason, falls back to the first category once loaded.
  const [selectedCategorySlug, setSelectedCategorySlug] = useState("mern-stack");

  useEffect(() => {
    api.get("/categories").then((r) => {
      setCategories(r.data);
      setLoadingCats(false);
      const hasDefault = r.data.some((c) => c.slug === "mern-stack");
      if (!hasDefault && r.data.length > 0) setSelectedCategorySlug(r.data[0].slug);
    }).catch(() => setLoadingCats(false));
  }, []);

  return (
    <PublicLayout>
      {/* ══════════════════════════════════════════════════════════════
          COURSE DETAILS CONTENT — shown first on the home page
         ══════════════════════════════════════════════════════════════ */}
      <CourseHeroSection />
      <CoursePaymentSection />
      <Category
        loadingCats={loadingCats}
        categories={categories}
        selectedSlug={selectedCategorySlug}
        onSelect={setSelectedCategorySlug}
      />
      <CourseHighlightsSection categorySlug={selectedCategorySlug} />
      <CourseVideoSection categorySlug={selectedCategorySlug} />
      <CourseWhatYouLearnSection categorySlug={selectedCategorySlug} />
      <CourseCurriculumSection categorySlug={selectedCategorySlug} />
      <CourseProjectsSection />
      <CourseSupportSection />
      <CourseCareerSection />
      <CourseReviewsSection />
      <CourseFAQSection />
      <CourseCTASection />
    </PublicLayout>
  );
};

export default Home;
