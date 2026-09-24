import { apiSlice } from '@/services/api/apiSlice'
import { toPageResult } from '@/services/api/pagination'
import type { ApiResponse, PageResult, Paginated } from '@/types/api'
import type { DeactivateUserRequest, User, UserListView, UserPayload, UsersQueryArgs } from './users.types'
import { toUserFormData, toUsersParams } from './users.utils'

const unwrap = <T>(response: ApiResponse<T>) => response.data

/** Cache ids for the two list views, so a mutation can refresh just the lists it affects. */
const LIST_ID: Record<UserListView, string> = { current: 'LIST', archived: 'ARCHIVED' }

export const usersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * One page of users. Search, filters and paging all happen on the API. The table pages through
     * it; the mobile card list stays on page 1 and raises `perPage` as it scrolls.
     */
    getUsers: builder.query<PageResult<User>, UsersQueryArgs>({
      query: (args) => ({ url: '/users', params: toUsersParams(args) }),
      transformResponse: (response: ApiResponse<Paginated<User>>) => toPageResult(response.data),
      providesTags: (result, _error, { view }) => [
        { type: 'Users', id: LIST_ID[view] },
        ...(result?.items ?? []).map(({ id }) => ({ type: 'Users' as const, id })),
      ],
    }),

    getUser: builder.query<User, number>({
      query: (id) => `/users/${id}`,
      transformResponse: unwrap<User>,
      providesTags: (_user, _error, id) => [{ type: 'Users', id }],
    }),

    createUser: builder.mutation<User, UserPayload>({
      query: (payload) => ({ url: '/users', method: 'POST', body: toUserFormData(payload) }),
      transformResponse: unwrap<User>,
      invalidatesTags: [{ type: 'Users', id: LIST_ID.current }],
    }),

    updateUser: builder.mutation<User, { id: number; payload: UserPayload }>({
      query: ({ id, payload }) => ({
        url: `/users/${id}`,
        method: 'POST',
        body: toUserFormData(payload, { method: 'PATCH' }),
      }),
      transformResponse: unwrap<User>,
      invalidatesTags: (_user, _error, { id }) => [
        { type: 'Users', id },
        { type: 'Users', id: LIST_ID.current },
      ],
    }),

    deactivateUser: builder.mutation<User, DeactivateUserRequest>({
      query: ({ id, deactivate_reason }) => ({
        url: `/users-deactivate/${id}`,
        method: 'PATCH',
        body: { deactivate_reason },
      }),
      transformResponse: unwrap<User>,
      invalidatesTags: (_user, _error, { id }) => [
        { type: 'Users', id },
        { type: 'Users', id: LIST_ID.current },
      ],
    }),

    activateUser: builder.mutation<User, number>({
      query: (id) => ({ url: `/users-activate/${id}`, method: 'PATCH' }),
      transformResponse: unwrap<User>,
      invalidatesTags: (_user, _error, id) => [
        { type: 'Users', id },
        { type: 'Users', id: LIST_ID.current },
      ],
    }),

    /** Soft-deletes the user; they move from the current list to the archived one. */
    archiveUser: builder.mutation<void, number>({
      query: (id) => ({ url: `/users-archived/${id}`, method: 'PUT' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Users', id },
        { type: 'Users', id: LIST_ID.current },
        { type: 'Users', id: LIST_ID.archived },
      ],
    }),
  }),
})

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeactivateUserMutation,
  useActivateUserMutation,
  useArchiveUserMutation,
} = usersApi
