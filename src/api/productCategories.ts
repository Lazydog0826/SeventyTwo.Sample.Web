import http from "@/utils/request";

export interface ProductCategoryListOutput {
  id: string;
  name: string;
  parentId: string | null;
  path: string;
  version: string;
}

export interface ProductCategoryMutationInput {
  name: string;
  parentId: string | null;
}

export interface UpdateProductCategoryInput extends ProductCategoryMutationInput {
  id: string;
  version: string;
}

export function getProductCategoryList() {
  return http.get<ProductCategoryListOutput[]>("/api/productCategories/list");
}

export function getProductCategoryDetail(id: string) {
  return http.get<ProductCategoryListOutput>("/api/productCategories/detail", { searchParams: { id } });
}

export function createProductCategory(input: ProductCategoryMutationInput) {
  return http.post<ProductCategoryListOutput>("/api/productCategories/create", { json: input });
}

export function updateProductCategory(input: UpdateProductCategoryInput) {
  return http.post<void>("/api/productCategories/update", { json: input });
}

export function deleteProductCategory(id: string) {
  return http.post<void>("/api/productCategories/delete", { json: { id } });
}
