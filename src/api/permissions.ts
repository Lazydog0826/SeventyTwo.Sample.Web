import http from "@/utils/request";

/** 权限类型：目录、页面、按钮。 */
export type PermissionType = "Page" | "Directory" | "Button";

/** 路由元数据。 */
export interface PermissionMetaData {
  isShow: boolean;
}

/** 目录或页面权限。 */
export interface PermissionMenuOutput {
  id: string;
  code: string;
  title: string;
  type: PermissionType;
  sortOrder: number;
  icon: string;
  vueComponentPath: string;
  routePath: string;
  routeName: string;
  metaData: PermissionMetaData;
  parentId: string | null;
}

/** 当前登录用户的权限。 */
export interface PermissionOutput {
  menus: PermissionMenuOutput[];
  buttonCodes: string[];
}

/** 权限管理列表项。 */
export interface PermissionListOutput {
  id: string;
  code: string;
  title: string;
  type: PermissionType;
  enable: boolean;
  sortOrder: number;
  icon: string;
  vueComponentPath: string;
  routePath: string;
  routeName: string;
  metaData: PermissionMetaData;
  parentId: string | null;
  version: string;
}

export interface PermissionMutationInput {
  code: string;
  title: string;
  type: PermissionType;
  enable: boolean;
  sortOrder: number;
  icon: string;
  vueComponentPath: string;
  routePath: string;
  routeName: string;
  parentId: string | null;
  metaData: PermissionMetaData;
}

export interface UpdatePermissionInput extends PermissionMutationInput {
  id: string;
  version: string;
}

/** 获取当前登录用户的权限。 */
export function getPermissions() {
  return http.get<PermissionOutput>("/api/permissions");
}

/** 获取权限管理列表，包含已禁用权限。 */
export function getPermissionList() {
  return http.get<PermissionListOutput[]>("/api/permissions/list");
}

export function getPermissionDetail(id: string) {
  return http.get<PermissionListOutput>("/api/permissions/detail", { searchParams: { id } });
}

export function createPermission(input: PermissionMutationInput) {
  return http.post<PermissionListOutput>("/api/permissions/create", { json: input });
}

export function updatePermission(input: UpdatePermissionInput) {
  return http.post<void>("/api/permissions/update", { json: input });
}

export function deletePermission(id: string) {
  return http.post<void>("/api/permissions/delete", { json: { id } });
}
