import { Route, Routes } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { ROLES } from '@/services/mock/accounts';
import { selectRole } from '@/dashboard/auth/authSlice';
import DashboardLayout from '@/dashboard/layout/DashboardLayout';
import LearnerOverview from '@/dashboard/learner/LearnerOverview';
import TeacherOverview from '@/dashboard/teacher/TeacherOverview';
import AdminOverview from '@/dashboard/admin/AdminOverview';
import MyLessons from '@/dashboard/learner/MyLessons';
import SchedulePage from '@/dashboard/teacher/SchedulePage';
import AvailabilityEditor from '@/dashboard/teacher/AvailabilityEditor';
import LessonRoom from '@/dashboard/lesson/LessonRoom';
import PlacementPage from '@/dashboard/placement/PlacementPage';
import TestHistory from '@/dashboard/placement/TestHistory';
import MilestonesPage from '@/dashboard/motivation/MilestonesPage';
import CoursePlayer from '@/dashboard/learning/CoursePlayer';
import MyCourses from '@/dashboard/learning/MyCourses';
import RequireAuth from '@/dashboard/auth/RequireAuth';
import { PageTitle, ComingSoon } from '@/dashboard/components/Panel';

/**
 * One dashboard, three faces. The index route resolves by role rather than living at
 * three different URLs, so /dashboard is a stable destination to redirect to after
 * sign-in regardless of who signed in.
 */
function RoleOverview() {
  const role = useAppSelector(selectRole);
  if (role === ROLES.TEACHER) return <TeacherOverview />;
  if (role === ROLES.ADMIN) return <AdminOverview />;
  return <LearnerOverview />;
}

export default function DashboardRoutes() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<RoleOverview />} />

        {/* learner */}
        <Route path="placement" element={<PlacementPage />} />
        <Route path="placement/history" element={<TestHistory />} />
        <Route path="milestones" element={<MilestonesPage />} />
        <Route path="lessons" element={<MyLessons />} />

        {/* Interactive Learning player. Enrolment happens on arrival. */}
        <Route path="courses" element={<MyCourses />} />
        <Route path="learn/:courseId" element={<CoursePlayer />} />

        {/* The room itself. Open to whichever of the two people booked it - the guard
            inside re-checks participation, and the server checks it again. */}
        <Route path="lessons/:bookingId/room" element={<LessonRoom />} />

        {/* teacher only - a learner hitting these is bounced to their own overview */}
        <Route element={<RequireAuth roles={[ROLES.TEACHER]} />}>
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="availability" element={<AvailabilityEditor />} />
        </Route>
        <Route
          path="*"
          element={
            <>
              <PageTitle title="Not built yet" />
              <ComingSoon
                title="This section is on the plan"
                body="The dashboard shell, roles and navigation are in place. Individual screens land phase by phase."
                cta={{ to: '/dashboard', label: 'Back to overview' }}
              />
            </>
          }
        />
      </Route>
    </Routes>
  );
}
