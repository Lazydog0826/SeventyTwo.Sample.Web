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
      @update:value="handleUpdateValue"
    ></n-menu>
  </n-layout-sider>
</template>

<!--suppress SpellCheckingInspection -->
<script setup lang="ts">
import { NLayoutSider, NMenu, type MenuOption, NIcon } from "naive-ui";
import { type Component, computed, h, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { usePermissionsStore } from "@/stores/permissions.ts";
import * as LucideIcons from "@lucide/vue";

defineProps<{
  collapsed: boolean;
}>();

const route = useRoute();
const router = useRouter();
const activeMenu = computed(() => route.path);
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
      default: () => h(icon, { size: 16, strokeWidth: 1 }),
    });
}

onMounted(async () => {
  const permissionsStore = usePermissionsStore();
  const permissions = await permissionsStore.getPermissions();
  const menus = [...permissions.menus].sort((a, b) => a.sortOrder - b.sortOrder);
  const menuOptionMap = new Map<string, MenuOption>();

  // 第一轮设置映射
  menus.forEach(x => {
    const newMenuOption: MenuOption = {
      label: x.title,
      key: x.routePath,
      icon: renderIcon(x.icon),
      show: x.metaData.isShow,
      children: undefined,
    };
    menuOptionMap.set(x.id, newMenuOption);
  });

  // 第二轮设置上下级关系
  menus.forEach(x => {
    const temMenuOption = menuOptionMap.get(x.id);

    if (x.parentId) {
      const parentMenuOption = menuOptionMap.get(x.parentId);
      if (parentMenuOption && temMenuOption) {
        parentMenuOption.children ??= [];
        parentMenuOption.children.push(temMenuOption);
      }
    } else {
      if (temMenuOption) {
        menuOptions.value.push(temMenuOption);
      }
    }
  });
});

function handleUpdateValue(key: string, _: MenuOption) {
  if (route.path !== key) {
    router.push(key);
  }
}
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
