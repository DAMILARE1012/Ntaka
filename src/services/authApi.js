import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import * as accounts from '@/services/mock/accounts';

/**
 * The authentication seam.
 *
 * Everything the app knows about sessions comes through these four endpoints. Today they
 * resolve against the fixture in services/mock/accounts.js; to move to Supabase, replace
 * the bodies below with the equivalent client calls and delete the fixture:
 *
 *   signIn        supabase.auth.signInWithPassword({ email, password })
 *   signUp        supabase.auth.signUp({ email, password, options: { data: { ... } } })
 *   signOut       supabase.auth.signOut()
 *   getSession    supabase.auth.getSession()  + a profiles row fetch
 *
 * No component reads a session any other way, so nothing outside this file changes.
 */

const LATENCY_MS = typeof window === 'undefined' ? 0 : 320;

const settle = (fn) => async (arg) => {
  await new Promise((r) => setTimeout(r, LATENCY_MS));
  const result = fn(arg);
  if (result?.error) {
    return { error: { status: 400, data: result.error } };
  }
  return { data: result?.data ?? result ?? null };
};

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Session'],
  endpoints: (builder) => ({
    signIn: builder.mutation({
      queryFn: settle((credentials) => accounts.signIn(credentials)),
      invalidatesTags: ['Session'],
    }),
    signUp: builder.mutation({
      queryFn: settle((details) => accounts.signUp(details)),
      invalidatesTags: ['Session'],
    }),
    signOut: builder.mutation({
      queryFn: settle(() => ({ data: true })),
      invalidatesTags: ['Session'],
    }),
    getProfile: builder.query({
      queryFn: settle((userId) => ({ data: accounts.getProfile(userId) })),
      providesTags: ['Session'],
    }),
  }),
});

export const {
  useSignInMutation,
  useSignUpMutation,
  useSignOutMutation,
  useGetProfileQuery,
} = authApi;
