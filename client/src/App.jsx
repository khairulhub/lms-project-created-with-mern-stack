import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

// Public
import Home from "./pages/public/Home";
import Login from "./pages/public/Login";
import Signup from "./pages/public/Signup";
import Blogs from "./pages/public/Blogs";
import BlogDetail from "./pages/public/BlogDetail";
import Categories from "./pages/public/Categories";

// Student pages
import StudentDashboard from "./pages/student/StudentDashboard";
import EnrolledCourses from "./pages/student/EnrolledCourses";
import MyClasses from "./pages/student/MyClasses";
import Bookmark from "./pages/student/Bookmark";
import Helpdesk from "./pages/student/Helpdesk";
import Analysis from "./pages/student/Analysis";
import Leaderboard from "./pages/student/Leaderboard";
import Announcement from "./pages/student/Announcement";
import ConceptualSession from "./pages/student/ConceptualSession";
import StudentSettings from "./pages/student/StudentSettings";
import StudentProfile from "./pages/student/StudentProfile";

// User (old)
import UserProfile from "./pages/user/UserProfile";
import InstructorRequestPage from "./pages/user/InstructorRequestPage";

// Instructor
import InstructorDashboard from "./pages/instructor/InstructorDashboard";
import InstructorBlogs from "./pages/instructor/InstructorBlogs";
import InstructorProfile from "./pages/instructor/InstructorProfile";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminInstructorRequests from "./pages/admin/AdminInstructorRequests";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminBlogs from "./pages/admin/AdminBlogs";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminNavMenu from "./pages/admin/AdminNavMenu";
import AdminCourseHeroSection from "./pages/admin/AdminCourseHeroSection";
import AdminCoursePaymentMethod from "./pages/admin/AdminCoursePaymentMethod";
import AdminCourseHighlights from "./pages/admin/AdminCourseHighlights";
import AdminCourseVideo from "./pages/admin/AdminCourseVideo";
import AdminCourseWhatYouLearn from "./pages/admin/AdminCourseWhatYouLearn";
import AdminCourseCurriculum from "./pages/admin/AdminCourseCurriculum";
import AdminCourseProjects from "./pages/admin/AdminCourseProjects";


function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <Toaster position="top-right"
          toastOptions={{
            style: { background: "#1f2937", color: "#f9fafb", border: "1px solid #374151" },
            success: { iconTheme: { primary: "#22d3ee", secondary: "#111827" } },
          }} />
        <Routes>
          {/* ── PUBLIC ──────────────────────────────── */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/blogs/:slug" element={<BlogDetail />} />
          <Route path="/categories" element={<Categories />} />

          {/* ── STUDENT (any logged-in user) ─────────── */}
          <Route path="/student/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/enrolled" element={<ProtectedRoute><EnrolledCourses /></ProtectedRoute>} />
          <Route path="/student/my-classes" element={<ProtectedRoute><MyClasses /></ProtectedRoute>} />
          <Route path="/student/bookmark" element={<ProtectedRoute><Bookmark /></ProtectedRoute>} />
          <Route path="/student/helpdesk" element={<ProtectedRoute><Helpdesk /></ProtectedRoute>} />
          <Route path="/student/analysis" element={<ProtectedRoute><Analysis /></ProtectedRoute>} />
          <Route path="/student/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/student/announcement" element={<ProtectedRoute><Announcement /></ProtectedRoute>} />
          <Route path="/student/conceptual-session" element={<ProtectedRoute><ConceptualSession /></ProtectedRoute>} />
          <Route path="/student/settings" element={<ProtectedRoute><StudentSettings /></ProtectedRoute>} />
          <Route path="/student/profile" element={<ProtectedRoute><StudentProfile /></ProtectedRoute>} />

          {/* ── USER (misc) ──────────────────────────── */}
          <Route path="/user/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/user/instructor-request" element={<ProtectedRoute allowedRoles={["user"]}><InstructorRequestPage /></ProtectedRoute>} />

          {/* ── INSTRUCTOR ───────────────────────────── */}
          <Route path="/instructor/dashboard" element={<ProtectedRoute allowedRoles={["instructor","admin"]}><InstructorDashboard /></ProtectedRoute>} />
          <Route path="/instructor/blogs" element={<ProtectedRoute allowedRoles={["instructor","admin"]}><InstructorBlogs /></ProtectedRoute>} />
          <Route path="/instructor/profile" element={<ProtectedRoute allowedRoles={["instructor","admin"]}><InstructorProfile /></ProtectedRoute>} />

          {/* ── ADMIN ────────────────────────────────── */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/instructor-requests" element={<ProtectedRoute allowedRoles={["admin"]}><AdminInstructorRequests /></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCategories /></ProtectedRoute>} />
          <Route path="/admin/blogs" element={<ProtectedRoute allowedRoles={["admin"]}><AdminBlogs /></ProtectedRoute>} />
          <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={["admin"]}><AdminProfile /></ProtectedRoute>} />
          <Route path="/admin/navbar" element={<ProtectedRoute allowedRoles={["admin"]}><AdminNavMenu /></ProtectedRoute>} />
          <Route path="/admin/course-details/hero-section" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCourseHeroSection /></ProtectedRoute>} />
          <Route path="/admin/course-details/payment-method" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCoursePaymentMethod /></ProtectedRoute>} />
          <Route path="/admin/course-details/highlights" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCourseHighlights /></ProtectedRoute>} />
          <Route path="/admin/course-details/curriculum" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCourseCurriculum /></ProtectedRoute>} />
          <Route path="/admin/course-details/projects" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCourseProjects /></ProtectedRoute>} />
          
          <Route path="/admin/course-details/video" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCourseVideo /></ProtectedRoute>} />
          <Route path="/admin/course-details/what-you-learn" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCourseWhatYouLearn /></ProtectedRoute>} />

          {/* ── 404 ──────────────────────────────────── */}
          <Route path="*" element={
            <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white">
              <p className="text-8xl font-bold text-gray-800 mb-4">404</p>
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
