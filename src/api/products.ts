import http from "@/utils/request";
import type { PageResponse } from "@/api/paging.ts";

/** 商品上架状态，与后端 ProductStatus 枚举的 JSON 字符串值保持一致。 */
export type ProductStatus = "OffShelf" | "OnShelf";

export const productStatus = {
  offShelf: "OffShelf",
  onShelf: "OnShelf",
} as const;

/** 商品信息，对应后端 ProductOutput。 */
export interface ProductOutput {
  id: string;
  name: string;
  price: number;
  code: string;
  description: string | null;
  unit: string | null;
  categoryId: string | null;
  status: ProductStatus;
  version: string;
}

export interface ProductMutationInput {
  name: string;
  price: number;
  code: string;
  description: string | null;
  unit: string | null;
  categoryId: string | null;
  status: ProductStatus;
}

export interface UpdateProductInput extends ProductMutationInput {
  id: string;
  version: string;
}

/** 商品分页查询参数。 */
export interface ProductPageRequest {
  index: number;
  limit: number;
  keyword?: string;
  status?: ProductStatus;
}

/** 分页查询商品。 */
export function getProductPage(request: ProductPageRequest) {
  return http.post<PageResponse<ProductOutput>>("/api/products/page", { json: request });
}

/** 查询商品详情。 */
export function getProductDetail(id: string) {
  return http.post<ProductOutput>("/api/products/get", { json: { id } });
}

/** 创建商品。 */
export function createProduct(input: ProductMutationInput) {
  return http.post<ProductOutput>("/api/products/create", { json: input });
}

/** 修改商品。 */
export function updateProduct(input: UpdateProductInput) {
  return http.post<void>("/api/products/update", { json: input });
}

/** 切换商品上架状态。 */
export function changeProductStatus(input: { id: string; status: ProductStatus; version: string }) {
  return http.post<void>("/api/products/change-status", { json: input });
}

/** 删除商品，按乐观锁版本匹配物理删除。 */
export function deleteProduct(input: { id: string; version: string }) {
  return http.post<void>("/api/products/delete", { json: input });
}
