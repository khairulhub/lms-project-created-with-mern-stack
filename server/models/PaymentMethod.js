const mongoose = require("mongoose");

// Each payment method (bKash, Nagad, Rocket, Visa/MC, Bank, or any new one
// admin adds) shown as a button on the Course Payment section. Admin has
// full CRUD over these from /admin/course-details/payment-method — meaning
// admin can add brand new method "buttons", edit, deactivate, reorder, or
// delete existing ones, and freely add/remove the step-by-step instructions
// shown inside each method's modal.
const paymentMethodSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true }, // e.g. "bKash" — shown on the button
    accountLabel: { type: String, default: "" },          // e.g. "bKash নম্বর (Personal)"
    accountNumber: { type: String, default: "" },          // e.g. "01XXXXXXXXX"
    reference: { type: String, default: "" },               // e.g. "তোমার নাম / ফোন নম্বর"
    // Free-form ordered list of instruction steps — admin can add/remove/
    // reorder as many steps as needed for that method's payment process.
    steps: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },              // inactive = hidden from public page
    order: { type: Number, default: 0 },                      // controls display order (ascending)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentMethod", paymentMethodSchema);
