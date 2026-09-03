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

export default function App() {
  return (
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
  );
}
