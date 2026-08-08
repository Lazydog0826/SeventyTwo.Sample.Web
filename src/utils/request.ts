// noinspection JSUnusedGlobalSymbols,ExceptionCaughtLocallyJS

import ky, { type Options } from "ky";
import router from "@/router";
import type { MessageReactive } from "naive-ui";

interface WebApiResponse<T = any> {
  code: number;
  message: string;
  data: T | null | undefined;
}
interface PendingRequest {
  retry: () => void;
  reject: (reason?: unknown) => void;
}

const RefreshTokenApiPath = "/api/users/refreshToken";
const AuthPagePath = "/login";

// 用于标记是否正在刷新 token
let isRefreshing = false;
// 存储待重试的请求
let requestsQueue: Array<PendingRequest> = [];
// 存储当前正在显示的错误提示
const activeErrorMessages = new Map<string, MessageReactive>();

function showErrorMessage(content: string) {
  if (activeErrorMessages.has(content)) {
    return;
  }

  let messageReactive: MessageReactive;
  messageReactive = window.$message.error(content, {
    onAfterLeave: () => {
      if (activeErrorMessages.get(content) === messageReactive) {
        activeErrorMessages.delete(content);
      }
    },
  });
  activeErrorMessages.set(content, messageReactive);
}

export const kyInstance = ky.create({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  timeout: 5000,
  credentials: "include",
  retry: {
    limit: 1,
    shouldRetry: () => false,
  },
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const token = window.$accessToken;
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
        return Promise.resolve(request);
      },
    ],
    afterResponse: [
      async ({ request, response, retryCount }) => {
        if (response.status === 401) {
          // 刷新 token 接口返回 401 代表授权 token 和刷新 token 都无效了，需要重新登录
          if (new URL(request.url).pathname === RefreshTokenApiPath) {
            window.$accessToken = "";
            showErrorMessage("登录已过期,请重新登录");
            // 携带当前路由地址
            const currentPath = router.currentRoute.value.fullPath;
            await router.push({ path: AuthPagePath, query: { redirect: currentPath } });
            return Promise.reject(new Error("登录已过期"));
          }

          if (retryCount > 0) {
            window.$accessToken = "";
            return Promise.reject(new Error("刷新 Token 后请求仍返回 401"));
          }

          // 其他情况代表授权 token 失效，尝试用刷新 token 换取新的授权 token
          if (isRefreshing) {
            // 正在调用刷新 token 接口，其他请求等待
            return new Promise((resolve, reject) => {
              requestsQueue.push({
                retry: () => {
                  try {
                    const headers = new Headers(request.headers);
                    headers.set("Authorization", `Bearer ${window.$accessToken}`);
                    resolve(
                      ky.retry({
                        request: new Request(request, { headers }),
                        code: "TOKEN_REFRESHED",
                      })
                    );
                  } catch (error) {
                    reject(error);
                  }
                },
                reject: reject,
              });
            });
          } else {
            // 调用刷新 token 接口
            isRefreshing = true;

            // 刷新 token 操作
            try {
              window.$accessToken = (await kyInstance.post<WebApiResponse<string>>(RefreshTokenApiPath).json()).data;
              if (!window.$accessToken) {
                throw new Error("授权 Token 无效");
              }
            } catch (error) {
              // 触发失败
              requestsQueue.forEach(cb => cb.reject(error));
              requestsQueue.splice(0);
              window.$accessToken = "";
              throw error;
            } finally {
              isRefreshing = false;
            }

            // 触发重试
            requestsQueue.forEach(cb => cb.retry());
            requestsQueue.splice(0);
            const headers = new Headers(request.headers);
            headers.set("Authorization", `Bearer ${window.$accessToken}`);
            return ky.retry({
              request: new Request(request, { headers }),
              code: "TOKEN_REFRESHED",
            });
          }
        }
        return Promise.resolve(response);
      },
    ],
    beforeError: [
      async ({ error }) => {
        const message = `${error.name}：${error.message}`;
        showErrorMessage(message);
        return Promise.reject(error);
      },
    ],
  },
});

class http {
  async get<T = any>(url: string, options?: Options): Promise<T | null | undefined> {
    return kyInstance
      .get(url, options)
      .json<WebApiResponse<T>>()
      .then(r => r.data);
  }

  async post<T = any>(url: string, options?: Options): Promise<T | null | undefined> {
    return kyInstance
      .post(url, options)
      .json<WebApiResponse<T>>()
      .then(r => r.data);
  }
}

export default new http();
