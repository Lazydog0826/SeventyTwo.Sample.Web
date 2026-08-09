// noinspection JSUnusedGlobalSymbols

import { defineStore } from "pinia";
import { reactive, ref } from "vue";
import { getPermissions as getPermissionsApi, type PermissionOutput } from "@/api/permissions.ts";

export const usePermissionsStore = defineStore("permissions", () => {
  const isLoad = ref<boolean>(false);
  const permissions = reactive<PermissionOutput>({
    menus: [],
    buttonCodes: [],
  });

  const getPermissions = async () => {
    if (isLoad.value) {
      return permissions;
    }

    const result = await getPermissionsApi();
    if (result) {
      isLoad.value = true;
      permissions.menus = result.menus;
      permissions.buttonCodes = result.buttonCodes;
    }
    return permissions;
  };

  const hasPermission = async (code: string) => {
    const temPermissions = await getPermissions();
    return temPermissions.buttonCodes.includes(code);
  };

  const reloadPermissions = async () => {
    isLoad.value = false;
    return getPermissions();
  };

  return {
    getPermissions,
    hasPermission,
    reloadPermissions,
  };
});
