import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";
import PublicLayout from "../../components/layout/PublicLayout";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/categories").then((r) => setCategories(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">Categories</h1>
          <p className="text-gray-400">Browse content by topic</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="h-36 bg-gray-800 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link key={cat._id} to={`/blogs?category=${cat._id}`}
                className="group bg-gray-900 border border-gray-800 hover:border-cyan-500/40 rounded-xl p-6 text-center transition-all hover:bg-gray-800/60 hover:-translate-y-1">
                <div className="text-5xl mb-4">{cat.icon}</div>
                <div className="text-white font-bold text-sm mb-1 group-hover:text-cyan-400 transition-colors">{cat.name}</div>
                {cat.description && <p className="text-gray-500 text-xs line-clamp-2">{cat.description}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
};

export default Categories;
