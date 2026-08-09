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
  phone: string | null;
  email: string | null;
}

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
