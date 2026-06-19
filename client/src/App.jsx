import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

// Public Pages
import Home from "./pages/public/Home";
import Login from "./pages/public/Login";
import Signup from "./pages/public/Signup";
import Blogs from "./pages/public/Blogs";
import BlogDetail from "./pages/public/BlogDetail";
import Categories from "./pages/public/Categories";

// User Pages
import UserDashboard from "./pages/user/UserDashboard";
import UserProfile from "./pages/user/UserProfile";
import InstructorRequestPage from "./pages/user/InstructorRequestPage";

// Instructor Pages
import InstructorDashboard from "./pages/instructor/InstructorDashboard";
import InstructorBlogs from "./pages/instructor/InstructorBlogs";
import InstructorProfile from "./pages/instructor/InstructorProfile";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminInstructorRequests from "./pages/admin/AdminInstructorRequests";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminBlogs from "./pages/admin/AdminBlogs";
import AdminProfile from "./pages/admin/AdminProfile";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: "#1f2937", color: "#f9fafb", border: "1px solid #374151" },
            success: { iconTheme: { primary: "#22d3ee", secondary: "#111827" } },
          }}
        />
        <Routes>
          {/* ── PUBLIC ──────────────────────────────────────── */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/blogs/:slug" element={<BlogDetail />} />
          <Route path="/categories" element={<Categories />} />

          {/* ── USER (any logged-in user) ────────────────────── */}
          <Route path="/user/dashboard" element={
            <ProtectedRoute allowedRoles={["user", "instructor", "admin"]}>
              <UserDashboard />
            </ProtectedRoute>
          } />
          <Route path="/user/profile" element={
            <ProtectedRoute allowedRoles={["user", "instructor", "admin"]}>
              <UserProfile />
            </ProtectedRoute>
          } />
          <Route path="/user/instructor-request" element={
            <ProtectedRoute allowedRoles={["user"]}>
              <InstructorRequestPage />
            </ProtectedRoute>
          } />

          {/* ── INSTRUCTOR ──────────────────────────────────── */}
          <Route path="/instructor/dashboard" element={
            <ProtectedRoute allowedRoles={["instructor", "admin"]}>
              <InstructorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/instructor/blogs" element={
            <ProtectedRoute allowedRoles={["instructor", "admin"]}>
              <InstructorBlogs />
            </ProtectedRoute>
          } />
          <Route path="/instructor/profile" element={
            <ProtectedRoute allowedRoles={["instructor", "admin"]}>
              <InstructorProfile />
            </ProtectedRoute>
          } />

          {/* ── ADMIN ───────────────────────────────────────── */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminUsers />
            </ProtectedRoute>
          } />
          <Route path="/admin/instructor-requests" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminInstructorRequests />
            </ProtectedRoute>
          } />
          <Route path="/admin/categories" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminCategories />
            </ProtectedRoute>
          } />
          <Route path="/admin/blogs" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminBlogs />
            </ProtectedRoute>
          } />
          <Route path="/admin/profile" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminProfile />
            </ProtectedRoute>
          } />

          {/* ── FALLBACK ────────────────────────────────────── */}
          <Route path="*" element={
            <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white">
              <p className="text-8xl mb-4">404</p>
              <p className="text-gray-400 mb-6">Page not found</p>
              <a href="/" className="text-cyan-400 hover:text-cyan-300">← Go Home</a>
            </div>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
