import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";
import PublicLayout from "../../components/layout/PublicLayout";
import {
  FiArrowRight, FiCalendar, FiUser,
  FiChevronDown, FiChevronUp, FiStar,
  FiPlay, FiThumbsUp,
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
  const [blogs, setBlogs] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
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
    api.get("/blogs?limit=6").then((r) => { setBlogs(r.data.blogs); setLoadingBlogs(false); }).catch(() => setLoadingBlogs(false));
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


 

      {/* ── FEATURED COURSE ───────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-900/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Our Flagship Course</h2>
            <p className="text-gray-400">Everything you need to become a full stack developer</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 hover:border-cyan-500/30 rounded-2xl overflow-hidden transition-all group max-w-4xl mx-auto">
            <div className="md:flex">
              {/* Left thumb */}
              <div className="md:w-80 bg-gradient-to-br from-cyan-500/20 to-purple-600/20 flex items-center justify-center p-10 min-h-48">
                <div className="text-center">
                  <div className="text-6xl mb-3">🚀</div>
                  <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">HOT</span>
                </div>
              </div>
              {/* Right info */}
              <div className="flex-1 p-6 md:p-8">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-medium px-3 py-1 rounded-full">🔥 Bestseller</span>
                  <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-medium px-3 py-1 rounded-full">Full Stack</span>
                </div>
                <h3 className="text-white font-extrabold text-xl mb-2 group-hover:text-cyan-400 transition-colors">
                  Complete Web Development Course
                </h3>
                <p className="text-gray-400 text-sm mb-4">HTML, CSS, JavaScript, React, Node.js, MongoDB — from zero to full stack hero</p>
                <div className="flex flex-wrap items-center gap-4 text-sm mb-5">
                  <span className="text-yellow-400 font-bold">⭐ 4.8</span>
                  <span className="text-gray-400">32,500 students</span>
                  <span className="text-gray-400">60+ hours</span>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-white font-extrabold text-2xl">৳4,500</span>
                    <span className="text-gray-500 line-through text-sm ml-2">৳12,000</span>
                  </div>
                  <a href="#course-top"
                    className="bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-6 py-2.5 rounded-xl transition-all hover:scale-105 text-sm">
                    View Details
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      

      {/* ── LATEST BLOGS ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-900/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Latest Blogs</h2>
            <p className="text-gray-400">Stay updated with the latest articles</p>
          </div>

          {loadingBlogs ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-72 bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : blogs.length === 0 ? (
            <p className="text-center text-gray-500">No blogs published yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <Link
                  key={blog._id}
                  to={`/blogs/${blog.slug}`}
                  className="group bg-gray-900 border border-gray-800 hover:border-cyan-500/30 rounded-xl overflow-hidden transition-all hover:-translate-y-1"
                >
                  {blog.coverImage && (
                    <img src={blog.coverImage} alt={blog.title} className="w-full h-44 object-cover" />
                  )}
                  <div className="p-5">
                    {blog.category && (
                      <span className="text-xs text-cyan-400 font-medium bg-cyan-500/10 px-2 py-1 rounded-full">
                        {blog.category.icon} {blog.category.name}
                      </span>
                    )}
                    <h3 className="text-white font-bold text-base mt-3 mb-2 line-clamp-2 group-hover:text-cyan-400 transition-colors">
                      {blog.title}
                    </h3>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4">{blog.excerpt}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <FiUser size={11} /> {blog.author?.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiCalendar size={11} />
                        {new Date(blog.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link to="/blogs" className="inline-flex items-center gap-2 border border-gray-700 hover:border-cyan-500/40 text-gray-300 hover:text-cyan-400 px-6 py-3 rounded-xl transition-all text-sm font-medium">
              View all posts <FiArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

   
    </PublicLayout>
  );
};

export default Home;
