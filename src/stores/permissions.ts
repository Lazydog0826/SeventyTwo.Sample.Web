import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";
import { getPermissions as getPermissionsApi, type PermissionOutput } from "@/api/permissions.ts";

export type PermissionMatchMode = "All" | "Any";

export const usePermissionsStore = defineStore("permissions", () => {
  const isLoad = ref<boolean>(false);
  const permissions = reactive<PermissionOutput>({
    menus: [],
    buttonCodes: [],
  });
  const buttonCodeSet = computed(() => new Set(permissions.buttonCodes));
  let loadingPromise: Promise<PermissionOutput> | null = null;

  const getPermissions = async () => {
    if (isLoad.value) {
      return permissions;
    }

    if (!loadingPromise) {
      loadingPromise = (async () => {
        const result = await getPermissionsApi();
        if (!result) {
          throw new Error("获取权限失败：接口未返回有效数据");
        }

        permissions.menus = result.menus;
        permissions.buttonCodes = result.buttonCodes;
        isLoad.value = true;
        return permissions;
      })();
    }

    const currentPromise = loadingPromise;
    try {
      return await currentPromise;
    } finally {
      if (loadingPromise === currentPromise) loadingPromise = null;
    }
  };

  const hasPermission = (code: string) => buttonCodeSet.value.has(code);

  const hasPermissions = (codes: readonly string[], mode: PermissionMatchMode = "Any") => {
    if (codes.length === 0) return false;
    return mode === "All" ? codes.every(hasPermission) : codes.some(hasPermission);
  };

  return {
    getPermissions,
    hasPermission,
    hasPermissions,
  };
});
