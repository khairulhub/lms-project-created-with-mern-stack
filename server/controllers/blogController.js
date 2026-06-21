const asyncHandler = require("express-async-handler");
const Blog = require("../models/Blog");

const slugify = (text) =>
  text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "") +
  "-" + Date.now();

// GET /api/blogs — public, published only
const getPublishedBlogs = asyncHandler(async (req, res) => {
  const { category, limit = 10, page = 1 } = req.query;
  const filter = { isPublished: true };
  if (category) filter.category = category;

  const total = await Blog.countDocuments(filter);
  const blogs = await Blog.find(filter)
    .populate("author", "name profileImage designation")
    .populate("category", "name slug icon")
    .sort({ publishedAt: -1 })
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit));

  res.json({ blogs, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// GET /api/blogs/:slug — public single blog
const getBlogBySlug = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug, isPublished: true })
    .populate("author", "name profileImage designation bio")
    .populate("category", "name slug");
  if (!blog) return res.status(404).json({ message: "Blog not found" });
  res.json(blog);
});

// GET /api/admin/blogs — all blogs (admin sees all, instructor sees own)
const getAllBlogs = asyncHandler(async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { author: req.user._id };
  const blogs = await Blog.find(filter)
    .populate("author", "name email")
    .populate("category", "name")
    .sort({ createdAt: -1 });
  res.json(blogs);
});

// POST /api/admin/blogs
const createBlog = asyncHandler(async (req, res) => {
  const { title, excerpt, content, coverImage, category, tags, isPublished } = req.body;
  if (!title || !content || !category) {
    return res.status(400).json({ message: "Title, content and category required" });
  }

  const blog = await Blog.create({
    title,
    slug: slugify(title),
    excerpt: excerpt || "",
    content,
    coverImage: coverImage || "",
    category,
    author: req.user._id,
    tags: tags || [],
    isPublished: isPublished || false,
    publishedAt: isPublished ? new Date() : null,
  });
  res.status(201).json(blog);
});

// PUT /api/admin/blogs/:id
const updateBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).json({ message: "Blog not found" });

  // Instructor can only edit own blogs
  if (req.user.role === "instructor" && blog.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not authorized" });
  }

  const { title, excerpt, content, coverImage, category, tags, isPublished } = req.body;
  if (title) blog.title = title;
  if (excerpt !== undefined) blog.excerpt = excerpt;
  if (content) blog.content = content;
  if (coverImage !== undefined) blog.coverImage = coverImage;
  if (category) blog.category = category;
  if (tags) blog.tags = tags;
  if (isPublished !== undefined) {
    blog.isPublished = isPublished;
    if (isPublished && !blog.publishedAt) blog.publishedAt = new Date();
  }

  const updated = await blog.save();
  res.json(updated);
});

// DELETE /api/admin/blogs/:id
const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).json({ message: "Blog not found" });

  if (req.user.role === "instructor" && blog.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not authorized" });
  }

  await blog.deleteOne();
  res.json({ message: "Blog deleted" });
});

module.exports = { getPublishedBlogs, getBlogBySlug, getAllBlogs, createBlog, updateBlog, deleteBlog };
