const Coupon = require("../models/Coupon");

// ─── PUBLIC: validate a coupon code ──────────────────────────────────────────
// POST /coupons/validate
// Body: { code, courseId }
// Returns discount info if valid, or error message if not
const validateCoupon = async (req, res) => {
  try {
    const { code, courseId } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ message: "কুপন কোড দেওয়া হয়নি।" });
    }

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ message: "এই কুপন কোডটি বৈধ নয়।" });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ message: "এই কুপনটি বর্তমানে নিষ্ক্রিয়।" });
    }

    const now = new Date();

    if (coupon.validFrom && now < new Date(coupon.validFrom)) {
      return res.status(400).json({ message: "এই কুপনটি এখনো চালু হয়নি।" });
    }

    if (coupon.validTill && now > new Date(coupon.validTill)) {
      return res.status(400).json({ message: "এই কুপনটির মেয়াদ শেষ হয়ে গেছে।" });
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ message: "এই কুপনের সর্বোচ্চ ব্যবহার সীমা শেষ হয়ে গেছে।" });
    }

    // Check if coupon is applicable to this course
    if (coupon.applicableTo && coupon.applicableTo.length > 0 && courseId) {
      const isApplicable = coupon.applicableTo.some(
        (id) => id.toString() === courseId.toString()
      );
      if (!isApplicable) {
        return res.status(400).json({ message: "এই কুপনটি এই কোর্সের জন্য প্রযোজ্য নয়।" });
      }
    }

    // Valid coupon — return discount info (never expose full coupon doc)
    return res.json({
      valid: true,
      couponId: coupon._id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      description: coupon.description || "",
    });
  } catch (err) {
    console.error("Coupon validate error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── ADMIN: get all coupons ───────────────────────────────────────────────────
const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find()
      .populate("applicableTo", "title")
      .sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ─── ADMIN: get single coupon ─────────────────────────────────────────────────
const getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id).populate(
      "applicableTo",
      "title"
    );
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    res.json(coupon);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ─── ADMIN: create coupon ─────────────────────────────────────────────────────
const createCoupon = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      validFrom,
      validTill,
      applicableTo,
      maxUses,
      isActive,
      description,
    } = req.body;

    // Basic validation
    if (!code || !discountType || discountValue === undefined) {
      return res
        .status(400)
        .json({ message: "code, discountType এবং discountValue আবশ্যক।" });
    }
    if (!["flat", "percent"].includes(discountType)) {
      return res
        .status(400)
        .json({ message: "discountType অবশ্যই flat অথবা percent হতে হবে।" });
    }
    if (discountType === "percent" && (discountValue < 0 || discountValue > 100)) {
      return res
        .status(400)
        .json({ message: "Percent discount ০ থেকে ১০০-এর মধ্যে হতে হবে।" });
    }

    // Check duplicate
    const existing = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: "এই কোডের কুপন ইতোমধ্যে আছে।" });
    }

    const coupon = await Coupon.create({
      code,
      discountType,
      discountValue,
      validFrom: validFrom || null,
      validTill: validTill || null,
      applicableTo: applicableTo || [],
      maxUses: maxUses || null,
      isActive: isActive !== undefined ? isActive : true,
      description: description || "",
    });

    res.status(201).json(coupon);
  } catch (err) {
    console.error("Create coupon error:", err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "এই কোডের কুপন ইতোমধ্যে আছে।" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// ─── ADMIN: update coupon ─────────────────────────────────────────────────────
const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });

    const fields = [
      "code",
      "discountType",
      "discountValue",
      "validFrom",
      "validTill",
      "applicableTo",
      "maxUses",
      "isActive",
      "description",
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) coupon[f] = req.body[f];
    });

    // Handle explicit null clears
    if (req.body.validFrom === null) coupon.validFrom = null;
    if (req.body.validTill === null) coupon.validTill = null;
    if (req.body.maxUses === null) coupon.maxUses = null;

    await coupon.save();
    res.json(coupon);
  } catch (err) {
    console.error("Update coupon error:", err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "এই কোডের কুপন ইতোমধ্যে আছে।" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// ─── ADMIN: toggle isActive ───────────────────────────────────────────────────
const toggleCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    res.json({ isActive: coupon.isActive });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ─── ADMIN: delete coupon ─────────────────────────────────────────────────────
const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    res.json({ message: "Coupon deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  validateCoupon,
  getAllCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  toggleCoupon,
  deleteCoupon,
};
