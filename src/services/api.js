import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import * as db from '@/services/mock/db';

/**
 * The single API surface-card for Ntaka.
 *
 * Today every endpoint resolves against the in-memory catalogue in services/mock/.
 * To point at a real backend, replace `fakeBaseQuery()` with
 *   fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL })
 * and swap each `queryFn` for a `query` returning a URL — the components and slices
 * consuming these hooks do not change.
 */

/* Artificial latency exists so the UI exercises real loading states in the browser.
   During prerendering there is no UI to exercise and 400 pages of it would be dead time. */
const LATENCY_MS = typeof window === 'undefined' ? 0 : 180;

/** Wrap a synchronous lookup so the UI exercises real loading states. */
const resolve = (fn) => async (arg) => {
  await new Promise((r) => setTimeout(r, LATENCY_MS));
  const data = fn(arg);
  if (data == null) {
    return { error: { status: 404, data: 'Not found' } };
  }
  return { data };
};

export const ntakaApi = createApi({
  reducerPath: 'ntakaApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Language', 'Teacher', 'Class', 'Course', 'Placement', 'Slots', 'Bookings', 'Meeting'],
  endpoints: (builder) => ({
    /* languages */
    getLanguages: builder.query({
      queryFn: resolve((params = {}) => db.listLanguages(params)),
      providesTags: ['Language'],
    }),
    getLanguage: builder.query({
      queryFn: resolve((id) => db.readLanguage(id)),
      providesTags: (r, e, id) => [{ type: 'Language', id }],
    }),
    getCountries: builder.query({
      queryFn: resolve(() => db.listCountries()),
    }),
    getLanguagesByCountry: builder.query({
      queryFn: resolve(() => db.listLanguagesByCountry()),
    }),

    /* 1-on-1 teachers */
    getTeachers: builder.query({
      queryFn: resolve((params = {}) => db.listTeachers(params)),
      providesTags: ['Teacher'],
    }),
    getTeacher: builder.query({
      queryFn: resolve((id) => db.readTeacher(id)),
      providesTags: (r, e, id) => [{ type: 'Teacher', id }],
    }),

    /* group classes */
    getClasses: builder.query({
      queryFn: resolve((params = {}) => db.listClasses(params)),
      providesTags: ['Class'],
    }),
    getClass: builder.query({
      queryFn: resolve((id) => db.readClass(id)),
      providesTags: (r, e, id) => [{ type: 'Class', id }],
    }),

    /* video learning */
    getCourses: builder.query({
      queryFn: resolve((params = {}) => db.listVideos(params)),
      providesTags: ['Course'],
    }),
    getCourse: builder.query({
      queryFn: resolve((id) => db.readVideo(id)),
      providesTags: (r, e, id) => [{ type: 'Course', id }],
    }),

    /* free placement check */
    getPlacementTest: builder.query({
      queryFn: resolve((languageId) => db.readPlacementTest(languageId)),
      providesTags: ['Placement'],
    }),
    submitPlacement: builder.mutation({
      queryFn: resolve((payload) => db.submitPlacement(payload)),
    }),

    /* availability + booking */
    getSlots: builder.query({
      queryFn: resolve((params) => db.listSlots(params)),
      providesTags: (r, e, arg) => [{ type: 'Slots', id: arg?.teacherId }],
    }),
    getAvailability: builder.query({
      queryFn: resolve((teacherId) => db.readAvailability(teacherId)),
      providesTags: (r, e, id) => [{ type: 'Slots', id }],
    }),
    saveAvailabilityRules: builder.mutation({
      queryFn: resolve((payload) => db.writeAvailabilityRules(payload)),
      // Changing a week changes every derived slot and every card preview.
      invalidatesTags: ['Slots', 'Teacher'],
    }),
    addAvailabilityException: builder.mutation({
      queryFn: resolve((payload) => db.writeException(payload)),
      invalidatesTags: ['Slots', 'Teacher'],
    }),
    removeAvailabilityException: builder.mutation({
      queryFn: resolve((payload) => db.dropException(payload)),
      invalidatesTags: ['Slots', 'Teacher'],
    }),

    getBookings: builder.query({
      queryFn: resolve((params) => db.listBookings(params)),
      providesTags: ['Bookings'],
    }),
    seedBookings: builder.query({
      queryFn: resolve((learner) => db.ensureSeedBookings(learner)),
      providesTags: ['Bookings'],
    }),
    createBooking: builder.mutation({
      queryFn: async (payload) => {
        const result = db.bookLesson(payload);
        if (result.error) return { error: { status: 409, data: result.error } };
        return { data: result.data };
      },
      // A new booking removes a slot and changes both dashboards.
      invalidatesTags: ['Bookings', 'Slots', 'Teacher'],
    }),
    cancelBooking: builder.mutation({
      queryFn: async (payload) => {
        const result = db.dropBooking(payload);
        if (result.error) return { error: { status: 400, data: result.error } };
        return { data: result.data };
      },
      invalidatesTags: ['Bookings', 'Slots', 'Teacher'],
    }),

    /* lesson rooms */
    getBooking: builder.query({
      queryFn: resolve((bookingId) => db.readBookingForJoin(bookingId)),
      providesTags: (r, e, id) => [{ type: 'Bookings', id }],
    }),
    joinLesson: builder.mutation({
      queryFn: async (payload) => {
        const result = db.joinLesson(payload);
        if (result.error) {
          return { error: { status: result.status ?? 403, data: result.error, state: result.state } };
        }
        return { data: result.data };
      },
      invalidatesTags: ['Meeting'],
    }),
    leaveLesson: builder.mutation({
      queryFn: resolve((payload) => db.leaveLesson(payload)),
      invalidatesTags: ['Meeting'],
    }),

    /* homepage counters */
    getPlatformStats: builder.query({
      queryFn: resolve(() => db.readPlatformStats()),
    }),
  }),
});

export const {
  useGetLanguagesQuery,
  useGetLanguageQuery,
  useGetCountriesQuery,
  useGetLanguagesByCountryQuery,
  useGetTeachersQuery,
  useGetTeacherQuery,
  useGetClassesQuery,
  useGetClassQuery,
  useGetCoursesQuery,
  useGetCourseQuery,
  useGetPlacementTestQuery,
  useSubmitPlacementMutation,
  useGetPlatformStatsQuery,
  useGetSlotsQuery,
  useGetAvailabilityQuery,
  useSaveAvailabilityRulesMutation,
  useAddAvailabilityExceptionMutation,
  useRemoveAvailabilityExceptionMutation,
  useGetBookingsQuery,
  useSeedBookingsQuery,
  useCreateBookingMutation,
  useCancelBookingMutation,
  useGetBookingQuery,
  useJoinLessonMutation,
  useLeaveLessonMutation,
} = ntakaApi;
