const mongoose = require("mongoose");

// Singleton doc (same pattern as CoursePaymentSettings) — admin panel theke
// SSLCommerz Store ID/Password/Live-Test toggle set kora jabe, .env touch
// korar dorkar nai. Ei ta thakle DB value-i priority pabe; na thakle
// paymentController .env-er SSLCOMMERZ_* variable-e fallback kore.
const paymentGatewaySettingsSchema = new mongoose.Schema(
  {
    sslStoreId: { type: String, default: "" },
    sslStorePasswd: { type: String, default: "" },
    isLive: { type: Boolean, default: false }, // false = sandbox/test, true = real payment
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentGatewaySettings", paymentGatewaySettingsSchema);
