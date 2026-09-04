import { Route, Routes } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import HomePage from '@/pages/HomePage';
import TeachersPage from '@/pages/TeachersPage';
import TeacherProfilePage from '@/pages/TeacherProfilePage';
import ClassesPage from '@/pages/ClassesPage';
import ClassDetailPage from '@/pages/ClassDetailPage';
import VideoLearningPage from '@/pages/VideoLearningPage';
import CourseDetailPage from '@/pages/CourseDetailPage';
import LanguagesPage from '@/pages/LanguagesPage';
import LanguageDetailPage from '@/pages/LanguageDetailPage';
import PlacementTestPage from '@/pages/PlacementTestPage';
import NotFoundPage from '@/pages/NotFoundPage';
import LoginPage from '@/dashboard/auth/LoginPage';
import SignupPage from '@/dashboard/auth/SignupPage';
import RequireAuth from '@/dashboard/auth/RequireAuth';
import DashboardRoutes from '@/dashboard/DashboardRoutes';

/**
 * Two applications behind one router.
 *
 *   src/pages + src/features   the public site: prerendered, indexable, no auth
 *   src/dashboard              the authenticated app: client-only, noindex, guarded
 *
 * They share the design system in src/components and the data layer in src/services,
 * and nothing else. The split is deliberate - marketing pages must stay static and
 * crawlable, and product screens must never leak into the sitemap.
 */
export default function App() {
  return (
    <Routes>
      {/* ------------------------------------------- authenticated app */}
      <Route element={<RequireAuth />}>
        <Route path="/dashboard/*" element={<DashboardRoutes />} />
      </Route>

      {/* auth screens carry their own chrome, so they sit outside PageLayout */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* ------------------------------------------------- public site */}
      <Route
        path="*"
        element={
          <PageLayout>
            <Routes>
              <Route path="/" element={<HomePage />} />

              {/* 1-on-1 lessons */}
              <Route path="/teachers" element={<TeachersPage />} />
              <Route path="/teachers/:teacherId" element={<TeacherProfilePage />} />

              {/* group classes */}
              <Route path="/classes" element={<ClassesPage />} />
              <Route path="/classes/:classId" element={<ClassDetailPage />} />

              {/* video learning (self-paced courses) */}
              <Route path="/video-learning" element={<VideoLearningPage />} />
              <Route path="/video-learning/:courseId" element={<CourseDetailPage />} />

              {/* catalogue */}
              <Route path="/languages" element={<LanguagesPage />} />
              <Route path="/languages/:languageId" element={<LanguageDetailPage />} />

              {/* free placement check */}
              <Route path="/placement-test" element={<PlacementTestPage />} />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </PageLayout>
        }
      />
    </Routes>
  );
}
