import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../utils/api";
import PublicLayout from "../../components/layout/PublicLayout";
import { FiCalendar, FiUser, FiSearch } from "react-icons/fi";

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");

  const currentCat = searchParams.get("category") || "";
  const currentPage = Number(searchParams.get("page") || 1);

  useEffect(() => {
    api.get("/categories").then((r) => setCategories(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: currentPage, limit: 9 });
    if (currentCat) params.append("category", currentCat);
    api.get(`/blogs?${params}`)
      .then((r) => { setBlogs(r.data.blogs); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  }, [currentCat, currentPage]);

  const totalPages = Math.ceil(total / 9);

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">All Blogs</h1>
          <p className="text-gray-400">{total} articles published</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSearchParams({})}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!currentCat ? "bg-cyan-500 text-gray-950" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSearchParams({ category: cat._id })}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${currentCat === cat._id ? "bg-cyan-500 text-gray-950" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Blog Grid */}
        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="h-72 bg-gray-800 rounded-xl animate-pulse" />)}
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-24 text-gray-500">No blogs found.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <Link key={blog._id} to={`/blogs/${blog.slug}`}
                className="group bg-gray-900 border border-gray-800 hover:border-cyan-500/30 rounded-xl overflow-hidden transition-all hover:-translate-y-1">
                {blog.coverImage && <img src={blog.coverImage} alt={blog.title} className="w-full h-44 object-cover" />}
                <div className="p-5">
                  {blog.category && (
                    <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-full">
                      {blog.category.icon} {blog.category.name}
                    </span>
                  )}
                  <h3 className="text-white font-bold text-base mt-3 mb-2 line-clamp-2 group-hover:text-cyan-400 transition-colors">{blog.title}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2 mb-4">{blog.excerpt}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><FiUser size={11} /> {blog.author?.name}</span>
                    <span className="flex items-center gap-1"><FiCalendar size={11} />
                      {new Date(blog.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {[...Array(totalPages)].map((_, i) => (
              <button key={i}
                onClick={() => setSearchParams({ page: i + 1, ...(currentCat && { category: currentCat }) })}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1 ? "bg-cyan-500 text-gray-950" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
              >{i + 1}</button>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
};

export default Blogs;
