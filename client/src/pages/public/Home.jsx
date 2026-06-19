import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";
import PublicLayout from "../../components/layout/PublicLayout";
import { FiArrowRight, FiCalendar, FiUser } from "react-icons/fi";

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingBlogs, setLoadingBlogs] = useState(true);

  useEffect(() => {
    api.get("/categories").then((r) => { setCategories(r.data); setLoadingCats(false); }).catch(() => setLoadingCats(false));
    api.get("/blogs?limit=6").then((r) => { setBlogs(r.data.blogs); setLoadingBlogs(false); }).catch(() => setLoadingBlogs(false));
  }, []);

  return (
    <PublicLayout>
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-3xl" />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            Full Stack MERN Starter Template
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6">
            Build Faster with
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              MERN Starter
            </span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            A production-ready MERN stack template with Firebase Auth, role-based dashboards (Admin / Instructor / User), and a full blog & category system.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-8 py-4 rounded-xl transition-all hover:scale-105 text-base"
            >
              Get Started Free
            </Link>
            <Link
              to="/blogs"
              className="border border-gray-700 hover:border-gray-500 text-white font-medium px-8 py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-base"
            >
              Read Blogs <FiArrowRight />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-16 max-w-lg mx-auto">
            {[
              { label: "Roles", value: "3" },
              { label: "Tech Stack", value: "MERN" },
              { label: "Auth", value: "Firebase" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold text-cyan-400">{s.value}</div>
                <div className="text-gray-500 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ────────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Browse Categories</h2>
            <p className="text-gray-400">Explore content by topic</p>
          </div>

          {loadingCats ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-28 bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  to={`/categories/${cat.slug}`}
                  className="group bg-gray-900 border border-gray-800 hover:border-cyan-500/40 rounded-xl p-5 text-center transition-all hover:bg-gray-800/60"
                >
                  <div className="text-4xl mb-3">{cat.icon}</div>
                  <div className="text-white font-semibold text-sm group-hover:text-cyan-400 transition-colors">{cat.name}</div>
                  {cat.description && (
                    <div className="text-gray-500 text-xs mt-1 line-clamp-2">{cat.description}</div>
                  )}
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Link to="/categories" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium flex items-center gap-1 justify-center">
              View all categories <FiArrowRight size={14} />
            </Link>
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

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-gray-400 mb-8">Create your free account and explore the platform</p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold px-10 py-4 rounded-xl transition-all hover:scale-105 text-base"
          >
            Create Free Account <FiArrowRight />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Home;
