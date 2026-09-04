import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  redirectRequested,
  selectIsSignedIn,
  selectRole,
} from '@/dashboard/auth/authSlice';

/**
 * Route guard for everything under /dashboard.
 *
 * This is a navigation convenience, not a security control. It stops a signed-out
 * visitor landing on a broken screen; it does not protect data. Every endpoint must
 * re-check the caller server-side, because anyone can edit client state.
 */
export default function RequireAuth({ roles }) {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const isSignedIn = useAppSelector(selectIsSignedIn);
  const role = useAppSelector(selectRole);

  // Remember where they were headed so sign-in can return them there.
  useEffect(() => {
    if (!isSignedIn) {
      dispatch(redirectRequested(location.pathname + location.search));
    }
  }, [isSignedIn, location.pathname, location.search, dispatch]);

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  // Signed in, wrong role: send them to their own dashboard rather than a dead end.
  if (roles?.length && !roles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
