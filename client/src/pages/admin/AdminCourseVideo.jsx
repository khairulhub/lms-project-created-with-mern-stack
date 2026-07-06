import { useEffect, useRef, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { FiSave, FiUploadCloud, FiTrash2, FiYoutube, FiFilm } from "react-icons/fi";

const inputClass = "w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors";
const labelClass = "block text-xs font-medium text-gray-400 mb-1";

const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB — must match server/config/upload.js (Cloudinary free-tier video cap)
const SERVER_ORIGIN = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");

// Cloudinary uploads store a full absolute URL already (https://res.cloudinary.com/...).
// Only pre-migration uploads (saved as a relative "/uploads/videos/..." path)
// need the server origin prefixed.
const resolveVideoSrc = (uploadedVideoPath) =>
  /^https?:\/\//.test(uploadedVideoPath || "") ? uploadedVideoPath : `${SERVER_ORIGIN}${uploadedVideoPath}`;

const formatBytes = (bytes) => {
  if (!bytes) return "0 MB";
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const AdminCourseVideo = () => {
  const [categories, setCategories] = useState([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [activeCatId, setActiveCatId] = useState(null);

  const [section, setSection] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setCatsLoading(true);
    api.get("/admin/categories")
      .then((res) => {
        setCategories(res.data);
        if (res.data.length > 0) setActiveCatId(res.data[0]._id);
      })
      .catch(() => toast.error("Categories load korte parlam na"))
      .finally(() => setCatsLoading(false));
  }, []);

  const fetchData = (catId) => {
    if (!catId) return;
    setDataLoading(true);
    api.get(`/admin/course-video/${catId}`)
      .then((res) => setSection(res.data.section))
      .catch(() => toast.error("Video section load korte parlam na"))
      .finally(() => setDataLoading(false));
  };

  useEffect(() => { fetchData(activeCatId); }, [activeCatId]);

  const activeCategory = categories.find((c) => c._id === activeCatId);
  const setField = (key, value) => setSection((s) => ({ ...s, [key]: value }));

  // ── Save heading / subtitle / YouTube URL ────────────────────────────────
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/admin/course-video/${activeCatId}`, {
        heading: section.heading,
        subtitle: section.subtitle,
        videoType: section.videoType,
        videoUrl: section.videoUrl,
      });
      setSection(res.data);
      toast.success("Video section saved!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  };

  // ── Upload a video file ──────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Video file select koro (mp4, webm, mov, mkv)");
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      toast.error(`File ${formatBytes(file.size)} — max 200MB allowed.`);
      return;
    }

    const formData = new FormData();
    formData.append("video", file);

    setUploading(true);
    setUploadProgress(0);

    api.post(`/admin/course-video/${activeCatId}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (evt) => {
        if (evt.total) setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
      },
    })
      .then((res) => {
        setSection(res.data);
        toast.success("Video upload হয়েছে!");
      })
      .catch((err) => toast.error(err.response?.data?.message || "Upload failed"))
      .finally(() => {
        setUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
      });
  };

  const handleRemoveUpload = async () => {
    if (!window.confirm("Uploaded video delete korbe? Public page-e YouTube video dekhabe (jodi URL set kora ase).")) return;
    try {
      const res = await api.delete(`/admin/course-video/${activeCatId}/upload`);
      setSection(res.data);
      toast.success("Uploaded video removed");
    } catch { toast.error("Delete failed"); }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Video Section</h2>
        <p className="text-gray-400 text-sm">
          "কোর্সের একটু আভাস নাও" section — প্রতিটা category-র জন্য আলাদা। YouTube link দিতে পারো, বা নিজের video file upload করতে পারো (max 200MB)।
        </p>
      </div>

      {/* ════════════ CATEGORY TABS ════════════ */}
      {catsLoading ? (
        <div className="flex gap-2 mb-6">
          {[...Array(3)].map((_, i) => <div key={i} className="h-10 w-32 bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-800 pb-4">
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setActiveCatId(cat._id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activeCatId === cat._id ? "bg-cyan-500 text-gray-950" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>
      )}

      {activeCatId && (
        dataLoading ? (
          <div className="h-72 bg-gray-800 rounded-xl animate-pulse" />
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
            <h3 className="text-white font-semibold text-lg">
              {activeCategory?.icon} {activeCategory?.name} — Video Settings
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Heading</label>
                <input value={section?.heading || ""} onChange={(e) => setField("heading", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Subtitle</label>
                <input value={section?.subtitle || ""} onChange={(e) => setField("subtitle", e.target.value)} className={inputClass} />
              </div>
            </div>

            {/* ── Current source indicator ── */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Current source:</span>
              {section?.videoType === "upload" && section?.uploadedVideoPath ? (
                <span className="flex items-center gap-1.5 text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full text-xs font-medium">
                  <FiFilm size={12} /> Uploaded file ({formatBytes(section.uploadedVideoSize)})
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full text-xs font-medium">
                  <FiYoutube size={12} /> YouTube embed
                </span>
              )}
            </div>

            {/* ── YouTube URL ── */}
            <div>
              <label className={labelClass}>YouTube Embed URL</label>
              <input value={section?.videoUrl || ""} onChange={(e) => setField("videoUrl", e.target.value)}
                placeholder="https://www.youtube.com/embed/VIDEO_ID" className={inputClass} />
              <p className="text-gray-600 text-xs mt-1">Save korle ei URL active hobe (jodi kono uploaded video na thake, othoba videoType "youtube" set thake)।</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setField("videoType", "youtube")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${section?.videoType === "youtube" ? "bg-cyan-500 text-gray-950" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
              >
                Use YouTube
              </button>
              {section?.uploadedVideoPath && (
                <button
                  onClick={() => setField("videoType", "upload")}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${section?.videoType === "upload" ? "bg-cyan-500 text-gray-950" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
                >
                  Use Uploaded File
                </button>
              )}
              <button onClick={handleSaveSettings} disabled={saving}
                className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-gray-950 font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors ml-auto">
                <FiSave size={15} /> {saving ? "Saving..." : "Save"}
              </button>
            </div>

            {/* ── File upload ── */}
            <div className="border-t border-gray-800 pt-5">
              <label className={labelClass}>Upload Video File (max 100MB — mp4, webm, mov, mkv)</label>

              {section?.uploadedVideoPath && (
                <div className="mb-3 rounded-xl overflow-hidden border border-gray-800" style={{ aspectRatio: "16/9", maxWidth: 480 }}>
                  <video src={resolveVideoSrc(section.uploadedVideoPath)} controls className="w-full h-full" />
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-matroska"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="hidden"
                  id="video-upload-input"
                />
                <label htmlFor="video-upload-input"
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors ${uploading ? "bg-gray-800 text-gray-500" : "bg-cyan-500 hover:bg-cyan-400 text-gray-950"}`}>
                  <FiUploadCloud size={15} /> {uploading ? "Uploading..." : "Choose Video File"}
                </label>

                {section?.uploadedVideoPath && !uploading && (
                  <button onClick={handleRemoveUpload}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-800 hover:bg-red-500/10 text-gray-300 hover:text-red-400 transition-colors">
                    <FiTrash2 size={15} /> Remove Uploaded Video
                  </button>
                )}
              </div>

              {uploading && (
                <div className="mt-3">
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-2 bg-cyan-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="text-gray-500 text-xs mt-1">{uploadProgress}% uploaded — boro file hole ektu shomoy lagte pare।</p>
                </div>
              )}

              {section?.uploadedVideoName && (
                <p className="text-gray-600 text-xs mt-2">Current file: {section.uploadedVideoName}</p>
              )}
            </div>
          </div>
        )
      )}
    </DashboardLayout>
  );
};

export default AdminCourseVideo;
