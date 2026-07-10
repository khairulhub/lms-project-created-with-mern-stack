const asyncHandler = require("express-async-handler");
const HelpdeskTicket = require("../models/HelpdeskTicket");

const POPULATE_USER = "name email role profileImage";

// ── STUDENT / USER ──────────────────────────────────────────────────────────

// POST /api/helpdesk/tickets — notun ticket khola
const createTicket = asyncHandler(async (req, res) => {
  const { subject, message, category, priority } = req.body;
  if (!subject?.trim()) return res.status(400).json({ message: "Subject required" });
  if (!message?.trim()) return res.status(400).json({ message: "Message required" });

  const ticket = await HelpdeskTicket.create({
    user: req.user._id,
    subject: subject.trim(),
    message: message.trim(),
    category: ["technical", "billing", "course", "account", "other"].includes(category) ? category : "other",
    priority: ["low", "normal", "high"].includes(priority) ? priority : "normal",
    lastReplyBy: "user",
    lastReplyAt: new Date(),
    lastSeenByUser: new Date(),
  });

  res.status(201).json(await ticket.populate("user", POPULATE_USER));
});

// GET /api/helpdesk/tickets/my — nijer shob ticket
const getMyTickets = asyncHandler(async (req, res) => {
  const tickets = await HelpdeskTicket.find({ user: req.user._id })
    .select("-replies") // list view-e full thread lagbe na
    .sort({ lastReplyAt: -1 });
  res.json(tickets);
});

// GET /api/helpdesk/tickets/:id — nijer ekta ticket (full thread soho), dekhle lastSeenByUser update hoy
const getMyTicketById = asyncHandler(async (req, res) => {
  const ticket = await HelpdeskTicket.findOne({ _id: req.params.id, user: req.user._id })
    .populate("user", POPULATE_USER)
    .populate("replies.sender", POPULATE_USER);
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  ticket.lastSeenByUser = new Date();
  await ticket.save();

  res.json(ticket);
});

// POST /api/helpdesk/tickets/:id/reply — student thread-e reply dey (closed hole allowed na)
const replyToTicket = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ message: "Message required" });

  const ticket = await HelpdeskTicket.findOne({ _id: req.params.id, user: req.user._id });
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });
  if (ticket.status === "closed")
    return res.status(400).json({ message: "This ticket is closed. Please open a new one." });

  ticket.replies.push({ sender: req.user._id, senderRole: "user", message: message.trim() });
  ticket.lastReplyBy = "user";
  ticket.lastReplyAt = new Date();
  ticket.lastSeenByUser = new Date();
  // Student reply dile ticket abar "open" e chole ashe, jodi age resolved thake
  if (ticket.status === "resolved") ticket.status = "open";
  await ticket.save();

  res.json(await ticket.populate([
    { path: "user", select: POPULATE_USER },
    { path: "replies.sender", select: POPULATE_USER },
  ]));
});

// PUT /api/helpdesk/tickets/:id/close — student nijer ticket close korte pare
const closeMyTicket = asyncHandler(async (req, res) => {
  const ticket = await HelpdeskTicket.findOne({ _id: req.params.id, user: req.user._id });
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });
  ticket.status = "closed";
  await ticket.save();
  res.json({ message: "Ticket closed" });
});

// GET /api/helpdesk/tickets/unread-count — sidebar badge: admin/instructor reply dise, student dekhe nai emon count
const getMyUnreadCount = asyncHandler(async (req, res) => {
  const count = await HelpdeskTicket.countDocuments({
    user: req.user._id,
    status: { $ne: "closed" },
    lastReplyBy: { $ne: "user" },
    $expr: { $gt: ["$lastReplyAt", "$lastSeenByUser"] },
  });
  res.json({ count });
});

// ── ADMIN ────────────────────────────────────────────────────────────────────

// GET /api/admin/helpdesk/tickets?status=&category=
const getAllTickets = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;

  const tickets = await HelpdeskTicket.find(filter)
    .select("-replies")
    .populate("user", POPULATE_USER)
    .sort({ lastReplyAt: -1 });
  res.json(tickets);
});

// GET /api/admin/helpdesk/tickets/:id — full thread, dekhle lastSeenByAdmin update hoy
const getAdminTicketById = asyncHandler(async (req, res) => {
  const ticket = await HelpdeskTicket.findById(req.params.id)
    .populate("user", POPULATE_USER)
    .populate("replies.sender", POPULATE_USER);
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  ticket.lastSeenByAdmin = new Date();
  await ticket.save();

  res.json(ticket);
});

// POST /api/admin/helpdesk/tickets/:id/reply — admin reply dey, status auto "in_progress" hoye jay jodi "open" thake
const adminReplyToTicket = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ message: "Message required" });

  const ticket = await HelpdeskTicket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  ticket.replies.push({ sender: req.user._id, senderRole: "admin", message: message.trim() });
  ticket.lastReplyBy = "admin";
  ticket.lastReplyAt = new Date();
  ticket.lastSeenByAdmin = new Date();
  if (ticket.status === "open") ticket.status = "in_progress";
  await ticket.save();

  res.json(await ticket.populate([
    { path: "user", select: POPULATE_USER },
    { path: "replies.sender", select: POPULATE_USER },
  ]));
});

// PUT /api/admin/helpdesk/tickets/:id/status — { status: "open"|"in_progress"|"resolved"|"closed" }
const updateTicketStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["open", "in_progress", "resolved", "closed"].includes(status))
    return res.status(400).json({ message: "Invalid status" });

  const ticket = await HelpdeskTicket.findByIdAndUpdate(req.params.id, { status }, { new: true })
    .populate("user", POPULATE_USER);
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });
  res.json(ticket);
});

// DELETE /api/admin/helpdesk/tickets/:id
const deleteTicket = asyncHandler(async (req, res) => {
  const ticket = await HelpdeskTicket.findByIdAndDelete(req.params.id);
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });
  res.json({ message: "Ticket deleted" });
});

// GET /api/admin/helpdesk/tickets/open-count — admin sidebar badge: open + in_progress ticket shongkha
const getOpenTicketsCount = asyncHandler(async (req, res) => {
  const count = await HelpdeskTicket.countDocuments({ status: { $in: ["open", "in_progress"] } });
  res.json({ count });
});

module.exports = {
  createTicket, getMyTickets, getMyTicketById, replyToTicket, closeMyTicket, getMyUnreadCount,
  getAllTickets, getAdminTicketById, adminReplyToTicket, updateTicketStatus, deleteTicket, getOpenTicketsCount,
};
