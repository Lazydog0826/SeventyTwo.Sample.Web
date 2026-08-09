<template>
  <div class="permission-list-page">
    <n-card :bordered="false" :title="t('permissions.title')">
      <n-space class="filters" :wrap="true">
        <n-input
          v-model:value="keyword"
          clearable
          :placeholder="t('permissions.filters.keyword')"
          class="keyword-input"
        />
        <n-select
          v-model:value="typeFilter"
          clearable
          :placeholder="t('permissions.filters.type')"
          :options="typeOptions"
          class="filter-select"
        />
        <n-select
          v-model:value="statusFilter"
          clearable
          :placeholder="t('permissions.filters.status')"
          :options="statusOptions"
          class="filter-select"
        />
      </n-space>

      <n-data-table
        v-model:expanded-row-keys="expandedRowKeys"
        :columns="columns"
        :data="filteredTree"
        :loading="loading"
        :row-key="row => row.id"
        :scroll-x="1540"
        :single-line="false"
        striped
      >
        <template #empty>
          <n-empty :description="emptyDescription" />
        </template>
      </n-data-table>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from "vue";
import {
  NCard,
  NDataTable,
  NEllipsis,
  NEmpty,
  NInput,
  NSelect,
  NSpace,
  NTag,
  type DataTableColumns,
  type DataTableRowKey,
} from "naive-ui";
import {
  getPermissionList,
  type PermissionListOutput,
  type PermissionType,
} from "@/api/permissions.ts";
import { useI18n } from "vue-i18n";

interface PermissionTreeNode extends PermissionListOutput {
  children?: PermissionTreeNode[];
}

type StatusFilter = "enabled" | "disabled";

const { t } = useI18n();
const keyword = ref("");
const typeFilter = ref<PermissionType | null>(null);
const statusFilter = ref<StatusFilter | null>(null);
const loading = ref(false);
const permissions = ref<PermissionListOutput[]>([]);
const expandedRowKeys = ref<DataTableRowKey[]>([]);

const typeOptions = computed(() => [
  { label: t("permissions.types.directory"), value: "Directory" },
  { label: t("permissions.types.page"), value: "Page" },
  { label: t("permissions.types.button"), value: "Button" },
]);

const statusOptions = computed(() => [
  { label: t("permissions.statuses.enabled"), value: "enabled" },
  { label: t("permissions.statuses.disabled"), value: "disabled" },
]);

const typeTagTypes: Record<PermissionType, "default" | "info" | "warning"> = {
  Directory: "warning",
  Page: "info",
  Button: "default",
};

const permissionTree = computed(() => buildPermissionTree(permissions.value));
const hasFilter = computed(
  () => Boolean(keyword.value.trim()) || typeFilter.value !== null || statusFilter.value !== null
);
const filteredTree = computed(() => {
  if (!hasFilter.value) {
    return permissionTree.value;
  }
  return filterPermissionTree(permissionTree.value);
});
const emptyDescription = computed(() =>
  t(hasFilter.value ? "permissions.empty.filtered" : "permissions.empty.data")
);

const columns = computed<DataTableColumns<PermissionTreeNode>>(() => [
  {
    title: t("permissions.columns.title"),
    key: "title",
    width: 190,
    fixed: "left",
    ellipsis: { tooltip: true },
  },
  {
    title: t("permissions.columns.code"),
    key: "code",
    width: 180,
    render: row => renderText(row.code, 160),
  },
  {
    title: t("permissions.columns.type"),
    key: "type",
    width: 90,
    render: row =>
      h(
        NTag,
        { type: typeTagTypes[row.type], bordered: false },
        { default: () => t(`permissions.types.${row.type.toLocaleLowerCase()}`) }
      ),
  },
  {
    title: t("permissions.columns.status"),
    key: "enable",
    width: 90,
    render: row =>
      h(
        NTag,
        { type: row.enable ? "success" : "error", bordered: false },
        { default: () => t(row.enable ? "permissions.statuses.enabled" : "permissions.statuses.disabled") }
      ),
  },
  { title: t("permissions.columns.sortOrder"), key: "sortOrder", width: 80 },
  {
    title: t("permissions.columns.icon"),
    key: "icon",
    width: 120,
    render: row => renderText(row.icon, 100),
  },
  {
    title: t("permissions.columns.routePath"),
    key: "routePath",
    width: 190,
    render: row => renderText(row.routePath, 170),
  },
  {
    title: t("permissions.columns.routeName"),
    key: "routeName",
    width: 170,
    render: row => renderText(row.routeName, 150),
  },
  {
    title: t("permissions.columns.componentPath"),
    key: "vueComponentPath",
    width: 260,
    render: row => renderText(row.vueComponentPath, 240),
  },
  {
    title: t("permissions.columns.metaData"),
    key: "metaData",
    width: 170,
    render: row => t(row.metaData.isShow ? "permissions.metaData.show" : "permissions.metaData.hide"),
  },
]);

function renderText(value: string, maxWidth: number) {
  return h(
    NEllipsis,
    { tooltip: true, style: { maxWidth: `${maxWidth}px` } },
    { default: () => value || "-" }
  );
}

function buildPermissionTree(items: PermissionListOutput[]): PermissionTreeNode[] {
  const nodes = new Map<string, PermissionTreeNode>();
  const roots: PermissionTreeNode[] = [];

  items.forEach(item => nodes.set(item.id, { ...item }));
  items.forEach(item => {
    const node = nodes.get(item.id)!;
    const parent = item.parentId ? nodes.get(item.parentId) : undefined;
    if (!parent) {
      roots.push(node);
      return;
    }
    (parent.children ??= []).push(node);
  });

  sortTree(roots);
  return roots;
}

function sortTree(nodes: PermissionTreeNode[]) {
  nodes.sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id));
  nodes.forEach(node => {
    if (node.children) {
      sortTree(node.children);
    }
  });
}

function filterPermissionTree(nodes: PermissionTreeNode[]): PermissionTreeNode[] {
  const normalizedKeyword = keyword.value.trim().toLocaleLowerCase();
  return nodes.flatMap(node => {
    const children = node.children ? filterPermissionTree(node.children) : [];
    const matchesKeyword =
      !normalizedKeyword ||
      node.title.toLocaleLowerCase().includes(normalizedKeyword) ||
      node.code.toLocaleLowerCase().includes(normalizedKeyword);
    const matchesType = typeFilter.value === null || node.type === typeFilter.value;
    const matchesStatus =
      statusFilter.value === null ||
      (statusFilter.value === "enabled" ? node.enable : !node.enable);
    if (!(matchesKeyword && matchesType && matchesStatus) && children.length === 0) {
      return [];
    }
    return [{ ...node, children: children.length > 0 ? children : undefined }];
  });
}

function collectExpandableKeys(nodes: PermissionTreeNode[]): DataTableRowKey[] {
  return nodes.flatMap(node => {
    if (!node.children?.length) {
      return [];
    }
    return [node.id, ...collectExpandableKeys(node.children)];
  });
}

async function loadPermissions() {
  loading.value = true;
  try {
    permissions.value = (await getPermissionList()) ?? [];
    expandedRowKeys.value = collectExpandableKeys(permissionTree.value);
  } finally {
    loading.value = false;
  }
}

watch([keyword, typeFilter, statusFilter], () => {
  expandedRowKeys.value = collectExpandableKeys(filteredTree.value);
});

onMounted(loadPermissions);
</script>

<style scoped lang="scss">
.permission-list-page {
  min-width: 0;
}

.filters {
  margin-bottom: 20px;
}

.keyword-input {
  width: 280px;
}

.filter-select {
  width: 160px;
}

@media (max-width: 640px) {
  .keyword-input,
  .filter-select {
    width: 100%;
  }
}
</style>
