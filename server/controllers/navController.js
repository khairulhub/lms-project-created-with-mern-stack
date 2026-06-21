const asyncHandler = require("express-async-handler");
const NavMenu = require("../models/NavMenu");
const SiteConfig = require("../models/SiteConfig");

// ── NAV MENU ─────────────────────────────────────────────────────────────────

// GET /api/nav/menus — public, active menus ordered
const getMenus = asyncHandler(async (req, res) => {
  const menus = await NavMenu.find({ isActive: true }).sort({ order: 1 });
  res.json(menus);
});

// GET /api/admin/nav/menus — all menus including inactive
const getAllMenus = asyncHandler(async (req, res) => {
  const menus = await NavMenu.find({}).sort({ order: 1 });
  res.json(menus);
});

// POST /api/admin/nav/menus — create new menu item
const createMenu = asyncHandler(async (req, res) => {
  const { label, path, order, isActive, openInNewTab } = req.body;
  if (!label || !path) return res.status(400).json({ message: "Label and path required" });

  // Auto order — put at end
  const lastMenu = await NavMenu.findOne().sort({ order: -1 });
  const nextOrder = order ?? (lastMenu ? lastMenu.order + 1 : 0);

  const menu = await NavMenu.create({
    label, path,
    order: nextOrder,
    isActive: isActive ?? true,
    openInNewTab: openInNewTab ?? false,
    isDefault: false,
  });
  res.status(201).json(menu);
});

// PUT /api/admin/nav/menus/:id — update menu item
const updateMenu = asyncHandler(async (req, res) => {
  const menu = await NavMenu.findById(req.params.id);
  if (!menu) return res.status(404).json({ message: "Menu not found" });

  const { label, path, order, isActive, openInNewTab } = req.body;
  if (label) menu.label = label;
  if (path) menu.path = path;
  if (order !== undefined) menu.order = order;
  if (isActive !== undefined) menu.isActive = isActive;
  if (openInNewTab !== undefined) menu.openInNewTab = openInNewTab;

  const updated = await menu.save();
  res.json(updated);
});

// PUT /api/admin/nav/menus/reorder — bulk reorder
const reorderMenus = asyncHandler(async (req, res) => {
  // req.body.items = [{ _id, order }, ...]
  const { items } = req.body;
  await Promise.all(
    items.map((item) => NavMenu.findByIdAndUpdate(item._id, { order: item.order }))
  );
  res.json({ message: "Reordered" });
});

// DELETE /api/admin/nav/menus/:id
const deleteMenu = asyncHandler(async (req, res) => {
  const menu = await NavMenu.findById(req.params.id);
  if (!menu) return res.status(404).json({ message: "Menu not found" });
  if (menu.isDefault) return res.status(400).json({ message: "Cannot delete default menu items" });
  await menu.deleteOne();
  res.json({ message: "Menu deleted" });
});

// ── SITE CONFIG ───────────────────────────────────────────────────────────────

// GET /api/nav/config — public
const getSiteConfig = asyncHandler(async (req, res) => {
  let config = await SiteConfig.findOne();
  if (!config) config = await SiteConfig.create({});
  res.json(config);
});

// PUT /api/admin/nav/config — admin update logo, site name etc
const updateSiteConfig = asyncHandler(async (req, res) => {
  let config = await SiteConfig.findOne();
  if (!config) config = await SiteConfig.create({});

  const { siteName, logoUrl, logoText, enrollUrl, showLogoImage } = req.body;
  if (siteName !== undefined) config.siteName = siteName;
  if (logoUrl !== undefined) config.logoUrl = logoUrl;
  if (logoText !== undefined) config.logoText = logoText;
  if (enrollUrl !== undefined) config.enrollUrl = enrollUrl;
  if (showLogoImage !== undefined) config.showLogoImage = showLogoImage;

  const updated = await config.save();
  res.json(updated);
});

module.exports = {
  getMenus, getAllMenus, createMenu, updateMenu, reorderMenus, deleteMenu,
  getSiteConfig, updateSiteConfig,
};
