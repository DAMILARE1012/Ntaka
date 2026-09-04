import { TEACHERS } from '@/services/mock/teachers';

/**
 * Stand-in for Supabase Auth plus the `profiles` table.
 *
 * The shapes here are deliberately the ones Supabase returns, so swapping this for the
 * real client is a change to services/authApi.js only:
 *
 *   session  { access_token, expires_at, user }
 *   user     { id, email, created_at }
 *   profile  { id, role, display_name, timezone, locale, ... }
 *
 * Passwords are NOT hashed and sessions are NOT signed. This is a demo fixture, and it
 * must be deleted rather than adapted when real auth lands - see services/authApi.js.
 */

export const ROLES = {
  LEARNER: 'learner',
  TEACHER: 'teacher',
  ADMIN: 'admin',
};

export const ROLE_LABELS = {
  learner: 'Learner',
  teacher: 'Teacher',
  admin: 'Administrator',
};

const localTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
};

/** Demo accounts. Any password of 6+ characters is accepted for these. */
const SEED_ACCOUNTS = [
  {
    id: 'user-learner-1',
    email: 'learner@ntaka.com',
    displayName: 'Chinelo Adeyemi',
    role: ROLES.LEARNER,
    locale: 'en',
    createdAt: '2026-01-14T09:12:00.000Z',
  },
  {
    // Bound to a real teacher in the catalogue so the teacher dashboard has live data.
    id: 'user-teacher-1',
    email: 'teacher@ntaka.com',
    displayName: TEACHERS.find((t) => t.languageId === 'yoruba')?.name ?? 'Adétúndé',
    role: ROLES.TEACHER,
    teacherId: TEACHERS.find((t) => t.languageId === 'yoruba')?.id ?? 'yoruba-1',
    locale: 'en',
    createdAt: '2025-11-02T08:00:00.000Z',
  },
  {
    id: 'user-admin-1',
    email: 'admin@ntaka.com',
    displayName: 'Ntaka Admin',
    role: ROLES.ADMIN,
    locale: 'en',
    createdAt: '2025-09-01T08:00:00.000Z',
  },
];

/** Registrations made in-session live here alongside the seeds. */
const registered = new Map(SEED_ACCOUNTS.map((a) => [a.email.toLowerCase(), a]));

const toProfile = (account) => ({
  id: account.id,
  email: account.email,
  role: account.role,
  displayName: account.displayName,
  teacherId: account.teacherId ?? null,
  timezone: account.timezone ?? localTimezone(),
  locale: account.locale ?? 'en',
  createdAt: account.createdAt,
});

const makeSession = (account) => ({
  // Not a real JWT. The shape matches so the swap is mechanical.
  accessToken: `mock.${account.id}.${Date.now().toString(36)}`,
  expiresAt: Date.now() + 1000 * 60 * 60 * 12,
  user: toProfile(account),
});

export const DEMO_LOGINS = SEED_ACCOUNTS.map(({ email, role, displayName }) => ({
  email,
  role,
  displayName,
}));

/* ------------------------------------------------------------------ operations */

export function signIn({ email, password }) {
  const account = registered.get(String(email ?? '').trim().toLowerCase());
  if (!account) {
    return { error: 'No account found with that email address.' };
  }
  if (!password || password.length < 6) {
    return { error: 'Incorrect password.' };
  }
  return { data: makeSession(account) };
}

export function signUp({ email, password, displayName, role }) {
  const key = String(email ?? '').trim().toLowerCase();

  if (!key || !key.includes('@')) return { error: 'Enter a valid email address.' };
  if (!password || password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }
  if (!displayName?.trim()) return { error: 'Tell us what to call you.' };
  if (registered.has(key)) return { error: 'An account with that email already exists.' };

  const account = {
    id: `user-${key.replace(/[^a-z0-9]/g, '-')}`,
    email: key,
    displayName: displayName.trim(),
    // A new teacher is unapproved until an admin reviews them; the dashboard reflects that.
    role: role === ROLES.TEACHER ? ROLES.TEACHER : ROLES.LEARNER,
    teacherId: null,
    timezone: localTimezone(),
    locale: 'en',
    createdAt: new Date().toISOString(),
    pendingApproval: role === ROLES.TEACHER,
  };

  registered.set(key, account);
  return { data: makeSession(account) };
}

export function getProfile(userId) {
  const account = [...registered.values()].find((a) => a.id === userId);
  return account ? toProfile(account) : null;
}
