// noinspection JSUnusedGlobalSymbols,ExceptionCaughtLocallyJS

import ky, { type Options } from "ky";
import router from "@/router";
import type { MessageReactive } from "naive-ui";

/**
 * 后端统一响应结构。
 * `data` 在接口无返回值或业务数据为空时可能为 null/undefined。
 */
interface WebApiResponse<T = any> {
  code: number;
  message: string;
  data: T | null | undefined;
}

/**
 * Token 刷新期间暂挂的请求。
 * - retry：刷新成功后，使用新的访问 Token 重新发送原请求。
 * - reject：刷新失败后，将相同错误传递给原请求调用方。
 */
interface PendingRequest {
  retry: () => void;
  reject: (reason?: unknown) => void;
}

// 刷新 Token 的后端接口路径，用于区分普通接口 401 和刷新接口自身的 401。
const RefreshTokenApiPath = "/api/users/refreshToken";
// 前端登录页路径，认证彻底失效时跳转到此页面。
const AuthPagePath = "/login";

// 标记刷新接口是否正在执行，确保并发 401 只发起一次 Token 刷新请求。
let isRefreshing = false;
// 刷新期间收到 401 的其他请求进入该队列，等待刷新结果后统一重试或失败。
let requestsQueue: Array<PendingRequest> = [];
// 记录仍在界面上显示的错误提示，避免同一错误因多个并发请求而重复弹出。
const activeErrorMessages = new Map<string, MessageReactive>();

/**
 * 显示全局错误消息，并按完整消息文本去重。
 * 消息离场后删除记录，确保相同错误之后再次发生时仍可正常提示。
 */
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

/**
 * 跳转到登录页，并通过 redirect 参数保存当前完整路由。
 * 如果已经位于登录页则不再跳转，避免并发 401 覆盖首次保存的 redirect，
 * 或形成 `/login?redirect=/login...` 形式的嵌套重定向。
 */
async function redirectToAuthPage() {
  const currentRoute = router.currentRoute.value;
  if (currentRoute.path === AuthPagePath) {
    return;
  }

  // 保留当前地址，登录成功后可返回原页面
  await router.push({ path: AuthPagePath, query: { redirect: currentRoute.fullPath } });
}

export const kyInstance = ky.create({
  // 所有相对请求地址均基于该环境变量解析。
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  // 单次网络请求最多等待 5 秒。
  timeout: 5000,
  // 跨域请求携带 Cookie，刷新 Token 可由 HttpOnly Cookie 保存。
  credentials: "include",
  retry: {
    // 预留一次重试次数，仅供 afterResponse 中的 ky.retry() 强制重试使用。
    limit: 1,
    // 禁止 ky 因网络错误或响应状态自动重试，避免非认证请求被意外重复提交。
    // ky.retry() 发起的强制重试不受该返回值影响。
    shouldRetry: () => false,
  },
  hooks: {
    beforeRequest: [
      ({ request }) => {
        // 每次发送请求前读取最新访问 Token，避免在实例创建时固化旧 Token。
        const token = window.$accessToken;
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
        return Promise.resolve(request);
      },
    ],
    afterResponse: [
      async ({ request, response, retryCount }) => {
        // 非 401 响应保持原样，由 ky 继续执行正常的成功或 HTTP 错误处理。
        if (response.status === 401) {
          // 刷新接口自身返回 401，说明访问 Token 和刷新 Token 均已失效。
          // 此时不能再次刷新，否则会形成刷新接口递归调用。
          if (new URL(request.url).pathname === RefreshTokenApiPath) {
            window.$accessToken = "";
            await redirectToAuthPage();
            return Promise.reject(new Error("登录已过期,请重新登录"));
          }

          // retryCount > 0 表示当前响应来自 ky.retry() 发起的强制重试。
          // 使用新 Token 后仍返回 401，说明新 Token 也无法通过认证；必须终止流程，
          // 否则该请求会在“刷新 → 重试 → 401”之间持续循环。
          if (retryCount > 0) {
            window.$accessToken = "";
            await redirectToAuthPage();
            return Promise.reject(new Error("刷新 Token 后请求仍返回 401"));
          }

          // 并发场景：请求 A、B 都携带旧 Token；A 先完成刷新并更新了全局 Token，
          // B 的旧 401 随后才返回。此时 B 无需再次调用刷新接口，只需换用当前 Token 重试。
          const currentToken = window.$accessToken;
          if (currentToken && request.headers.get("Authorization") !== `Bearer ${currentToken}`) {
            // 复制 Headers 和 Request，避免直接修改已经发送过的原请求对象。
            const headers = new Headers(request.headers);
            headers.set("Authorization", `Bearer ${currentToken}`);
            return ky.retry({
              request: new Request(request, { headers }),
              code: "TOKEN_REFRESHED",
            });
          }

          // 请求携带的 Token 与当前全局 Token 一致，说明当前访问 Token 确实已经失效。
          if (isRefreshing) {
            // 已有请求负责刷新，本请求不再重复调用刷新接口，而是暂挂到队列中。
            // 队列 Promise 会在刷新成功时解析为 ky.retry()，失败时以相同错误拒绝。
            return new Promise((resolve, reject) => {
              requestsQueue.push({
                retry: () => {
                  try {
                    // 刷新成功后复制原请求，并用最新访问 Token 替换认证请求头。
                    const headers = new Headers(request.headers);
                    headers.set("Authorization", `Bearer ${window.$accessToken}`);
                    resolve(
                      ky.retry({
                        request: new Request(request, { headers }),
                        code: "TOKEN_REFRESHED",
                      })
                    );
                  } catch (error) {
                    // Request 复制或请求头构造失败时，只拒绝当前暂挂请求。
                    reject(error);
                  }
                },
                reject: reject,
              });
            });
          } else {
            // 当前请求成为本轮并发 401 中唯一负责刷新 Token 的请求。
            isRefreshing = true;

            try {
              // 刷新 Token 由 Cookie 自动携带；接口响应 data 为新的访问 Token。
              window.$accessToken = (await kyInstance.post<WebApiResponse<string>>(RefreshTokenApiPath).json()).data;
              // HTTP 请求成功但未返回有效 Token，同样视为刷新失败。
              if (!window.$accessToken) {
                throw new Error("授权 Token 无效");
              }
            } catch (error) {
              // 刷新失败时，所有等待请求都不应继续发送；统一传递刷新错误并清空队列。
              requestsQueue.forEach(cb => cb.reject(error));
              requestsQueue.splice(0);
              window.$accessToken = "";
              throw error;
            } finally {
              // 无论刷新成功还是失败，都必须释放刷新锁，允许后续请求开启新一轮刷新。
              isRefreshing = false;
            }

            // 刷新成功后先唤醒等待队列；每个回调都会使用新 Token 构造自己的重试请求。
            requestsQueue.forEach(cb => cb.retry());
            requestsQueue.splice(0);

            // 最初负责刷新 Token 的请求不在等待队列中，因此需要在此单独重试。
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
        // 所有最终向调用方抛出的错误统一在此提示；相同并发错误由 showErrorMessage 去重。
        const message = `${error.name}：${error.message}`;
        showErrorMessage(message);
        // beforeError 必须返回 Error，供 ky 继续执行后续 beforeError hook 并最终抛出。
        return error;
      },
    ],
  },
});

/**
 * 面向业务代码的请求封装，仅返回统一响应结构中的 data。
 */
class http {
  /** 发送 GET 请求并返回响应 data。 */
  async get<T = any>(url: string, options?: Options): Promise<T | null | undefined> {
    return kyInstance
      .get(url, options)
      .json<WebApiResponse<T>>()
      .then(r => r.data);
  }

  /** 发送 POST 请求并返回响应 data。 */
  async post<T = any>(url: string, options?: Options): Promise<T | null | undefined> {
    return kyInstance
      .post(url, options)
      .json<WebApiResponse<T>>()
      .then(r => r.data);
  }
}

export default new http();
