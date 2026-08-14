// noinspection JSUnusedGlobalSymbols

import { defineStore } from "pinia";
import { reactive, ref } from "vue";
import { getInfo as getInfoApi, type UserOutput } from "@/api/users.ts";

export const useUserStore = defineStore("users", () => {
  // 用户信息在当前登录会话内只加载一次。
  const isLoad = ref<boolean>(false);
  // 供界面展示用户信息加载状态。
  const isLoading = ref<boolean>(false);
  const user = reactive<UserOutput>({
    id: "",
    username: "",
    displayName: "",
    phone: "",
    email: "",
    defaultPagePath: "",
    dataPermissionType: "Self",
  });
  // 多个调用方同时获取用户信息时共享同一个请求，避免重复调用接口。
  let loadingPromise: Promise<UserOutput> | null = null;
  // 每次重置递增版本；请求仅在版本未变化时回写，避免旧账号信息污染新会话。
  let stateVersion = 0;

  const getInfo = async () => {
    if (isLoad.value) {
      return user;
    }

    if (!loadingPromise) {
      const requestVersion = stateVersion;
      isLoading.value = true;
      loadingPromise = (async () => {
        const result = await getInfoApi();
        if (!result) {
          throw new Error("获取用户信息失败：接口未返回有效数据");
        }

        if (requestVersion === stateVersion) {
          user.id = result.id;
          user.username = result.username;
          user.displayName = result.displayName;
          user.phone = result.phone;
          user.email = result.email;
          user.defaultPagePath = result.defaultPagePath;
          user.dataPermissionType = result.dataPermissionType;
          isLoad.value = true;
        }
        return user;
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

  /** 清空当前会话的用户缓存，使下次访问业务页面时重新获取用户信息。 */
  const reset = () => {
    stateVersion++;
    // 解除对旧请求的复用；旧请求即使随后完成，也会因版本不一致而被忽略。
    loadingPromise = null;
    isLoad.value = false;
    isLoading.value = false;
    user.id = "";
    user.username = "";
    user.displayName = "";
    user.phone = "";
    user.email = "";
    user.defaultPagePath = "";
    user.dataPermissionType = "Self";
  };

  return {
    user,
    isLoading,
    getInfo,
    reset,
  };
});
