import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiStar, FiUsers, FiClock, FiGrid, FiList, FiSearch, FiHeart } from "react-icons/fi";
import api from "../../utils/api";
import PublicLayout from "../../components/layout/PublicLayout";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

// ── Course Card — List style (Featured single card) ───────────────────────
const ListCard = ({ course, onView, wished, onToggleWish }) => (
  <div className="bg-gray-900 border border-gray-800 hover:border-cyan-500/30 rounded-2xl overflow-hidden transition-all group relative">
    {onToggleWish && (
      <button
        onClick={(e) => { e.stopPropagation(); onToggleWish(course._id); }}
        title={wished ? "Wishlist থেকে সরাও" : "Wishlist এ save করো"}
        className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      >
        <FiHeart size={16} style={{ color: wished ? "#f87171" : "#e5e7eb", fill: wished ? "#f87171" : "none" }} />
      </button>
    )}
    <div className="md:flex">
      {/* Left thumb */}
      <div className="md:w-64 bg-gradient-to-br from-cyan-500/20 to-purple-600/20 flex items-center justify-center p-10 min-h-44 shrink-0 overflow-hidden">
        {course.image ? (
          <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center">
            <div className="text-6xl mb-3">{course.emoji}</div>
            {course.badge && (
              <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                {course.badge}
              </span>
            )}
          </div>
        )}
      </div>
      {/* Right info */}
      <div className="flex-1 p-6">
        {course.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {course.tags.map((t) => (
              <span key={t} className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-medium px-3 py-1 rounded-full">
                {t}
              </span>
            ))}
          </div>
        )}
        <h3 className="text-white font-extrabold text-xl mb-2 group-hover:text-cyan-400 transition-colors">
          {course.title}
        </h3>
        <p className="text-gray-400 text-sm mb-4 leading-relaxed">{course.description}</p>
        <div className="flex flex-wrap items-center gap-4 text-sm mb-5">
          <span className="text-yellow-400 font-bold flex items-center gap-1">
            <FiStar size={13} style={{ fill: "#facc15" }} /> {course.rating}
          </span>
          <span className="text-gray-400 flex items-center gap-1"><FiUsers size={13} /> {course.students} students</span>
          <span className="text-gray-400 flex items-center gap-1"><FiClock size={13} /> {course.hours} hours</span>
        </div>
        <div className="flex items-center gap-4">
          <div>
            <span className="text-white font-extrabold text-2xl">৳{course.price?.toLocaleString()}</span>
            {course.originalPrice > course.price && (
              <span className="text-gray-500 line-through text-sm ml-2">৳{course.originalPrice?.toLocaleString()}</span>
            )}
          </div>
          <button
            onClick={() => onView(course)}
            className="bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-6 py-2.5 rounded-xl transition-all hover:scale-105 text-sm"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ── Course Card — Grid style ───────────────────────────────────────────────
const GridCard = ({ course, onView, wished, onToggleWish }) => (
  <div className="bg-gray-900 border border-gray-800 hover:border-cyan-500/30 rounded-2xl overflow-hidden transition-all group flex flex-col relative">
    {onToggleWish && (
      <button
        onClick={(e) => { e.stopPropagation(); onToggleWish(course._id); }}
        title={wished ? "Wishlist থেকে সরাও" : "Wishlist এ save করো"}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      >
        <FiHeart size={14} style={{ color: wished ? "#f87171" : "#e5e7eb", fill: wished ? "#f87171" : "none" }} />
      </button>
    )}
    <div className="bg-gradient-to-br from-cyan-500/20 to-purple-600/20 flex items-center justify-center py-10 overflow-hidden">
      {course.image ? (
        <img src={course.image} alt={course.title} className="w-full h-32 object-cover" />
      ) : (
        <div className="text-center">
          <div className="text-5xl mb-2">{course.emoji}</div>
          {course.badge && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
              {course.badge}
            </span>
          )}
        </div>
      )}
    </div>
    <div className="p-5 flex flex-col flex-1">
      {course.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {course.tags.slice(0, 2).map((t) => (
            <span key={t} className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs px-2 py-0.5 rounded-full">{t}</span>
          ))}
        </div>
      )}
      <h3 className="text-white font-bold text-sm mb-2 group-hover:text-cyan-400 transition-colors line-clamp-2 flex-1">
        {course.title}
      </h3>
      <p className="text-gray-500 text-xs mb-3 line-clamp-2">{course.description}</p>
      <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
        <span className="text-yellow-400 font-bold flex items-center gap-0.5">
          <FiStar size={11} style={{ fill: "#facc15" }} /> {course.rating}
        </span>
        <span className="flex items-center gap-0.5"><FiUsers size={11} /> {course.students}</span>
        <span className="flex items-center gap-0.5"><FiClock size={11} /> {course.hours}h</span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-white font-extrabold text-lg">৳{course.price?.toLocaleString()}</span>
          {course.originalPrice > course.price && (
            <span className="text-gray-600 line-through text-xs ml-1">৳{course.originalPrice?.toLocaleString()}</span>
          )}
        </div>
        <button
          onClick={() => onView(course)}
          className="bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-4 py-2 rounded-xl transition-all text-xs"
        >
          View Details
        </button>
      </div>
    </div>
  </div>
);

// ── Main Categories Page ───────────────────────────────────────────────────
const Categories = () => {
  const { user } = useAuth();
  const [categories,   setCategories]   = useState([]);
  const [courses,      setCourses]      = useState([]);
  const [activeCat,    setActiveCat]    = useState(null);   // selected category object
  const [viewMode,     setViewMode]     = useState("list"); // "list" | "grid"
  const [loadingCats,  setLoadingCats]  = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [totalCourseCount, setTotalCourseCount] = useState(0); // search bar 5+ course thakle e dekhabo
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const navigate = useNavigate();

  // Load categories
  useEffect(() => {
    api.get("/categories")
      .then((r) => {
        setCategories(r.data);
        if (r.data.length > 0) setActiveCat(r.data[0]);
      })
      .finally(() => setLoadingCats(false));
  }, []);

  // Platform-e total koyta course ache — search bar dekhabo naki na, ei
  // decision-er jonno ekbar-e count niye newa (category filter chhara)
  useEffect(() => {
    api.get("/courses").then((r) => setTotalCourseCount(r.data?.length || 0)).catch(() => {});
  }, []);

  // Student login thakle nijer wishlist id gulo load kori (heart-fill state)
  useEffect(() => {
    if (!user) { setWishlistIds(new Set()); return; }
    api.get("/wishlist/ids").then((r) => setWishlistIds(new Set(r.data || []))).catch(() => {});
  }, [user]);

  // Load courses when active category or search changes (search 350ms debounce)
  useEffect(() => {
    if (!activeCat) return;
    setLoadingCourses(true);
    const handle = setTimeout(() => {
      const params = new URLSearchParams({ category: activeCat.slug });
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      api.get(`/courses?${params.toString()}`)
        .then((r) => {
          setCourses(r.data);
          if (r.data.length > 0) setViewMode(r.data[0].displayStyle || "list");
        })
        .catch(() => setCourses([]))
        .finally(() => setLoadingCourses(false));
    }, searchQuery ? 350 : 0);
    return () => clearTimeout(handle);
  }, [activeCat, searchQuery]);

  const handleToggleWish = (courseId) => {
    if (!user) {
      toast.error("Wishlist এ save করতে হলে আগে Login করো।");
      return;
    }
    const willWish = !wishlistIds.has(courseId);
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (willWish) next.add(courseId); else next.delete(courseId);
      return next;
    });
    api.post("/wishlist/toggle", { courseId }).catch(() => {
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (willWish) next.delete(courseId); else next.add(courseId);
        return next;
      });
      toast.error("Wishlist আপডেট করতে সমস্যা হয়েছে।");
    });
  };

  const handleView = (course) => {
    // Each course card -> its own details page (design-only stage; that
    // page currently shows static/dummy content — DB connect hobe pore).
    navigate(`/courses/${course._id}`);
  };

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 py-12">

        {/* Page header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Courses</h1>
          <p className="text-gray-400">Category অনুযায়ী কোর্স ব্রাউজ করো</p>
        </div>

        {/* Search — শুধু ৫টার বেশি কোর্স থাকলেই দেখাবে, কম কোর্সে খোঁজার দরকার নেই */}
        {totalCourseCount > 5 && (
          <div className="relative mb-8 max-w-md">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="কোর্স খুঁজো... (নাম বা বিষয়)"
              className="w-full bg-gray-900 border border-gray-800 text-white placeholder-gray-500 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        )}

        {loadingCats ? (
          <div className="flex gap-3 mb-8">
            {[...Array(4)].map((_, i) => <div key={i} className="h-10 w-28 bg-gray-800 rounded-full animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* Category tabs */}
            <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => setActiveCat(cat)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                    activeCat?._id === cat._id
                      ? "bg-cyan-500 text-gray-950"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700"
                  }`}
                >
                  <span>{cat.icon}</span> {cat.name}
                </button>
              ))}
            </div>

            {/* Courses section */}
            <div>
              {/* Header row: course count + view toggle */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-white font-bold text-lg">{activeCat?.name}</h2>
                  <p className="text-gray-500 text-sm">
                    {loadingCourses ? "Loading..." : `${courses.length} টি কোর্স`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2.5 rounded-xl transition-colors ${viewMode === "list" ? "bg-cyan-500 text-gray-950" : "bg-gray-800 text-gray-400 hover:text-white"}`}
                  >
                    <FiList size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2.5 rounded-xl transition-colors ${viewMode === "grid" ? "bg-cyan-500 text-gray-950" : "bg-gray-800 text-gray-400 hover:text-white"}`}
                  >
                    <FiGrid size={16} />
                  </button>
                </div>
              </div>

              {loadingCourses ? (
                <div className={viewMode === "grid" ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-5" : "space-y-5"}>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-48 bg-gray-800/50 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <div className="text-5xl mb-4">📭</div>
                  <p>এই category-তে এখনো কোনো কোর্স নেই।</p>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {courses.map((c) => <GridCard key={c._id} course={c} onView={handleView} wished={wishlistIds.has(c._id)} onToggleWish={handleToggleWish} />)}
                </div>
              ) : (
                <div className="space-y-5">
                  {courses.map((c) => <ListCard key={c._id} course={c} onView={handleView} wished={wishlistIds.has(c._id)} onToggleWish={handleToggleWish} />)}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </PublicLayout>
  );
};

export default Categories;
