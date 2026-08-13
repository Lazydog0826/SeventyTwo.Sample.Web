/** 通用分页查询参数。 */
export interface PageRequest {
  index: number;
  limit: number;
  keyword?: string;
  enable?: boolean;
}

/** 通用分页响应。 */
export interface PageResponse<T> {
  list: T[];
  total: number;
}
