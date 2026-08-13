<template>
  <div class="permission-list-page">
    <n-card :bordered="false" :title="t('permissions.title')">
      <div class="toolbar">
        <n-space :wrap="true" class="filters">
          <n-input
            v-model:value="keyword"
            :placeholder="t('permissions.filters.keyword')"
            class="keyword-input"
            clearable
          />
          <n-select
            v-model:value="typeFilter"
            :options="typeOptions"
            :placeholder="t('permissions.filters.type')"
            class="filter-select"
            clearable
          />
          <n-select
            v-model:value="statusFilter"
            :options="statusOptions"
            :placeholder="t('permissions.filters.status')"
            class="filter-select"
            clearable
          />
        </n-space>
        <n-button v-if="canCreate" type="primary" @click="openCreate">
          {{ t("permissions.actions.create") }}
        </n-button>
      </div>

      <n-data-table
        v-model:expanded-row-keys="expandedRowKeys"
        :columns="columns"
        :data="filteredTree"
        :loading="loading"
        :row-key="row => row.id"
        :scroll-x="hasActions ? 1720 : 1540"
        :single-line="false"
        striped
      >
        <template #empty>
          <n-empty :description="emptyDescription" />
        </template>
      </n-data-table>
    </n-card>

    <n-modal
      v-model:show="showEditor"
      :title="editorTitle"
      preset="card"
      style="width: 600px; max-width: calc(100vw - 32px)"
    >
      <n-form ref="formRef" :model="formModel" :rules="formRules" label-placement="left" label-width="auto">
        <n-form-item :label="t('permissions.form.code')" path="code">
          <n-input v-model:value="formModel.code" :placeholder="t('permissions.placeholders.code')" />
        </n-form-item>
        <n-form-item :label="t('permissions.form.title')" path="title">
          <n-input v-model:value="formModel.title" :placeholder="t('permissions.placeholders.title')" />
        </n-form-item>
        <n-form-item :label="t('permissions.form.type')" path="type">
          <n-select
            v-model:value="formModel.type"
            :options="typeOptions"
            :placeholder="t('permissions.placeholders.type')"
          />
        </n-form-item>
        <n-form-item :label="t('permissions.form.parent')" path="parentId">
          <n-tree-select
            v-model:value="formModel.parentId"
            :options="parentOptions"
            :placeholder="t('permissions.placeholders.parent')"
            clearable
            filterable
          />
        </n-form-item>
        <n-form-item :label="t('permissions.form.sortOrder')" path="sortOrder">
          <n-input-number
            v-model:value="formModel.sortOrder"
            :min="0"
            :placeholder="t('permissions.placeholders.sortOrder')"
          />
        </n-form-item>
        <n-form-item :label="t('permissions.form.enable')" path="enable">
          <n-switch v-model:value="formModel.enable" />
        </n-form-item>
        <n-form-item :label="t('permissions.form.icon')" path="icon">
          <n-select
            v-model:value="formModel.icon"
            :options="iconOptions"
            :placeholder="t('permissions.placeholders.icon')"
            :render-label="renderIconOption"
            clearable
            filterable
          />
        </n-form-item>
        <n-form-item :label="t('permissions.form.componentPath')" path="vueComponentPath">
          <n-input
            v-model:value="formModel.vueComponentPath"
            :placeholder="t('permissions.placeholders.componentPath')"
          />
        </n-form-item>
        <n-form-item :label="t('permissions.form.routePath')" path="routePath">
          <n-input v-model:value="formModel.routePath" :placeholder="t('permissions.placeholders.routePath')" />
        </n-form-item>
        <n-form-item :label="t('permissions.form.routeName')" path="routeName">
          <n-input v-model:value="formModel.routeName" :placeholder="t('permissions.placeholders.routeName')" />
        </n-form-item>
        <n-form-item :label="t('permissions.form.isShow')" path="isShow">
          <n-switch v-model:value="formModel.isShow" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showEditor = false">{{ t("permissions.actions.cancel") }}</n-button>
          <n-button :loading="submitting" type="primary" @click="submitEditor">
            {{ t("permissions.actions.save") }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showDeleteConfirm" :title="t('permissions.delete.title')" preset="dialog" type="warning">
      {{ t("permissions.delete.content", { title: deletingPermission?.title ?? "" }) }}
      <template #action>
        <n-space justify="end">
          <n-button @click="showDeleteConfirm = false">{{ t("permissions.actions.cancel") }}</n-button>
          <n-button :loading="deleting" type="error" @click="confirmDelete">
            {{ t("permissions.actions.delete") }}
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import { type Component, computed, h, onMounted, reactive, ref, watch } from "vue";
import * as LucideIcons from "@lucide/vue";
import {
  type DataTableColumns,
  type DataTableRowKey,
  type FormInst,
  type FormRules,
  NButton,
  NCard,
  NDataTable,
  NEllipsis,
  NEmpty,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NInputNumber,
  NModal,
  NSelect,
  NSpace,
  NSwitch,
  NTag,
  NTreeSelect,
  type SelectOption,
  type TreeSelectOption,
} from "naive-ui";
import {
  createPermission,
  deletePermission,
  getPermissionDetail,
  getPermissionList,
  type PermissionListOutput,
  type PermissionMutationInput,
  type PermissionType,
  updatePermission,
} from "@/api/permissions.ts";
import { usePermissionsStore } from "@/stores/permissions.ts";
import { PermissionCode } from "@/constants/permissions.ts";
import { useI18n } from "vue-i18n";

interface PermissionTreeNode extends PermissionListOutput {
  children?: PermissionTreeNode[];
}

interface PermissionFormModel extends Omit<PermissionMutationInput, "icon"> {
  id: string | null;
  version: string | null;
  icon: string | null;
  isShow: boolean;
}

type StatusFilter = "enabled" | "disabled";

const { t } = useI18n();
const permissionsStore = usePermissionsStore();
const keyword = ref("");
const typeFilter = ref<PermissionType | null>(null);
const statusFilter = ref<StatusFilter | null>(null);
const loading = ref(false);
const submitting = ref(false);
const deleting = ref(false);
const editingLoadingId = ref<string | null>(null);
let editRequestSequence = 0;
const permissions = ref<PermissionListOutput[]>([]);
const expandedRowKeys = ref<DataTableRowKey[]>([]);
const canCreate = computed(() => permissionsStore.hasPermission(PermissionCode.PermissionsCreate));
const canUpdate = computed(() => permissionsStore.hasPermission(PermissionCode.PermissionsUpdate));
const canDelete = computed(() => permissionsStore.hasPermission(PermissionCode.PermissionsDelete));
const showEditor = ref(false);
const showDeleteConfirm = ref(false);
const deletingPermission = ref<PermissionListOutput | null>(null);
const formRef = ref<FormInst | null>(null);
const formModel = reactive<PermissionFormModel>(createEmptyForm());

const typeOptions = computed(() => [
  { label: t("permissions.types.directory"), value: "Directory" },
  { label: t("permissions.types.page"), value: "Page" },
  { label: t("permissions.types.button"), value: "Button" },
]);

const statusOptions = computed(() => [
  { label: t("permissions.statuses.enabled"), value: "enabled" },
  { label: t("permissions.statuses.disabled"), value: "disabled" },
]);

const lucideIconComponents = LucideIcons as unknown as Record<string, Component>;
// 仅保留可直接作为图标名称保存的导出，排除工具函数及重复的 Lucide/Icon 命名导出。
const iconOptions: SelectOption[] = Object.keys(lucideIconComponents)
  .filter(
    name =>
      typeof lucideIconComponents[name] === "function" &&
      /^[A-Z]/.test(name) &&
      name !== "Icon" &&
      !name.startsWith("Lucide") &&
      !name.endsWith("Icon")
  )
  .sort((left, right) => left.localeCompare(right))
  .map(name => ({ label: name, value: name }));
const typeTagTypes: Record<PermissionType, "default" | "info" | "warning"> = {
  Directory: "warning",
  Page: "info",
  Button: "default",
};

const permissionTree = computed(() => buildPermissionTree(permissions.value));
const hasActions = computed(() => canUpdate.value || canDelete.value);
const hasFilter = computed(
  () => Boolean(keyword.value.trim()) || typeFilter.value !== null || statusFilter.value !== null
);
const filteredTree = computed(() =>
  hasFilter.value ? filterPermissionTree(permissionTree.value) : permissionTree.value
);
const emptyDescription = computed(() => t(hasFilter.value ? "permissions.empty.filtered" : "permissions.empty.data"));
const editorTitle = computed(() =>
  t(formModel.id ? "permissions.editor.updateTitle" : "permissions.editor.createTitle")
);
// 编辑时禁止选择自身及任意后代作为上级，前端提前避免构造循环权限树。
const excludedParentIds = computed(() => {
  if (!formModel.id) return new Set<string>();
  return new Set([formModel.id, ...collectDescendantIds(formModel.id)]);
});
const parentOptions = computed<TreeSelectOption[]>(() => buildParentOptions(permissionTree.value));
const formRules = computed<FormRules>(() => ({
  code: { required: true, message: t("permissions.validation.code"), trigger: ["input", "blur"] },
  title: { required: true, message: t("permissions.validation.title"), trigger: ["input", "blur"] },
  type: { required: true, message: t("permissions.validation.type"), trigger: "change" },
  sortOrder: {
    required: true,
    trigger: ["input", "blur"],
    validator: (_rule, value) =>
      typeof value === "number" && value >= 0 ? true : new Error(t("permissions.validation.sortOrder")),
  },
  icon: {
    trigger: ["input", "blur"],
    validator: (_rule, value) =>
      formModel.type !== "Directory" || String(value ?? "").trim() ? true : new Error(t("permissions.validation.icon")),
  },
  vueComponentPath: requiredForPage("componentPath"),
  routePath: requiredForPage("routePath"),
  routeName: requiredForPage("routeName"),
  parentId: {
    trigger: "change",
    validator: (_rule, value) =>
      formModel.type !== "Button" || value ? true : new Error(t("permissions.validation.parent")),
  },
}));

const columns = computed<DataTableColumns<PermissionTreeNode>>(() => {
  const result: DataTableColumns<PermissionTreeNode> = [
    { title: t("permissions.columns.title"), key: "title", minWidth: 190, fixed: "left", ellipsis: { tooltip: true } },
    { title: t("permissions.columns.code"), key: "code", minWidth: 180, render: row => renderText(row.code, 160) },
    {
      title: t("permissions.columns.type"),
      key: "type",
      minWidth: 90,
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
      minWidth: 90,
      render: row =>
        h(
          NTag,
          { type: row.enable ? "success" : "error", bordered: false },
          { default: () => t(row.enable ? "permissions.statuses.enabled" : "permissions.statuses.disabled") }
        ),
    },
    { title: t("permissions.columns.sortOrder"), key: "sortOrder", minWidth: 80 },
    { title: t("permissions.columns.icon"), key: "icon", minWidth: 120, render: row => renderText(row.icon, 100) },
    {
      title: t("permissions.columns.routePath"),
      key: "routePath",
      minWidth: 190,
      render: row => renderText(row.routePath, 170),
    },
    {
      title: t("permissions.columns.routeName"),
      key: "routeName",
      minWidth: 170,
      render: row => renderText(row.routeName, 150),
    },
    {
      title: t("permissions.columns.componentPath"),
      key: "vueComponentPath",
      minWidth: 260,
      render: row => renderText(row.vueComponentPath, 240),
    },
    {
      title: t("permissions.columns.metaData"),
      key: "metaData",
      minWidth: 170,
      render: row => t(row.metaData.isShow ? "permissions.metaData.show" : "permissions.metaData.hide"),
    },
  ];
  if (hasActions.value) {
    result.push({
      title: t("permissions.columns.actions"),
      key: "actions",
      minWidth: 180,
      fixed: "right",
      render: row =>
        h(NSpace, null, {
          default: () => [
            canUpdate.value
              ? h(
                  NButton,
                  {
                    text: true,
                    type: "primary",
                    loading: editingLoadingId.value === row.id,
                    disabled: editingLoadingId.value === row.id,
                    onClick: () => openEdit(row),
                  },
                  { default: () => t("permissions.actions.edit") }
                )
              : null,
            canDelete.value
              ? h(
                  NButton,
                  { text: true, type: "error", onClick: () => openDelete(row) },
                  { default: () => t("permissions.actions.delete") }
                )
              : null,
          ],
        }),
    });
  }
  return result;
});

function createEmptyForm(): PermissionFormModel {
  return {
    id: null,
    version: null,
    code: "",
    title: "",
    type: "Page",
    enable: true,
    sortOrder: 0,
    icon: null,
    vueComponentPath: "",
    routePath: "",
    routeName: "",
    parentId: null,
    metaData: { isShow: true },
    isShow: true,
  };
}

function requiredForPage(field: "componentPath" | "routePath" | "routeName") {
  return {
    trigger: ["input", "blur"],
    validator: (_rule: unknown, value: unknown) =>
      formModel.type !== "Page" || String(value ?? "").trim() ? true : new Error(t(`permissions.validation.${field}`)),
  };
}

function renderText(value: string, maxWidth: number) {
  return h(NEllipsis, { tooltip: true, style: { maxWidth: `${maxWidth}px` } }, { default: () => value || "-" });
}

function buildPermissionTree(items: PermissionListOutput[]): PermissionTreeNode[] {
  // 接口返回扁平数据；通过两次遍历复用节点对象并恢复父子关系。
  const nodes = new Map<string, PermissionTreeNode>();
  const roots: PermissionTreeNode[] = [];
  items.forEach(item => nodes.set(item.id, { ...item }));
  items.forEach(item => {
    const node = nodes.get(item.id)!;
    const parent = item.parentId ? nodes.get(item.parentId) : undefined;
    if (!parent) roots.push(node);
    else (parent.children ??= []).push(node);
  });
  sortTree(roots);
  return roots;
}

function sortTree(nodes: PermissionTreeNode[]) {
  nodes.sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id));
  nodes.forEach(node => node.children && sortTree(node.children));
}

function buildParentOptions(nodes: PermissionTreeNode[]): TreeSelectOption[] {
  return nodes.flatMap(node => {
    if (excludedParentIds.value.has(node.id)) return [];
    const children = buildParentOptions(node.children ?? []);
    return [
      {
        label: `${node.title} (${node.code})`,
        key: node.id,
        children: children.length ? children : undefined,
      },
    ];
  });
}

function collectDescendantIds(id: string): string[] {
  const children = permissions.value.filter(permission => permission.parentId === id);
  return children.flatMap(child => [child.id, ...collectDescendantIds(child.id)]);
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
      statusFilter.value === null || (statusFilter.value === "enabled" ? node.enable : !node.enable);
    if (!(matchesKeyword && matchesType && matchesStatus) && children.length === 0) return [];
    return [{ ...node, children: children.length > 0 ? children : undefined }];
  });
}

function collectExpandableKeys(nodes: PermissionTreeNode[]): DataTableRowKey[] {
  return nodes.flatMap(node => (node.children?.length ? [node.id, ...collectExpandableKeys(node.children)] : []));
}

function openCreate() {
  editRequestSequence++;
  editingLoadingId.value = null;
  Object.assign(formModel, createEmptyForm());
  showEditor.value = true;
}

async function openEdit(permission: PermissionListOutput) {
  if (editingLoadingId.value === permission.id) return;
  const requestSequence = ++editRequestSequence;
  showEditor.value = false;
  editingLoadingId.value = permission.id;
  try {
    const detail = await getPermissionDetail(permission.id);
    if (!detail || requestSequence !== editRequestSequence) return;
    Object.assign(formModel, {
      ...detail,
      isShow: detail.metaData.isShow,
    });
    showEditor.value = true;
  } catch {
    // 错误由统一请求处理展示，详情失败时保持编辑弹窗关闭。
  } finally {
    if (requestSequence === editRequestSequence) editingLoadingId.value = null;
  }
}

function renderIconOption(option: SelectOption) {
  const name = String(option.value ?? "");
  const icon = lucideIconComponents[name];
  return h("div", { style: { display: "flex", alignItems: "center", gap: "8px" } }, [
    icon ? h(NIcon, { size: 18 }, { default: () => h(icon) }) : null,
    h("span", name),
  ]);
}

function openDelete(permission: PermissionListOutput) {
  deletingPermission.value = permission;
  showDeleteConfirm.value = true;
}

async function submitEditor() {
  await formRef.value?.validate();
  submitting.value = true;
  try {
    const input: PermissionMutationInput = {
      code: formModel.code,
      title: formModel.title,
      type: formModel.type,
      enable: formModel.enable,
      sortOrder: formModel.sortOrder,
      icon: formModel.icon ?? "",
      vueComponentPath: formModel.vueComponentPath,
      routePath: formModel.routePath,
      routeName: formModel.routeName,
      parentId: formModel.parentId,
      metaData: { isShow: formModel.isShow },
    };
    if (formModel.id && formModel.version) {
      await updatePermission({ ...input, id: formModel.id, version: formModel.version });
      window.$message.success(t("permissions.messages.updated"));
    } else {
      await createPermission(input);
      window.$message.success(t("permissions.messages.created"));
    }
    showEditor.value = false;
    await loadPermissions();
  } finally {
    submitting.value = false;
  }
}

async function confirmDelete() {
  if (!deletingPermission.value) return;
  deleting.value = true;
  try {
    await deletePermission(deletingPermission.value.id);
    window.$message.success(t("permissions.messages.deleted"));
    showDeleteConfirm.value = false;
    deletingPermission.value = null;
    await loadPermissions();
  } finally {
    deleting.value = false;
  }
}

async function loadPermissions() {
  loading.value = true;
  try {
    permissions.value = (await getPermissionList()) ?? [];
    expandedRowKeys.value = [];
  } finally {
    loading.value = false;
  }
}

watch([keyword, typeFilter, statusFilter], () => {
  expandedRowKeys.value = collectExpandableKeys(filteredTree.value);
});

onMounted(() => Promise.all([loadPermissions(), permissionsStore.getPermissions()]));
</script>

<style lang="scss" scoped>
.permission-list-page {
  min-width: 0;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}
.keyword-input {
  width: 280px;
}
.filter-select {
  width: 160px;
}
@media (max-width: 640px) {
  .toolbar {
    align-items: stretch;
    flex-direction: column;
  }
  .keyword-input,
  .filter-select {
    width: 100%;
  }
}
</style>
