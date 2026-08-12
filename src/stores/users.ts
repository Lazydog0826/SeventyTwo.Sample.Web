// noinspection JSUnusedGlobalSymbols

import { defineStore } from "pinia";
import { reactive, ref } from "vue";
import { getInfo as getInfoApi, type UserOutput } from "@/api/users.ts";

export const useUserStore = defineStore("users", () => {
  const isLoad = ref<boolean>(false);
  const isLoading = ref<boolean>(false);
  const user = reactive<UserOutput>({
    id: "",
    username: "",
    displayName: "",
    phone: null,
    email: null,
  });

  const getInfo = async () => {
    if (isLoad.value) {
      return user;
    }

    isLoading.value = true;
    try {
      const r = await getInfoApi();
      if (r) {
        user.id = r.id;
        user.username = r.username;
        user.displayName = r.displayName;
        user.phone = r.phone;
        user.email = r.email;
        isLoad.value = true;
      }
      return user;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    user,
    isLoading,
    getInfo,
  };
});
