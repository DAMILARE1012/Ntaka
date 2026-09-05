import { ROLES } from '@/services/mock/accounts';

/**
 * Sidebar structure per role. Kept as data, not JSX, so the shell renders the same way
 * for everyone and only this file changes when a section is added.
 *
 * `soon: true` marks a destination that exists in the plan but not yet in the build -
 * shown greyed rather than hidden, so the shape of the product is legible.
 */
export const NAV_BY_ROLE = {
  [ROLES.LEARNER]: [
    {
      heading: 'Learning',
      items: [
        { to: '/dashboard', label: 'Overview', icon: 'compass', end: true },
        { to: '/dashboard/lessons', label: 'My lessons', icon: 'calendar' },
        { to: '/dashboard/classes', label: 'My classes', icon: 'users', soon: true },
        { to: '/dashboard/courses', label: 'My courses', icon: 'video' },
      ],
    },
    {
      heading: 'Progress',
      items: [
        { to: '/dashboard/placement', label: 'Placement test', icon: 'target', end: true },
        { to: '/dashboard/placement/history', label: 'Test history', icon: 'clock' },
        { to: '/dashboard/milestones', label: 'Milestones', icon: 'sparkles' },
        { to: '/dashboard/certificates', label: 'Certificates', icon: 'certificate', soon: true },
      ],
    },
    {
      heading: 'Account',
      items: [
        { to: '/dashboard/billing', label: 'Subscription', icon: 'badgeCheck' },
        { to: '/dashboard/settings', label: 'Settings', icon: 'shield', soon: true },
      ],
    },
  ],

  [ROLES.TEACHER]: [
    {
      heading: 'Teaching',
      items: [
        { to: '/dashboard', label: 'Overview', icon: 'compass', end: true },
        { to: '/dashboard/schedule', label: 'Schedule', icon: 'calendar' },
        { to: '/dashboard/availability', label: 'Availability', icon: 'clock' },
        { to: '/dashboard/students', label: 'Students', icon: 'users', soon: true },
      ],
    },
    {
      heading: 'Content',
      items: [
        { to: '/dashboard/my-classes', label: 'Group classes', icon: 'users', soon: true },
        { to: '/dashboard/my-courses', label: 'Interactive courses', icon: 'video', soon: true },
      ],
    },
    {
      heading: 'Business',
      items: [
        { to: '/dashboard/earnings', label: 'Earnings', icon: 'book', soon: true },
        { to: '/dashboard/profile', label: 'Public profile', icon: 'user', soon: true },
      ],
    },
  ],

  [ROLES.ADMIN]: [
    {
      heading: 'Operations',
      items: [
        { to: '/dashboard', label: 'Overview', icon: 'compass', end: true },
        { to: '/dashboard/approvals', label: 'Teacher approvals', icon: 'badgeCheck', soon: true },
        { to: '/dashboard/bookings', label: 'Bookings', icon: 'calendar', soon: true },
        { to: '/dashboard/payouts', label: 'Payouts', icon: 'book', soon: true },
      ],
    },
    {
      heading: 'Catalogue',
      items: [
        { to: '/dashboard/languages', label: 'Languages', icon: 'globe', soon: true },
        { to: '/dashboard/courses-admin', label: 'Courses', icon: 'video', soon: true },
      ],
    },
  ],
};

export const navFor = (role) => NAV_BY_ROLE[role] ?? NAV_BY_ROLE[ROLES.LEARNER];
