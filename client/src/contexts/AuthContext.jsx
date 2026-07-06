import { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider } from "../utils/firebase";
import api from "../utils/api";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // OTP pending state — stores firebase user temporarily until OTP verified
  const [pendingFirebaseUser, setPendingFirebaseUser] = useState(null);

  const syncToBackend = async (firebaseUser, extraData = {}) => {
    const idToken = await firebaseUser.getIdToken();
    const { data } = await api.post(
      "/auth/firebase-sync",
      { name: firebaseUser.displayName, photoURL: firebaseUser.photoURL, ...extraData },
      { headers: { Authorization: `Bearer ${idToken}` } }
    );
    localStorage.setItem("token", data.token);
    setUser(data);
    setPendingFirebaseUser(null);
    return data;
  };

  // Google login — no OTP needed (Google verifies itself)
  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    return syncToBackend(result.user);
  };

  // Email/password login — Step 1: Firebase auth → send OTP
  // Returns "otp_required" so Login page knows to show OTP screen
  const loginWithEmail = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    // Store firebase user temporarily
    setPendingFirebaseUser(result.user);
    // Send OTP
    await api.post("/otp/send", { email });
    return "otp_required";
  };

  // Email/password login — Step 2: verify OTP → sync to backend
  const verifyOTPAndLogin = async (email, otp) => {
    const { data } = await api.post("/otp/verify", { email, otp });
    if (!data.verified) throw new Error("OTP verification failed");
    // Now sync to backend
    if (!pendingFirebaseUser) throw new Error("Session expired. Please login again.");
    return syncToBackend(pendingFirebaseUser);
  };

  // Resend OTP
  const resendOTP = async (email) => {
    await api.post("/otp/send", { email });
  };

  // Signup — no OTP on signup (OTP is only on login)
  const signupWithEmail = async (email, password, name) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return syncToBackend(result.user, { name });
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem("token");
    setUser(null);
    setPendingFirebaseUser(null);
    toast.success("Logged out");
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const savedToken = localStorage.getItem("token");
      if (firebaseUser && savedToken) {
        try {
          const { data } = await api.get("/auth/me");
          setUser(data);
        } catch {
          try {
            await syncToBackend(firebaseUser);
          } catch {
            localStorage.removeItem("token");
            setUser(null);
          }
        }
      } else {
        localStorage.removeItem("token");
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{
      user, setUser, loading, pendingFirebaseUser,
      loginWithGoogle, loginWithEmail, verifyOTPAndLogin, resendOTP,
      signupWithEmail, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
