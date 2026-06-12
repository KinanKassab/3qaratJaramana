export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface UploadResult {
  url: string;
  storage_path: string;
}
