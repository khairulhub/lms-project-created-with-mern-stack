# LMS Update — File Placement Guide

## নতুন ফাইল (নতুন করে add করুন)

### server/models/
- `CourseDetail.js`           → server/models/CourseDetail.js
- `StudentCourseReview.js`    → server/models/StudentCourseReview.js
- `InstructorReview.js`       → server/models/InstructorReview.js

### server/controllers/
- `courseDetailController.js`   → server/controllers/courseDetailController.js
- `studentReviewController.js`  → server/controllers/studentReviewController.js

### client/src/pages/admin/
- `AdminCourseDetailModal.jsx`      → client/src/pages/admin/AdminCourseDetailModal.jsx
- `AdminStudentCourseReviews.jsx`   → client/src/pages/admin/AdminStudentCourseReviews.jsx
- `AdminInstructorReviews.jsx`      → client/src/pages/admin/AdminInstructorReviews.jsx

---

## Replace করুন (পুরনোটা এই দিয়ে replace)

### server/controllers/
- `courseController.js`   → server/controllers/courseController.js

### server/routes/
- `index.js`              → server/routes/index.js

### server/seeds/
- `seed.js`               → server/seeds/seed.js

### client/src/pages/admin/
- `AdminCourses.jsx`      → client/src/pages/admin/AdminCourses.jsx

### client/src/pages/public/
- `CourseSingleDetails.jsx` → client/src/pages/public/CourseSingleDetails.jsx

### client/src/components/layout/
- `DashboardLayout.jsx`   → client/src/components/layout/DashboardLayout.jsx

### client/src/
- `App.jsx`               → client/src/App.jsx

---

## Seed চালানো (MERN course এর data populate করতে)
```
cd server
npm run seed
```
