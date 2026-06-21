const asyncHandler = require("express-async-handler");
const CoursePaymentSettings = require("../models/CoursePaymentSettings");
const PaymentMethod = require("../models/PaymentMethod");

// ════════════════════════════════════════════════════════════════════════
// SETTINGS (singleton) — active/inactive switch, prices, disclaimer text,
// button labels. Same "auto-create with defaults" pattern as course-hero.
// ════════════════════════════════════════════════════════════════════════

// GET /api/course-payment/settings — public
const getPaymentSettings = asyncHandler(async (req, res) => {
  let settings = await CoursePaymentSettings.findOne();
  if (!settings) settings = await CoursePaymentSettings.create({});
  res.json(settings);
});

// PUT /api/admin/course-payment/settings — admin
const updatePaymentSettings = asyncHandler(async (req, res) => {
  let settings = await CoursePaymentSettings.findOne();
  if (!settings) settings = await CoursePaymentSettings.create({});

  const {
    isActive, price, oldPrice, discountText,
    bootcampFeeLabel, bootcampFee, disclaimerBadgeText, disclaimerLine1, disclaimerLine2,
    paymentButtonsLabel, enrollButtonText, enrollButtonLink,
    modalCloseButtonText, modalStepsHeading,
  } = req.body;

  if (isActive !== undefined) settings.isActive = isActive;
  if (price !== undefined) settings.price = price;
  if (oldPrice !== undefined) settings.oldPrice = oldPrice;
  if (discountText !== undefined) settings.discountText = discountText;
  if (bootcampFeeLabel !== undefined) settings.bootcampFeeLabel = bootcampFeeLabel;
  if (bootcampFee !== undefined) settings.bootcampFee = bootcampFee;
  if (disclaimerBadgeText !== undefined) settings.disclaimerBadgeText = disclaimerBadgeText;
  if (disclaimerLine1 !== undefined) settings.disclaimerLine1 = disclaimerLine1;
  if (disclaimerLine2 !== undefined) settings.disclaimerLine2 = disclaimerLine2;
  if (paymentButtonsLabel !== undefined) settings.paymentButtonsLabel = paymentButtonsLabel;
  if (enrollButtonText !== undefined) settings.enrollButtonText = enrollButtonText;
  if (enrollButtonLink !== undefined) settings.enrollButtonLink = enrollButtonLink;
  if (modalCloseButtonText !== undefined) settings.modalCloseButtonText = modalCloseButtonText;
  if (modalStepsHeading !== undefined) settings.modalStepsHeading = modalStepsHeading;

  const updated = await settings.save();
  res.json(updated);
});

// ════════════════════════════════════════════════════════════════════════
// PAYMENT METHODS (full CRUD collection) — bKash / Nagad / Rocket / Visa /
// Bank / any new method admin creates, each with its own ordered steps[].
// ════════════════════════════════════════════════════════════════════════

// GET /api/course-payment/methods — public, only active ones, ordered
const getPaymentMethods = asyncHandler(async (req, res) => {
  const methods = await PaymentMethod.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
  res.json(methods);
});

// GET /api/admin/course-payment/methods — admin, all (active + inactive)
const getAllPaymentMethods = asyncHandler(async (req, res) => {
  const methods = await PaymentMethod.find({})
    .populate("createdBy", "name")
    .sort({ order: 1, createdAt: 1 });
  res.json(methods);
});

// POST /api/admin/course-payment/methods — admin creates a new method/button
const createPaymentMethod = asyncHandler(async (req, res) => {
  const { label, accountLabel, accountNumber, reference, steps, isActive, order } = req.body;
  if (!label) return res.status(400).json({ message: "Label required" });

  const method = await PaymentMethod.create({
    label,
    accountLabel: accountLabel || "",
    accountNumber: accountNumber || "",
    reference: reference || "",
    steps: Array.isArray(steps) ? steps.filter((s) => s && s.trim()) : [],
    isActive: isActive !== undefined ? isActive : true,
    order: order !== undefined ? order : 0,
    createdBy: req.user._id,
  });
  res.status(201).json(method);
});

// PUT /api/admin/course-payment/methods/:id — admin edits/updates a method
const updatePaymentMethod = asyncHandler(async (req, res) => {
  const { label, accountLabel, accountNumber, reference, steps, isActive, order } = req.body;
  const method = await PaymentMethod.findById(req.params.id);
  if (!method) return res.status(404).json({ message: "Payment method not found" });

  if (label !== undefined) method.label = label;
  if (accountLabel !== undefined) method.accountLabel = accountLabel;
  if (accountNumber !== undefined) method.accountNumber = accountNumber;
  if (reference !== undefined) method.reference = reference;
  if (steps !== undefined) method.steps = Array.isArray(steps) ? steps.filter((s) => s && s.trim()) : [];
  if (isActive !== undefined) method.isActive = isActive;
  if (order !== undefined) method.order = order;

  const updated = await method.save();
  res.json(updated);
});

// DELETE /api/admin/course-payment/methods/:id — admin deletes a method/button
const deletePaymentMethod = asyncHandler(async (req, res) => {
  const method = await PaymentMethod.findByIdAndDelete(req.params.id);
  if (!method) return res.status(404).json({ message: "Payment method not found" });
  res.json({ message: "Payment method deleted" });
});

module.exports = {
  getPaymentSettings, updatePaymentSettings,
  getPaymentMethods, getAllPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod,
};
