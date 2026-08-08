<template>
  <n-layout-sider
    bordered
    collapse-mode="width"
    :collapsed="collapsed"
    :collapsed-width="64"
    :width="240"
    :native-scrollbar="false"
  >
    <div class="brand" :class="{ 'brand--collapsed': collapsed }">
      <div class="brand-mark">72</div>
      <span v-if="!collapsed">SeventyTwo</span>
    </div>

    <n-menu
      :value="activeMenu"
      :collapsed="collapsed"
      :collapsed-width="64"
      :collapsed-icon-size="22"
      :options="menuOptions"
    ></n-menu>
  </n-layout-sider>
</template>

<!--suppress SpellCheckingInspection -->
<script setup lang="ts">
import { NLayoutSider, NMenu, type MenuOption, NIcon } from "naive-ui";
import { type Component, computed, h, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { usePermissionsStore } from "@/stores/permissions.ts";
import * as LucideIcons from "@lucide/vue";

defineProps<{
  collapsed: boolean;
}>();

const route = useRoute();
const activeMenu = computed(() => route.path);
console.log(route.path, "route.path");
const menuOptions = ref<MenuOption[]>([]);

function renderIcon(name?: string): MenuOption["icon"] {
  if (!name) {
    return undefined;
  }

  const icon = (LucideIcons as unknown as Record<string, Component>)[name];
  if (!icon) {
    console.warn(`不存在 Lucide 图标：${name}`);
    return undefined;
  }

  return () =>
    h(NIcon, null, {
      default: () => h(icon),
    });
}

onMounted(async () => {
  const permissionsStore = usePermissionsStore();
  const permissions = await permissionsStore.getPermissions();
  console.log(permissions, "555");
  const temMenuOptions: Array<MenuOption> = [];
  permissions.menus.forEach(x => {
    const temMenu: MenuOption = {
      label: x.title,
      key: x.routePath,
      icon: renderIcon(x.icon),
      show: x.metaData.isShow,
      children: [],
    };
    temMenuOptions.push(temMenu);
    if (x.parentId == null) {
      menuOptions.value.push(temMenu);
    }
  });

  temMenuOptions.forEach(x => {
    if (x.children?.length === 0) {
      x.children = undefined;
    }
  });
});
</script>

<!--suppress SpellCheckingInspection -->
<style scoped lang="scss">
.n-layout-sider {
  min-height: 100vh;
}

.brand {
  height: 64px;
  padding: 0 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
}

.brand--collapsed {
  justify-content: center;
  padding: 0;
}

.brand-mark {
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: #fff;
  background: #18a058;
  font-size: 14px;
  font-weight: 700;
}
</style>
