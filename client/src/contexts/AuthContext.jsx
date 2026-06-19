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
  const [user, setUser] = useState(null);       // our MongoDB user
  const [loading, setLoading] = useState(true);

  // Sync Firebase user → our backend → get JWT + role
  const syncToBackend = async (firebaseUser, extraData = {}) => {
    const idToken = await firebaseUser.getIdToken();
    const { data } = await api.post(
      "/auth/firebase-sync",
      { name: firebaseUser.displayName, photoURL: firebaseUser.photoURL, ...extraData },
      { headers: { Authorization: `Bearer ${idToken}` } }
    );
    localStorage.setItem("token", data.token);
    setUser(data);
    return data;
  };

  // Google login
  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    return syncToBackend(result.user);
  };

  // Email/password login
  const loginWithEmail = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return syncToBackend(result.user);
  };

  // Email/password signup
  const signupWithEmail = async (email, password, name) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return syncToBackend(result.user, { name });
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem("token");
    setUser(null);
    toast.success("Logged out");
  };

  // On mount: check if we have a valid token and restore session
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const savedToken = localStorage.getItem("token");
      if (firebaseUser && savedToken) {
        try {
          const { data } = await api.get("/auth/me");
          setUser(data);
        } catch {
          // Token expired — re-sync
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
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, signupWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
