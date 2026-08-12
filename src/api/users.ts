// noinspection JSUnusedGlobalSymbols

import http from "@/utils/request";

/** 用户登录请求。 */
export interface LoginRequest {
  /** 账号。 */
  account: string;
  /** 密码。 */
  password: string;
}

/** 当前登录用户信息。 */
export interface UserOutput {
  id: string;
  username: string;
  displayName: string;
  phone: string;
  email: string;
}

export interface UserListOutput extends UserOutput { enable: boolean; version: string; }
export interface CreateUserInput { username: string; password: string; displayName: string; phone: string; email: string; enable: boolean; }
export interface UpdateUserInput { id: string; displayName: string; phone: string; email: string; version: string; }

/** 获取当前登录用户信息。 */
export function getInfo() {
  return http.get<UserOutput>("/api/users/Info");
}

/** 用户登录并返回访问令牌。 */
export function login(request: LoginRequest) {
  return http.post<string>("/api/users/Login", { json: request });
}

/** 使用刷新令牌获取新的访问令牌。 */
export function refreshToken() {
  return http.post<string>("/api/users/RefreshToken");
}

/** 退出登录。 */
export function logout() {
  return http.post<void>("/api/users/Logout");
}

export function getUserList() { return http.get<UserListOutput[]>("/api/users/list"); }
export function createUser(input: CreateUserInput) { return http.post<UserListOutput>("/api/users/create", { json: input }); }
export function updateUser(input: UpdateUserInput) { return http.post<void>("/api/users/update", { json: input }); }
export function setUserEnable(id: string, enable: boolean, version: string) { return http.post<void>("/api/users/set-enable", { json: { id, enable, version } }); }
export function deleteUser(id: string, version: string) { return http.post<void>("/api/users/delete", { json: { id, version } }); }
