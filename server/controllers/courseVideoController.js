const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const CourseVideoSection = require("../models/CourseVideoSection");
const Category = require("../models/Category");
const cloudinary = require("../config/cloudinary");

const resolveCategory = async (slugOrId) => {
  let cat = null;
  if (mongoose.Types.ObjectId.isValid(slugOrId)) cat = await Category.findById(slugOrId);
  if (!cat) cat = await Category.findOne({ slug: slugOrId });
  return cat;
};

// Delete the old uploaded video from Cloudinary (best-effort — never throws,
// just logs, so an already-deleted/missing asset never blocks the request).
const deleteOldVideoAsset = (publicId) => {
  if (!publicId) return;
  cloudinary.uploader.destroy(publicId, { resource_type: "video" }, (err) => {
    if (err) console.error("Could not delete old Cloudinary video:", err.message);
  });
};

// GET /api/course-video/:categorySlug — public
const getCourseVideo = asyncHandler(async (req, res) => {
  const cat = await resolveCategory(req.params.categorySlug);
  if (!cat) return res.status(404).json({ message: "Category not found" });

  let section = await CourseVideoSection.findOne({ category: cat._id });
  if (!section) section = await CourseVideoSection.create({ category: cat._id });

  res.json({ category: { _id: cat._id, name: cat.name, slug: cat.slug, icon: cat.icon }, section });
});

// GET /api/admin/course-video/:categoryId — admin
const getAdminCourseVideo = asyncHandler(async (req, res) => {
  const cat = await resolveCategory(req.params.categoryId);
  if (!cat) return res.status(404).json({ message: "Category not found" });

  let section = await CourseVideoSection.findOne({ category: cat._id });
  if (!section) section = await CourseVideoSection.create({ category: cat._id });

  res.json({ category: { _id: cat._id, name: cat.name, slug: cat.slug, icon: cat.icon }, section });
});

// PUT /api/admin/course-video/:categoryId — admin updates heading/subtitle + YouTube URL
// (does NOT touch uploaded-file fields — that's handled by the dedicated upload endpoint)
const updateCourseVideo = asyncHandler(async (req, res) => {
  const cat = await resolveCategory(req.params.categoryId);
  if (!cat) return res.status(404).json({ message: "Category not found" });

  let section = await CourseVideoSection.findOne({ category: cat._id });
  if (!section) section = await CourseVideoSection.create({ category: cat._id });

  const { heading, subtitle, videoType, videoUrl } = req.body;
  if (heading !== undefined) section.heading = heading;
  if (subtitle !== undefined) section.subtitle = subtitle;
  if (videoType !== undefined) section.videoType = videoType;
  if (videoUrl !== undefined) section.videoUrl = videoUrl;

  const updated = await section.save();
  res.json(updated);
});

// POST /api/admin/course-video/:categoryId/upload — admin uploads a video file
// (multer-storage-cloudinary middleware on the route already streamed the
// file straight to Cloudinary and validated size/mimetype by the time this
// handler runs; req.file holds the Cloudinary response)
const uploadCourseVideo = asyncHandler(async (req, res) => {
  const cat = await resolveCategory(req.params.categoryId);
  if (!cat) return res.status(404).json({ message: "Category not found" });
  if (!req.file) return res.status(400).json({ message: "Video file required" });

  let section = await CourseVideoSection.findOne({ category: cat._id });
  if (!section) section = await CourseVideoSection.create({ category: cat._id });

  // Clean up the previous Cloudinary asset (if any) before pointing to the new one
  if (section.uploadedVideoPublicId) deleteOldVideoAsset(section.uploadedVideoPublicId);

  section.videoType = "upload";
  // req.file.path = full Cloudinary URL (https://res.cloudinary.com/...)
  // req.file.filename = Cloudinary public_id, needed later to delete the asset
  section.uploadedVideoPath = req.file.path;
  section.uploadedVideoPublicId = req.file.filename;
  section.uploadedVideoName = req.file.originalname;
  section.uploadedVideoSize = req.file.size;

  const updated = await section.save();
  res.json(updated);
});

// DELETE /api/admin/course-video/:categoryId/upload — admin removes the uploaded video
// (switches videoType back to "youtube" so the public page doesn't break)
const deleteCourseVideoUpload = asyncHandler(async (req, res) => {
  const cat = await resolveCategory(req.params.categoryId);
  if (!cat) return res.status(404).json({ message: "Category not found" });

  const section = await CourseVideoSection.findOne({ category: cat._id });
  if (!section) return res.status(404).json({ message: "Video section not found" });

  if (section.uploadedVideoPublicId) deleteOldVideoAsset(section.uploadedVideoPublicId);

  section.uploadedVideoPath = "";
  section.uploadedVideoPublicId = "";
  section.uploadedVideoName = "";
  section.uploadedVideoSize = 0;
  section.videoType = "youtube";

  const updated = await section.save();
  res.json(updated);
});

module.exports = {
  getCourseVideo, getAdminCourseVideo, updateCourseVideo,
  uploadCourseVideo, deleteCourseVideoUpload,
};
