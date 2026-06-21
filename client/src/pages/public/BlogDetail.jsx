import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../../utils/api";
import PublicLayout from "../../components/layout/PublicLayout";
import { FiCalendar, FiUser, FiTag, FiArrowLeft } from "react-icons/fi";

const BlogDetail = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get(`/blogs/${slug}`)
      .then((r) => setBlog(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-4">
        <div className="h-8 bg-gray-800 rounded animate-pulse w-3/4" />
        <div className="h-64 bg-gray-800 rounded-xl animate-pulse" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-4 bg-gray-800 rounded animate-pulse" />)}
        </div>
      </div>
    </PublicLayout>
  );

  if (error || !blog) return (
    <PublicLayout>
      <div className="text-center py-32 text-gray-400">
        <p className="text-6xl mb-4">📄</p>
        <h2 className="text-2xl font-bold text-white mb-2">Blog Not Found</h2>
        <Link to="/blogs" className="text-cyan-400 hover:text-cyan-300">← Back to Blogs</Link>
      </div>
    </PublicLayout>
  );

  return (
    <PublicLayout>
      <article className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/blogs" className="inline-flex items-center gap-2 text-gray-400 hover:text-cyan-400 text-sm mb-8 transition-colors">
          <FiArrowLeft size={14} /> Back to Blogs
        </Link>

        {blog.category && (
          <span className="inline-block text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full mb-4">
            {blog.category.icon} {blog.category.name}
          </span>
        )}

        <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-4">{blog.title}</h1>

        {blog.excerpt && <p className="text-gray-400 text-lg mb-6 leading-relaxed">{blog.excerpt}</p>}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <img
              src={blog.author?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${blog.author?.email}`}
              className="w-7 h-7 rounded-full bg-gray-700"
              alt={blog.author?.name}
            />
            <span>{blog.author?.name}</span>
            {blog.author?.designation && <span className="text-gray-600">· {blog.author.designation}</span>}
          </div>
          <span className="flex items-center gap-1">
            <FiCalendar size={13} />
            {new Date(blog.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>

        {/* Cover Image */}
        {blog.coverImage && (
          <img src={blog.coverImage} alt={blog.title} className="w-full h-64 md:h-80 object-cover rounded-xl mb-8" />
        )}

        {/* Content */}
        <div
          className="prose prose-invert prose-cyan max-w-none text-gray-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* Tags */}
        {blog.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-8 border-t border-gray-800">
            <FiTag className="text-gray-500 mt-0.5" />
            {blog.tags.map((tag) => (
              <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full">#{tag}</span>
            ))}
          </div>
        )}
      </article>
    </PublicLayout>
  );
};

export default BlogDetail;
