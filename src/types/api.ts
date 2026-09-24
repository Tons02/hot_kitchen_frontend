/** Success envelope produced by the API's `responseSuccess` / `responseCreated` helpers. */
export interface ApiResponse<TData> {
  status: number
  message: string
  data: TData
}

/** A single error produced by the API's `responseBadRequest` / `responseUnprocessable` / ... helpers. */
export interface ApiErrorItem {
  status: number
  title?: string | null
  detail?: unknown
  source?: { pointer?: string }
}

export interface ApiErrorBody {
  errors: ApiErrorItem[]
}

/** Laravel's default body for failed FormRequest validation (HTTP 422). */
export interface LaravelValidationErrorBody {
  message: string
  errors: Record<string, string[]>
}

/** A paginated Resource collection (`Resource::collection($paginator)->response()->getData(true)`). */
export interface ResourcePage<TItem> {
  data: TItem[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
}

/** One page of results, whatever shape the API sent it in. */
export interface PageResult<TItem> {
  items: TItem[]
  page: number
  perPage: number
  total: number
  lastPage: number
}

/** Laravel's LengthAwarePaginator, returned by `dynamicPaginate()` endpoints. */
export interface Paginated<TItem> {
  current_page: number
  data: TItem[]
  first_page_url: string
  from: number | null
  last_page: number
  last_page_url: string
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number | null
  total: number
}
