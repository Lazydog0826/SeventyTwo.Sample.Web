<template>
  <n-layout-sider
    bordered
    collapse-mode="width"
    :collapsed="collapsed"
    :collapsed-width="64"
    :width="240"
    :native-scrollbar="false"
  >
    <div class="sidebar-content">
      <div v-if="loading" class="menu-loading" aria-live="polite" :aria-label="t('common.menuLoading')">
        <n-spin size="small"></n-spin>
      </div>
      <n-menu
        v-else
        :default-expanded-keys="defaultExpandedKeys"
        :watch-props="['defaultExpandedKeys']"
        :value="activeMenu"
        :collapsed="collapsed"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        :options="menuOptions"
        @update:value="handleUpdateValue"
      ></n-menu>

      <div class="sidebar-footer" :class="{ 'sidebar-footer--collapsed': collapsed }">
        <n-button
          quaternary
          circle
          :aria-label="t(collapsed ? 'common.expandSidebar' : 'common.collapseSidebar')"
          @click="emit('toggle')"
        >
          <template #icon>
            <n-icon>
              <PanelLeftOpen v-if="collapsed"></PanelLeftOpen>
              <PanelLeftClose v-else></PanelLeftClose>
            </n-icon>
          </template>
        </n-button>
      </div>
    </div>
  </n-layout-sider>
</template>

<!--suppress SpellCheckingInspection -->
<script setup lang="ts">
import { NButton, NLayoutSider, NMenu, type MenuOption, NIcon, NSpin } from "naive-ui";
import { PanelLeftClose, PanelLeftOpen } from "@lucide/vue";
import { type Component, computed, h, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { usePermissionsStore } from "@/stores/permissions.ts";
import * as LucideIcons from "@lucide/vue";
import type { PermissionMenuOutput } from "@/api/permissions.ts";

defineProps<{
  collapsed: boolean;
}>();

const emit = defineEmits<{
  toggle: [];
}>();

const route = useRoute();
const router = useRouter();
const { rt, t, tm } = useI18n();
const activeMenu = computed(() => route.path);
const defaultExpandedKeys = ref<Array<string>>([]);
const menuOptions = ref<MenuOption[]>([]);
const loading = ref(true);
const menuOptionMap = new Map<string, MenuOption>();
const menus = ref<Array<PermissionMenuOutput>>([]);

function translateMenuTitle(code: string, fallback: string) {
  const menuMessages = tm("menu") as Record<string, unknown>;
  const message = menuMessages[code];
  return typeof message === "string" ? rt(message) : fallback;
}

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
  try {
    const permissionsStore = usePermissionsStore();
    const permissions = await permissionsStore.getPermissions();
    menus.value = [...permissions.menus].sort((a, b) => a.sortOrder - b.sortOrder);

    // 第一轮设置映射
    menus.value.forEach(x => {
      const newMenuOption: MenuOption = {
        label: () => translateMenuTitle(x.code, x.title),
        key: x.routePath || x.code,
        icon: renderIcon(x.icon),
        show: x.metaData.isShow,
        children: undefined,
      };
      menuOptionMap.set(x.id, newMenuOption);
    });

    // 第二轮设置上下级关系
    menus.value.forEach(x => {
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

    // 处理默认展开
    let loopCount = 0;
    const currRoutePath = route.path;
    let currMenu = menus.value.find(x => x.routePath === currRoutePath);
    let currParentId: string | null | undefined = null;
    if (currMenu) {
      // 当前业务菜单层级不会超过 10 层，同时以此限制异常父级循环
      while (loopCount < 10) {
        loopCount++;
        currParentId = currMenu?.parentId;
        if (currParentId === null || currParentId === undefined) break;
        currMenu = menus.value.find(x => x.id === currParentId);
        if (currMenu?.routePath || currMenu?.code)
          defaultExpandedKeys.value.push(currMenu?.routePath || currMenu?.code);
      }
    }
  } finally {
    loading.value = false;
  }
});

function handleUpdateValue(key: string, _menuOption: MenuOption) {
  if (route.path !== key) {
    router.push(key);
  }
}
</script>

<!--suppress SpellCheckingInspection -->
<style scoped lang="scss">
.n-layout-sider {
  height: calc(100vh - 64px);
}

.sidebar-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.n-menu {
  flex: 1;
  min-height: 0;
  padding-bottom: 82px;
  overflow-y: auto;
}

.menu-loading {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 24px;
}

.sidebar-footer {
  position: fixed;
  bottom: 24px;
  left: 0;
  z-index: 1;
  width: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.3s var(--n-bezier);
}

.sidebar-footer--collapsed {
  width: 64px;
}
</style>
