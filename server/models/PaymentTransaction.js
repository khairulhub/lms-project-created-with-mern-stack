const mongoose = require("mongoose");

// SSLCommerz দিয়ে করা প্রতিটা payment attempt-এর জন্য একটা row। Enrollment
// তখনই তৈরি হয় (এবং auto-approve হয়) যখন gateway থেকে "VALID" কনফার্মেশন
// আসে — তার আগ পর্যন্ত শুধু এই transaction row-টাই থাকে (status: pending)।
const paymentTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },

    tranId: { type: String, required: true, unique: true }, // amader nijer generate kora unique id, SSLCommerz-e pathai
    amount: { type: Number, required: true },
    couponCode: { type: String, default: "" },
    discountAmount: { type: Number, default: 0 },

    // pending -> gateway e pathano hoyeche, response ashe nai
    // success  -> IPN/validation confirm kore dise, enrollment created
    // failed   -> gateway fail dise
    // cancelled-> user nijei cancel korche
    status: {
      type: String,
      enum: ["pending", "success", "failed", "cancelled"],
      default: "pending",
    },

    // SSLCommerz theke ashey emon kichu useful field (audit/debug-er jonno)
    valId: { type: String, default: "" },
    bankTranId: { type: String, default: "" },
    cardType: { type: String, default: "" },
    gatewayRawResponse: { type: mongoose.Schema.Types.Mixed, default: null },

    enrollment: { type: mongoose.Schema.Types.ObjectId, ref: "Enrollment", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentTransaction", paymentTransactionSchema);
