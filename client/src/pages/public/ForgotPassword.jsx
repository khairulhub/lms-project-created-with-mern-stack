// client/src/pages/public/ForgotPassword.jsx
// Firebase-এর built-in sendPasswordResetEmail ব্যবহার করে password reset link
// পাঠায়। Google দিয়ে signup করা account-এর জন্য এটা কাজ করবে না (তাদের
// password-ই নেই আমাদের সিস্টেমে) — সেই ক্ষেত্রে আলাদা মেসেজ দেখানো হয়।

import { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail, fetchSignInMethodsForEmail } from "firebase/auth";
import { FiMail, FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import toast from "react-hot-toast";
import { auth } from "../../utils/firebase";
import PublicLayout from "../../components/layout/PublicLayout";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Google দিয়ে signup করা account হলে "password" provider-ই নেই —
      // সেক্ষেত্রে reset email পাঠানোর দরকার নেই, বরং জানিয়ে দেওয়া ভালো।
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0 && !methods.includes("password")) {
        toast.error("এই ইমেইল দিয়ে তুমি Google দিয়ে সাইন আপ করেছিলে। Google Login বাটন দিয়ে ঢুকো।");
        setLoading(false);
        return;
      }
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err) {
      // Firebase security কারণে account না থাকলেও generic message দেখানো ভালো
      // (email enumeration আটকাতে), তবে user-friendly রাখার জন্য এখানে
      // থোরই specific রাখলাম
      if (err.code === "auth/invalid-email") {
        toast.error("সঠিক ইমেইল দাও।");
      } else if (err.code === "auth/user-not-found") {
        toast.error("এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি।");
      } else {
        toast.error("রিসেট লিংক পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করো।");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <h1 className="text-2xl font-bold text-white mb-1">Password রিসেট করো</h1>
            <p className="text-gray-400 text-sm mb-6">
              তোমার account-এর ইমেইল দাও, একটা reset link পাঠিয়ে দিচ্ছি।
            </p>

            {sent ? (
              <div className="text-center py-6">
                <FiCheckCircle size={40} className="text-emerald-400 mx-auto mb-3" />
                <p className="text-white font-semibold mb-1">লিংক পাঠানো হয়েছে!</p>
                <p className="text-gray-400 text-sm">
                  <span className="text-cyan-400">{email}</span> এ একটা password reset link পাঠানো হয়েছে। ইনবক্স (আর spam folder) চেক করো।
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input type="email" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required placeholder="you@example.com"
                      className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-gray-950 font-bold py-3 rounded-xl transition-colors mt-2">
                  {loading ? "পাঠানো হচ্ছে..." : "Reset Link পাঠাও"}
                </button>
              </form>
            )}

            <p className="text-center text-gray-400 text-sm mt-6">
              <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1">
                <FiArrowLeft size={13} /> Login-এ ফিরে যাও
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default ForgotPassword;
