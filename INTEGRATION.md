# Enrollment System — Integration Guide
# প্রতিটা step অনুযায়ী file গুলো project-এ বসাও।

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 1 — Server: Model
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`server/models/Enrollment.js` → নতুন file, copy করো।


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 2 — Server: Controller
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`server/controllers/enrollmentController.js` → নতুন file, copy করো।


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 3 — Server: Routes (routes/index.js এ add করো)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`server/routes/index.js` file খোলো।
`module.exports = router;` line এর ঠিক আগে এই block টা paste করো:

```js
const {
  submitEnrollment,
  getMyEnrollments,
  checkEnrollment,
  getAllEnrollments,
  reviewEnrollment,
  deleteEnrollment,
  getEnrollmentStats,
} = require("../controllers/enrollmentController");

// ─── ENROLLMENTS ──────────────────────────────────────────────────────────────
router.post("/enrollments",                    protect, submitEnrollment);
router.get("/enrollments/my",                  protect, getMyEnrollments);
router.get("/enrollments/check/:courseId",     protect, checkEnrollment);

router.get("/admin/enrollments/stats",         protect, adminOnly, getEnrollmentStats);
router.get("/admin/enrollments",               protect, adminOnly, getAllEnrollments);
router.put("/admin/enrollments/:id/review",    protect, adminOnly, reviewEnrollment);
router.delete("/admin/enrollments/:id",        protect, adminOnly, deleteEnrollment);
```


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 4 — Client: নতুন files copy করো
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

নিচের 3টা file project-এ বসাও (পুরোনো file থাকলে REPLACE):

  src/pages/public/CourseDetails/EnrollmentModal.jsx    ← নতুন file
  src/pages/public/CourseDetails/CoursePaymentSection.jsx   ← REPLACE পুরোনোটা
  src/pages/student/EnrolledCourses.jsx                ← REPLACE পুরোনো placeholder
  src/pages/admin/AdminEnrollments.jsx                 ← নতুন file


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 5 — App.jsx: route add করো
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`client/src/App.jsx` এ:

### Import section এ add করো:
```jsx
import AdminEnrollments from "./pages/admin/AdminEnrollments";
```

### Admin routes section এ add করো:
```jsx
<Route path="/admin/enrollments" element={<ProtectedRoute allowedRoles={["admin"]}><AdminEnrollments /></ProtectedRoute>} />
```

### Student routes section এ (already `/student/enrolled` route আছে, কোনো change নেই):
EnrolledCourses component নতুন version দিয়ে কাজ করবে automatically।


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 6 — DashboardLayout.jsx: sidebar link add করো
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`DashboardLayout.jsx` এ `adminLinks` array তে এই item টা add করো
(coupons-এর পরে):

```jsx
{ to: "/admin/enrollments", icon: <FiCheckCircle />, label: "Enrollments" },
```

Student sidebar এ (userLinks) ইতোমধ্যে "My Classes" link আছে।
"আমার কোর্সসমূহ" দেখাতে এই entry যোগ করো:

```jsx
{ to: "/student/enrolled", icon: <FiBookOpen />, label: "আমার কোর্সসমূহ" },
```

(FiBookOpen import না থাকলে: `import { ..., FiBookOpen } from "react-icons/fi";`)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 7 — CourseSingleDetails.jsx: course prop pass করো
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`CourseSingleDetails.jsx` এ CoursePaymentSection call করার জায়গায়
`course` prop pass করো যাতে enrollment check কাজ করে:

```jsx
<CoursePaymentSection
  course={course}           {/* ← এটা add করো */}
  couponData={couponData}   {/* আগে থেকে থাকলে */}
  finalPrice={finalPrice}   {/* আগে থেকে থাকলে */}
/>
```

যদি `CourseSingleDetails.jsx` এ `course` state না থাকে,
তাহলে `/api/courses/:id` থেকে fetch করো।


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## Flow summary (সব কিছু হয়ে গেলে):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. Student course page-এ আসে
  2. Payment method info দেখে (modal) → payment করে
  3. "ভর্তি হও" click → EnrollmentModal open → TxID + screenshot submit
  4. Admin /admin/enrollments এ pending দেখে → Approve click
  5. Student /student/enrolled এ "Active" tab-এ course দেখতে পায়
  6. Course page-এ "ভর্তি হও" button → "Continue Learning" হয়ে যায়
