import { Navigate, Route, Routes, useParams } from 'react-router-dom';
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
import PartnersPage from '@/pages/PartnersPage';
import FaqPage from '@/pages/FaqPage';
import PrivacyPage from '@/pages/legal/PrivacyPage';
import TermsPage from '@/pages/legal/TermsPage';
import CookiesPage from '@/pages/legal/CookiesPage';
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
function LegacyCourseRedirect() {
  const { courseId } = useParams();
  return <Navigate to={`/interactive-learning/${courseId}`} replace />;
}

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

              {/* interactive learning (self-paced courses) */}
              <Route path="/interactive-learning" element={<VideoLearningPage />} />
              <Route path="/interactive-learning/:courseId" element={<CourseDetailPage />} />

              {/* catalogue */}
              <Route path="/languages" element={<LanguagesPage />} />
              <Route path="/languages/:languageId" element={<LanguageDetailPage />} />

              {/* Renamed from /video-learning. Kept so existing links survive - on deploy
                  these should be real 301s at the edge, not client redirects. */}
              <Route
                path="/video-learning"
                element={<Navigate to="/interactive-learning" replace />}
              />
              <Route path="/video-learning/:courseId" element={<LegacyCourseRedirect />} />

              {/* who we work with */}
              <Route path="/partners" element={<PartnersPage />} />
              <Route path="/faq" element={<FaqPage />} />

              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/cookies" element={<CookiesPage />} />

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
