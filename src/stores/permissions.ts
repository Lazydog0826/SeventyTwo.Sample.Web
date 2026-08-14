import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import { getPermissions as getPermissionsApi, type PermissionOutput } from "@/api/permissions.ts";

export type PermissionMatchMode = "All" | "Any";

export const usePermissionsStore = defineStore("permissions", () => {
  // 权限在当前登录会话内只加载一次，避免每次路由跳转都重复请求。
  const isLoad = ref<boolean>(false);
  // 供界面展示权限加载状态。
  const isLoading = ref<boolean>(false);
  const permissions = reactive<PermissionOutput>({
    menus: [],
    buttonCodes: [],
  });
  // 使用 Set 降低页面内频繁校验按钮权限时的查找开销。
  const buttonCodeSet = computed(() => new Set(permissions.buttonCodes));
  // 多个调用方同时获取权限时共享同一个请求，避免重复注册动态路由。
  let loadingPromise: Promise<PermissionOutput> | null = null;
  // 每次重置递增版本；请求仅在版本未变化时回写，避免旧账号权限污染新会话。
  let stateVersion = 0;

  const getPermissions = async () => {
    if (isLoad.value) {
      return permissions;
    }

    if (!loadingPromise) {
      const requestVersion = stateVersion;
      isLoading.value = true;
      loadingPromise = (async () => {
        const result = await getPermissionsApi();
        if (!result) {
          throw new Error("获取权限失败：接口未返回有效数据");
        }

        if (requestVersion === stateVersion) {
          permissions.menus = result.menus;
          permissions.buttonCodes = result.buttonCodes;
          isLoad.value = true;
        }
        return permissions;
      })();
    }

    const currentPromise = loadingPromise;
    try {
      return await currentPromise;
    } finally {
      if (loadingPromise === currentPromise) {
        loadingPromise = null;
        isLoading.value = false;
      }
    }
  };

  const hasPermission = (code: string) => buttonCodeSet.value.has(code);

  const hasPermissions = (codes: readonly string[], mode: PermissionMatchMode = "Any") => {
    if (codes.length === 0) return false;
    return mode === "All" ? codes.every(hasPermission) : codes.some(hasPermission);
  };

  /** 清空当前会话的权限缓存，使下次访问业务页面时重新加载权限。 */
  const reset = () => {
    stateVersion++;
    // 解除对旧请求的复用；旧请求即使随后完成，也会因版本不一致而被忽略。
    loadingPromise = null;
    isLoad.value = false;
    isLoading.value = false;
    permissions.menus = [];
    permissions.buttonCodes = [];
  };

  return {
    isLoading,
    getPermissions,
    hasPermission,
    hasPermissions,
    reset,
  };
});
