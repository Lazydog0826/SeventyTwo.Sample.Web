<template>
  <div class="permission-list-page">
    <n-card :bordered="false">
      <!-- 布局规范与商品列表页一致：筛选区一行五列，不足五列用空项补齐。
           树形数据为即时过滤（输入即过滤），因此筛选区无搜索/重置按钮。 -->
      <div class="toolbar">
        <n-grid :cols="5" :x-gap="16" :y-gap="16">
          <n-gi>
            <n-input
              v-model:value="keyword"
              :disabled="actionLoading"
              :placeholder="t('permissions.filters.keyword')"
              clearable
            />
          </n-gi>
          <n-gi>
            <n-select
              v-model:value="typeFilter"
              :disabled="actionLoading"
              :options="typeOptions"
              :placeholder="t('permissions.filters.type')"
              clearable
            />
          </n-gi>
          <n-gi>
            <n-select
              v-model:value="statusFilter"
              :disabled="actionLoading"
              :options="statusOptions"
              :placeholder="t('permissions.filters.status')"
              clearable
            />
          </n-gi>
          <n-gi />
          <n-gi />
        </n-grid>
        <!-- 操作区左右分区：左侧业务操作（新建），右侧统一操作（刷新/列设置），与商品列表页一致。 -->
        <div class="action-bar">
          <n-grid :x-gap="16" :y-gap="12" cols="1 s:2" responsive="screen">
            <n-gi>
              <n-space>
                <n-button v-if="canCreate" :disabled="actionLoading" type="primary" @click="openCreate">
                  {{ t("permissions.actions.create") }}
                </n-button>
              </n-space>
            </n-gi>
            <n-gi>
              <n-space justify="end">
                <n-button
                  :aria-label="t('permissions.actions.refresh')"
                  :disabled="actionLoading"
                  :title="t('permissions.actions.refresh')"
                  quaternary
                  @click="refreshPermissions"
                >
                  <template #icon>
                    <n-icon>
                      <RefreshCw :size="16" :stroke-width="1.5"></RefreshCw>
                    </n-icon>
                  </template>
                </n-button>
                <ColumnSettings
                  :hidden-keys="hiddenKeys"
                  :items="columnSettingItems"
                  :ordered-keys="orderedKeys"
                  @move="moveColumn"
                  @reset="resetColumns"
                  @toggle="toggleColumn"
                >
                  <template #trigger>
                    <n-button
                      :aria-label="t('permissions.actions.settings')"
                      :title="t('permissions.actions.settings')"
                      quaternary
                    >
                      <template #icon>
                        <n-icon>
                          <Settings :size="16" :stroke-width="1.5"></Settings>
                        </n-icon>
                      </template>
                    </n-button>
                  </template>
                </ColumnSettings>
              </n-space>
            </n-gi>
          </n-grid>
        </div>
      </div>

      <n-data-table
        v-model:expanded-row-keys="expandedRowKeys"
        :columns="columns"
        :data="filteredTree"
        :loading="loading"
        :row-key="row => row.id"
        :scroll-x="scrollX"
        :single-line="false"
        flex-height
        striped
        style="height: 100%"
      >
        <template #empty>
          <n-empty :description="emptyDescription" />
        </template>
      </n-data-table>
    </n-card>

    <n-modal
      v-model:show="showEditor"
      :closable="!submitting"
      :close-on-esc="!submitting"
      :mask-closable="!submitting"
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
          <n-button :disabled="submitting" @click="showEditor = false">{{ t("permissions.actions.cancel") }}</n-button>
          <n-button :loading="submitting" type="primary" @click="submitEditor">
            {{ t("permissions.actions.save") }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showDeleteConfirm"
      :closable="!deleting"
      :close-on-esc="!deleting"
      :mask-closable="!deleting"
      :title="t('permissions.delete.title')"
      preset="dialog"
      type="warning"
    >
      {{ t("permissions.delete.content", { title: deletingPermission?.title ?? "" }) }}
      <template #action>
        <n-space justify="end">
          <n-button :disabled="deleting" @click="showDeleteConfirm = false">
            {{ t("permissions.actions.cancel") }}
          </n-button>
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
import { RefreshCw, Settings } from "@lucide/vue";
import {
  type DataTableColumn,
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
  NGi,
  NGrid,
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
import ColumnSettings from "@/components/ColumnSettings.vue";
import { useColumnSettings } from "@/composables/useColumnSettings.ts";
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
// 页面操作统一互斥：列表加载、提交、删除、详情加载任一进行中时禁用全部操作入口。
const actionLoading = computed(
  () => loading.value || submitting.value || deleting.value || editingLoadingId.value !== null
);
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

// 全量树：供编辑弹窗的上级选项使用，不受筛选影响。
const permissionTree = computed(() => buildPermissionTree(permissions.value));
const hasActions = computed(() => canUpdate.value || canDelete.value);
const hasFilter = computed(
  () => Boolean(keyword.value.trim()) || typeFilter.value !== null || statusFilter.value !== null
);
// 表格展示走扁平筛选链路：先在扁平数据上按标记法过滤（命中节点 + 上溯补全祖先链），再对保留集合建树。
const filteredTree = computed(() =>
  hasFilter.value ? buildPermissionTree(filterPermissionItems(permissions.value)) : permissionTree.value
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

// 列设置范围：可配置列为 title/actions 之外的 9 列；固定列（title 最左、actions 最右）不参与配置。
const configurableColumnKeys = [
  "code",
  "type",
  "enable",
  "sortOrder",
  "icon",
  "routePath",
  "routeName",
  "vueComponentPath",
  "metaData",
] as const;

// title 列固定最左，不参与列设置。
const titleColumn = computed<DataTableColumn<PermissionTreeNode>>(() => ({
  title: t("permissions.columns.title"),
  key: "title",
  minWidth: 190,
  fixed: "left",
}));

// 可配置列定义（key → 列定义）；computed 保证语言切换后标题响应式更新。
const configurableColumnMap = computed<Record<string, DataTableColumn<PermissionTreeNode>>>(() => ({
  code: {
    title: t("permissions.columns.code"),
    key: "code",
    minWidth: 180,
    render: row => renderText(row.code),
  },
  type: {
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
  enable: {
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
  sortOrder: { title: t("permissions.columns.sortOrder"), key: "sortOrder", minWidth: 80 },
  icon: {
    title: t("permissions.columns.icon"),
    key: "icon",
    minWidth: 120,
    render: row => renderText(row.icon),
  },
  routePath: {
    title: t("permissions.columns.routePath"),
    key: "routePath",
    minWidth: 190,
    render: row => renderText(row.routePath),
  },
  routeName: {
    title: t("permissions.columns.routeName"),
    key: "routeName",
    minWidth: 170,
    render: row => renderText(row.routeName),
  },
  vueComponentPath: {
    title: t("permissions.columns.componentPath"),
    key: "vueComponentPath",
    minWidth: 260,
    render: row => renderText(row.vueComponentPath),
  },
  metaData: {
    title: t("permissions.columns.metaData"),
    key: "metaData",
    minWidth: 170,
    render: row => t(row.metaData.isShow ? "permissions.metaData.show" : "permissions.metaData.hide"),
  },
}));

// 列设置状态（顺序 + 显隐），localStorage 持久化，storage key 按页面唯一。
const { orderedKeys, hiddenKeys, visibleKeys, toggleColumn, moveColumn, resetColumns } = useColumnSettings({
  storageKey: "columnSettings.permissionsList",
  defaultOrder: [...configurableColumnKeys],
});

// 列设置面板展示项：全量可配置列（默认顺序），组件内部按 orderedKeys 排序展示。
// vueComponentPath 与 enable 的 i18n 键和字段名不一致，这里做映射。
const columnTitleKeys: Record<(typeof configurableColumnKeys)[number], string> = {
  code: "code",
  type: "type",
  enable: "status",
  sortOrder: "sortOrder",
  icon: "icon",
  routePath: "routePath",
  routeName: "routeName",
  vueComponentPath: "componentPath",
  metaData: "metaData",
};
const columnSettingItems = computed(() =>
  configurableColumnKeys.map(key => ({ key, title: t(`permissions.columns.${columnTitleKeys[key]}`) }))
);

// actions 列固定最右且按权限动态追加，不参与列设置。
const actionsColumn = computed<DataTableColumn<PermissionTreeNode>>(() => ({
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
                disabled: actionLoading.value,
                onClick: () => openEdit(row),
              },
              { default: () => t("permissions.actions.edit") }
            )
          : null,
        canDelete.value
          ? h(
              NButton,
              { text: true, type: "error", disabled: actionLoading.value, onClick: () => openDelete(row) },
              { default: () => t("permissions.actions.delete") }
            )
          : null,
      ],
    }),
}));

const columns = computed<DataTableColumns<PermissionTreeNode>>(() => {
  const result: DataTableColumns<PermissionTreeNode> = [titleColumn.value];
  for (const key of visibleKeys.value) {
    result.push(configurableColumnMap.value[key]);
  }
  if (hasActions.value) {
    result.push(actionsColumn.value);
  }
  return result;
});

// 横向滚动宽度随可见列动态计算：固定列与可见列的 minWidth 之和，避免列显隐后滚动宽度失配。
const scrollX = computed(() => {
  let width = 190; // title 列
  for (const key of visibleKeys.value) {
    const minWidth = configurableColumnMap.value[key].minWidth;
    if (typeof minWidth === "number") width += minWidth;
  }
  return hasActions.value ? width + 180 : width;
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

function renderText(value: string) {
  return h(NEllipsis, { tooltip: true }, { default: () => value || "-" });
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

// 扁平标记法过滤：线性扫描收集命中节点，再迭代上溯把祖先补进保留集合，
// 未命中的父级作为命中节点的路径骨架保留；命中节点的未命中子级仍被过滤，与树形递归过滤行为一致。
function filterPermissionItems(items: PermissionListOutput[]): PermissionListOutput[] {
  const normalizedKeyword = keyword.value.trim().toLocaleLowerCase();
  const matched = new Set(
    items
      .filter(item => {
        const matchesKeyword =
          !normalizedKeyword ||
          item.title.toLocaleLowerCase().includes(normalizedKeyword) ||
          item.code.toLocaleLowerCase().includes(normalizedKeyword);
        const matchesType = typeFilter.value === null || item.type === typeFilter.value;
        const matchesStatus =
          statusFilter.value === null || (statusFilter.value === "enabled" ? item.enable : !item.enable);
        return matchesKeyword && matchesType && matchesStatus;
      })
      .map(item => item.id)
  );
  const byId = new Map(items.map(item => [item.id, item]));
  const keep = new Set(matched);
  for (const id of matched) {
    const visited = new Set<string>([id]);
    for (let parentId = byId.get(id)?.parentId; parentId; parentId = byId.get(parentId)?.parentId ?? null) {
      // 脏数据父链成环时终止上溯，避免死循环
      if (visited.has(parentId)) break;
      visited.add(parentId);
      keep.add(parentId);
    }
  }
  return items.filter(item => keep.has(item.id));
}

// 队列迭代（BFS）收集可展开节点，避免递归遍历。
function collectExpandableKeys(nodes: PermissionTreeNode[]): DataTableRowKey[] {
  const keys: DataTableRowKey[] = [];
  const queue = [...nodes];
  while (queue.length) {
    const node = queue.shift()!;
    if (node.children?.length) {
      keys.push(node.id);
      queue.push(...node.children);
    }
  }
  return keys;
}

function openCreate() {
  if (actionLoading.value) return;
  editRequestSequence++;
  editingLoadingId.value = null;
  Object.assign(formModel, createEmptyForm());
  showEditor.value = true;
}

async function openEdit(permission: PermissionListOutput) {
  if (actionLoading.value) return;
  const requestSequence = ++editRequestSequence;
  showEditor.value = false;
  editingLoadingId.value = permission.id;
  const loadingMessage = window.$message.loading(t("common.loading"), { duration: 0 });
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
    loadingMessage.destroy();
    if (requestSequence === editRequestSequence) editingLoadingId.value = null;
  }
}

function renderIconOption(option: SelectOption) {
  const name = String(option.value ?? "");
  const icon = lucideIconComponents[name];
  return h("div", { style: { display: "flex", alignItems: "center", gap: "8px" } }, [
    icon ? h(NIcon, { size: 16 }, { default: () => h(icon, { size: 16, strokeWidth: 1.5 }) }) : null,
    h("span", name),
  ]);
}

function openDelete(permission: PermissionListOutput) {
  if (actionLoading.value) return;
  deletingPermission.value = permission;
  showDeleteConfirm.value = true;
}

async function submitEditor() {
  // submitting 在校验前同步置位：校验是异步过程，置位晚于校验会导致双击绕过按钮 loading 重复提交。
  if (submitting.value) return;
  submitting.value = true;
  try {
    await formRef.value?.validate();
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
  if (!deletingPermission.value || deleting.value) return;
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
    // 与机构/类目列表一致：筛选态下重载（含刷新）恢复展开匹配节点，无筛选时保持折叠。
    expandedRowKeys.value = hasFilter.value ? collectExpandableKeys(filteredTree.value) : [];
  } finally {
    loading.value = false;
  }
}

// 刷新：保持当前筛选条件，仅重新拉取全量数据。
function refreshPermissions() {
  if (actionLoading.value) return;
  void loadPermissions();
}

watch([keyword, typeFilter, statusFilter], () => {
  expandedRowKeys.value = collectExpandableKeys(filteredTree.value);
});

onMounted(() => Promise.all([loadPermissions(), permissionsStore.getPermissions()]));
</script>

<style lang="scss" scoped>
.permission-list-page {
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex: 1 1 auto;

  > :deep(.n-card) {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex: 1 1 0;
    min-width: 0;

    .n-card-content {
      display: flex;
      flex-direction: column;
      flex: 1 1 0;
      overflow: hidden;

      .toolbar {
        flex: 0 0 auto;
      }
    }
  }
}
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;

  // 分割线颜色取卡片主题边框色，跟随明暗主题；上方 16px 由 toolbar 的 gap 提供。
  .action-bar {
    border-top: 1px solid var(--n-border-color);
    padding-top: 16px;
  }
}
</style>
