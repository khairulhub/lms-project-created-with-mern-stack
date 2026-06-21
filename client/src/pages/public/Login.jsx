import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import { FiMail, FiLock, FiArrowLeft } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import PublicLayout from "../../components/layout/PublicLayout";

const Login = () => {
  const { loginWithEmail, loginWithGoogle, verifyOTPAndLogin, resendOTP } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resending, setResending] = useState(false);

  const getDashboardPath = (role) => {
    if (role === "admin") return "/admin/dashboard";
    if (role === "instructor") return "/instructor/dashboard";
    return "/student/dashboard";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await loginWithEmail(form.email, form.password);
      if (result === "otp_required") {
        setOtpStep(true);
        toast.success(`OTP sent to ${form.email}`);
      } else {
        toast.success(`Welcome back, ${result.name}!`);
        navigate(getDashboardPath(result.role));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) return toast.error("Enter all 6 digits");
    setLoading(true);
    try {
      const data = await verifyOTPAndLogin(form.email, otpCode);
      toast.success(`Welcome back, ${data.name}!`);
      navigate(getDashboardPath(data.role));
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Invalid OTP");
      setOtp(["", "", "", "", "", ""]);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendOTP(form.email);
      toast.success("New OTP sent!");
      setOtp(["", "", "", "", "", ""]);
    } catch {
      toast.error("Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val.slice(-1);
    setOtp(newOtp);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0)
      document.getElementById(`otp-${idx - 1}`)?.focus();
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const data = await loginWithGoogle();
      toast.success(`Welcome, ${data.name}!`);
      navigate(getDashboardPath(data.role));
    } catch {
      toast.error("Google login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
            {otpStep ? (
            <>
              <button onClick={() => { setOtpStep(false); setOtp(["","","","","",""]); }}
                className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
                <FiArrowLeft size={14} /> Back
              </button>
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">📧</div>
                <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
                <p className="text-gray-400 text-sm">
                  We sent a 6-digit OTP to<br />
                  <span className="text-cyan-400 font-medium">{form.email}</span>
                </p>
              </div>
              <div className="flex gap-3 justify-center mb-6">
                {otp.map((digit, idx) => (
                  <input key={idx} id={`otp-${idx}`} type="text" inputMode="numeric"
                    maxLength={1} value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                    className="w-12 h-14 text-center text-xl font-bold bg-gray-800 border-2 border-gray-700 text-white rounded-xl focus:outline-none focus:border-cyan-500 transition-colors" />
                ))}
              </div>
              <button onClick={handleOTPVerify} disabled={loading}
                className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-gray-950 font-bold py-3 rounded-xl transition-colors mb-4">
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
              <p className="text-center text-gray-500 text-sm">
                Didn't receive it?{" "}
                <button onClick={handleResend} disabled={resending}
                  className="text-cyan-400 hover:text-cyan-300 font-medium disabled:opacity-50">
                  {resending ? "Sending..." : "Resend OTP"}
                </button>
              </p>
            </>
            ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                <p className="text-gray-400 text-sm">Login to your account</p>
              </div>
              <button onClick={handleGoogle} disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-medium py-3 px-4 rounded-xl transition-colors mb-6 disabled:opacity-50">
                <FcGoogle size={20} /> Continue with Google
              </button>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-gray-800" />
                <span className="text-gray-500 text-sm">or</span>
                <div className="flex-1 h-px bg-gray-800" />
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input type="email" value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required placeholder="you@example.com"
                      className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input type="password" value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required placeholder="••••••••"
                      className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-gray-950 font-bold py-3 rounded-xl transition-colors mt-2">
                  {loading ? "Please wait..." : "Login"}
                </button>
              </form>
              <p className="text-center text-gray-400 text-sm mt-6">
                Don't have an account?{" "}
                <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-medium">Sign up</Link>
              </p>
            </>
            )}
          </div>
          <p className="text-center text-gray-600 text-xs mt-6">
            <Link to="/" className="hover:text-gray-400 transition-colors">← Back to Home</Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Login;
