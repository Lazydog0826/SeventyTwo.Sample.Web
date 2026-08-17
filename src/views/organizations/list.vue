<template>
  <div class="organization-list-page">
    <n-card :bordered="false">
      <!-- 布局规范与商品列表页一致：筛选区一行五列，不足五列用空项补齐。
           树形数据为即时过滤（输入即过滤），因此筛选区无搜索/重置按钮。 -->
      <div class="toolbar">
        <n-grid :cols="5" :x-gap="16" :y-gap="16">
          <n-gi>
            <n-input
              v-model:value="keyword"
              :disabled="actionLoading"
              :placeholder="t('organizations.filters.keyword')"
              clearable
            />
          </n-gi>
          <n-gi>
            <n-select
              v-model:value="statusFilter"
              :disabled="actionLoading"
              :options="statusOptions"
              :placeholder="t('organizations.filters.status')"
              clearable
            />
          </n-gi>
          <n-gi />
          <n-gi />
          <n-gi />
        </n-grid>
        <!-- 操作区左右分区：左侧业务操作（新建），右侧统一操作（刷新/列设置），与商品列表页一致。 -->
        <div class="action-bar">
          <n-grid :x-gap="16" :y-gap="12" cols="1 s:2" responsive="screen">
            <n-gi>
              <n-space>
                <n-button v-if="canCreate" :disabled="actionLoading" type="primary" @click="openCreate">
                  {{ t("organizations.actions.create") }}
                </n-button>
              </n-space>
            </n-gi>
            <n-gi>
              <n-space justify="end">
                <n-button
                  :aria-label="t('organizations.actions.refresh')"
                  :disabled="actionLoading"
                  :title="t('organizations.actions.refresh')"
                  quaternary
                  @click="refreshOrganizations"
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
                      :aria-label="t('organizations.actions.settings')"
                      :title="t('organizations.actions.settings')"
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
      style="width: 560px; max-width: calc(100vw - 32px)"
    >
      <n-form ref="formRef" :model="formModel" :rules="formRules" label-placement="left" label-width="auto">
        <n-form-item :label="t('organizations.form.code')" path="code">
          <n-input v-model:value="formModel.code" :placeholder="t('organizations.placeholders.code')" />
        </n-form-item>
        <n-form-item :label="t('organizations.form.name')" path="name">
          <n-input v-model:value="formModel.name" :placeholder="t('organizations.placeholders.name')" />
        </n-form-item>
        <n-form-item :label="t('organizations.form.sortOrder')" path="sortOrder">
          <n-input-number
            v-model:value="formModel.sortOrder"
            :min="0"
            :placeholder="t('organizations.placeholders.sortOrder')"
            :precision="0"
            style="width: 100%"
          />
        </n-form-item>
        <n-form-item :label="t('organizations.form.parent')" path="parentId">
          <n-tree-select
            v-model:value="formModel.parentId"
            :clearable="editingOrganization === null"
            :disabled="editingRoot"
            :options="parentOptions"
            :placeholder="t('organizations.placeholders.parent')"
            filterable
          />
        </n-form-item>
        <n-form-item :label="t('organizations.form.enable')" path="enable">
          <n-switch v-model:value="formModel.enable" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button :disabled="submitting" @click="showEditor = false">
            {{ t("organizations.actions.cancel") }}
          </n-button>
          <n-button :loading="submitting" type="primary" @click="submitEditor">
            {{ t("organizations.actions.save") }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showDeleteConfirm"
      :closable="!deleting"
      :close-on-esc="!deleting"
      :mask-closable="!deleting"
      :title="t('organizations.delete.title')"
      preset="dialog"
      type="warning"
    >
      {{ t("organizations.delete.content", { name: deletingOrganization?.name ?? "" }) }}
      <template #action>
        <n-space justify="end">
          <n-button :disabled="deleting" @click="showDeleteConfirm = false">
            {{ t("organizations.actions.cancel") }}
          </n-button>
          <n-button :loading="deleting" type="error" @click="confirmDelete">
            {{ t("organizations.actions.delete") }}
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import { computed, h, onMounted, reactive, ref, watch } from "vue";
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
  type TreeSelectOption,
} from "naive-ui";
import { RefreshCw, Settings } from "@lucide/vue";
import {
  createOrganization,
  deleteOrganization,
  getOrganizationDetail,
  getOrganizationList,
  type OrganizationListOutput,
  type OrganizationMutationInput,
  updateOrganization,
} from "@/api/organizations.ts";
import ColumnSettings from "@/components/ColumnSettings.vue";
import { useColumnSettings } from "@/composables/useColumnSettings.ts";
import { PermissionCode } from "@/constants/permissions.ts";
import { usePermissionsStore } from "@/stores/permissions.ts";
import { useI18n } from "vue-i18n";

interface OrganizationTreeNode extends OrganizationListOutput {
  children?: OrganizationTreeNode[];
}

interface OrganizationFormModel extends OrganizationMutationInput {
  id: string | null;
  version: string | null;
}

type StatusFilter = "enabled" | "disabled";

const { t } = useI18n();
const permissionsStore = usePermissionsStore();
const organizations = ref<OrganizationListOutput[]>([]);
const keyword = ref("");
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
const showEditor = ref(false);
const showDeleteConfirm = ref(false);
const deletingOrganization = ref<OrganizationListOutput | null>(null);
const editingOrganization = ref<OrganizationListOutput | null>(null);
const expandedRowKeys = ref<DataTableRowKey[]>([]);
const formRef = ref<FormInst | null>(null);
const formModel = reactive<OrganizationFormModel>(createEmptyForm());

const canCreate = computed(() => permissionsStore.hasPermission(PermissionCode.OrganizationsCreate));
const canUpdate = computed(() => permissionsStore.hasPermission(PermissionCode.OrganizationsUpdate));
const canDelete = computed(() => permissionsStore.hasPermission(PermissionCode.OrganizationsDelete));
const hasActions = computed(() => canUpdate.value || canDelete.value);
const editingRoot = computed(() => editingOrganization.value?.parentId === null);
const organizationById = computed(() => new Map(organizations.value.map(item => [item.id, item])));
const organizationChildrenByParent = computed(() => {
  const result = new Map<string, OrganizationListOutput[]>();
  organizations.value.forEach(item => {
    if (!item.parentId) return;
    const children = result.get(item.parentId) ?? [];
    children.push(item);
    result.set(item.parentId, children);
  });
  return result;
});
// 全量树：供编辑弹窗的上级选项使用，不受筛选影响。
const organizationTree = computed(() => buildOrganizationTree(organizations.value));
const hasFilter = computed(() => Boolean(keyword.value.trim()) || statusFilter.value !== null);
// 表格展示走扁平筛选链路：先在扁平数据上按标记法过滤（命中节点 + 上溯补全祖先链），再对保留集合建树。
const filteredTree = computed(() =>
  hasFilter.value ? buildOrganizationTree(filterOrganizationItems(organizations.value)) : organizationTree.value
);
const emptyDescription = computed(() =>
  t(hasFilter.value ? "organizations.empty.filtered" : "organizations.empty.data")
);
const editorTitle = computed(() =>
  t(formModel.id ? "organizations.editor.updateTitle" : "organizations.editor.createTitle")
);
const statusOptions = computed(() => [
  { label: t("organizations.statuses.enabled"), value: "enabled" },
  { label: t("organizations.statuses.disabled"), value: "disabled" },
]);
const excludedParentIds = computed(() =>
  formModel.id ? new Set([formModel.id, ...collectDescendantIds(formModel.id)]) : new Set<string>()
);
const parentOptions = computed<TreeSelectOption[]>(() => {
  const editingRootId = editingOrganization.value ? getRootId(editingOrganization.value.id) : null;
  return buildParentOptions(organizationTree.value.filter(node => editingRootId === null || node.id === editingRootId));
});
const formRules = computed<FormRules>(() => ({
  code: { required: true, whitespace: true, message: t("organizations.validation.code"), trigger: ["input", "blur"] },
  name: { required: true, whitespace: true, message: t("organizations.validation.name"), trigger: ["input", "blur"] },
  sortOrder: {
    required: true,
    type: "number",
    validator: (_rule, value) =>
      typeof value === "number" && Number.isInteger(value) && value >= 0
        ? true
        : new Error(t("organizations.validation.sortOrder")),
    trigger: ["input", "blur"],
  },
}));

// 列设置范围：可配置列为 name/actions 之外的 3 列；固定列（name 最左、actions 最右）不参与配置。
const configurableColumnKeys = ["code", "sortOrder", "enable"] as const;

// name 列固定最左，不参与列设置。
const nameColumn = computed<DataTableColumn<OrganizationTreeNode>>(() => ({
  title: t("organizations.columns.name"),
  key: "name",
  minWidth: 260,
  fixed: "left",
}));

// 可配置列定义（key → 列定义）；computed 保证语言切换后标题响应式更新。
const configurableColumnMap = computed<Record<string, DataTableColumn<OrganizationTreeNode>>>(() => ({
  code: {
    title: t("organizations.columns.code"),
    key: "code",
    minWidth: 220,
    render: row => renderText(row.code),
  },
  sortOrder: { title: t("organizations.columns.sortOrder"), key: "sortOrder", minWidth: 90 },
  enable: {
    title: t("organizations.columns.status"),
    key: "enable",
    minWidth: 100,
    render: row =>
      h(
        NTag,
        { type: row.enable ? "success" : "error", bordered: false },
        { default: () => t(row.enable ? "organizations.statuses.enabled" : "organizations.statuses.disabled") }
      ),
  },
}));

// 列设置状态（顺序 + 显隐），localStorage 持久化，storage key 按页面唯一。
const { orderedKeys, hiddenKeys, visibleKeys, toggleColumn, moveColumn, resetColumns } = useColumnSettings({
  storageKey: "columnSettings.organizationsList",
  defaultOrder: [...configurableColumnKeys],
});

// 列设置面板展示项：全量可配置列（默认顺序），组件内部按 orderedKeys 排序展示。
const columnSettingItems = computed(() =>
  configurableColumnKeys.map(key => ({ key, title: t(`organizations.columns.${key === "enable" ? "status" : key}`) }))
);

// actions 列固定最右且按权限动态追加，不参与列设置。
const actionsColumn = computed<DataTableColumn<OrganizationTreeNode>>(() => ({
  title: t("organizations.columns.actions"),
  key: "actions",
  minWidth: 160,
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
              { default: () => t("organizations.actions.edit") }
            )
          : null,
        canDelete.value
          ? h(
              NButton,
              { text: true, type: "error", disabled: actionLoading.value, onClick: () => openDelete(row) },
              { default: () => t("organizations.actions.delete") }
            )
          : null,
      ],
    }),
}));

const columns = computed<DataTableColumns<OrganizationTreeNode>>(() => {
  const result: DataTableColumns<OrganizationTreeNode> = [nameColumn.value];
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
  let width = 260; // name 列
  for (const key of visibleKeys.value) {
    const minWidth = configurableColumnMap.value[key].minWidth;
    if (typeof minWidth === "number") width += minWidth;
  }
  return hasActions.value ? width + 160 : width;
});

function createEmptyForm(): OrganizationFormModel {
  return { id: null, version: null, code: "", name: "", enable: true, parentId: null, sortOrder: 0 };
}

function renderText(value: string) {
  return h(NEllipsis, { tooltip: true }, { default: () => value || "-" });
}

function buildOrganizationTree(items: OrganizationListOutput[]): OrganizationTreeNode[] {
  const nodes = new Map<string, OrganizationTreeNode>();
  const roots: OrganizationTreeNode[] = [];
  items.forEach(item => nodes.set(item.id, { ...item }));
  items.forEach(item => {
    const node = nodes.get(item.id)!;
    const parent = item.parentId ? nodes.get(item.parentId) : undefined;
    if (parent) (parent.children ??= []).push(node);
    else roots.push(node);
  });
  sortTree(roots);
  return roots;
}

function sortTree(nodes: OrganizationTreeNode[]) {
  nodes.sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id));
  nodes.forEach(node => node.children && sortTree(node.children));
}

function buildParentOptions(nodes: OrganizationTreeNode[]): TreeSelectOption[] {
  return nodes.flatMap(node => {
    if (excludedParentIds.value.has(node.id)) return [];
    const children = buildParentOptions(node.children ?? []);
    return [
      {
        label: `${node.name} (${node.code})`,
        key: node.id,
        children: children.length ? children : undefined,
      },
    ];
  });
}

function collectDescendantIds(id: string): string[] {
  const children = organizationChildrenByParent.value.get(id) ?? [];
  return children.flatMap(child => [child.id, ...collectDescendantIds(child.id)]);
}

function getRootId(id: string): string | null {
  let current = organizationById.value.get(id);
  const visited = new Set<string>();
  while (current?.parentId) {
    // 脏数据父链成环时终止上溯，避免死循环
    if (visited.has(current.id)) return null;
    visited.add(current.id);
    current = organizationById.value.get(current.parentId);
  }
  return current?.id ?? null;
}

// 扁平标记法过滤：线性扫描收集命中节点，再迭代上溯把祖先补进保留集合，
// 未命中的父级作为命中节点的路径骨架保留；命中节点的未命中子级仍被过滤，与树形递归过滤行为一致。
function filterOrganizationItems(items: OrganizationListOutput[]): OrganizationListOutput[] {
  const normalizedKeyword = keyword.value.trim().toLocaleLowerCase();
  const matched = new Set(
    items
      .filter(item => {
        const matchesKeyword =
          !normalizedKeyword ||
          item.name.toLocaleLowerCase().includes(normalizedKeyword) ||
          item.code.toLocaleLowerCase().includes(normalizedKeyword);
        const matchesStatus =
          statusFilter.value === null || (statusFilter.value === "enabled" ? item.enable : !item.enable);
        return matchesKeyword && matchesStatus;
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
function collectExpandableKeys(nodes: OrganizationTreeNode[]): DataTableRowKey[] {
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
  editingOrganization.value = null;
  Object.assign(formModel, createEmptyForm());
  showEditor.value = true;
}

async function openEdit(organization: OrganizationListOutput) {
  if (actionLoading.value) return;
  const requestSequence = ++editRequestSequence;
  showEditor.value = false;
  editingLoadingId.value = organization.id;
  const loadingMessage = window.$message.loading(t("common.loading"), { duration: 0 });
  try {
    const detail = await getOrganizationDetail(organization.id);
    if (!detail || requestSequence !== editRequestSequence) return;
    editingOrganization.value = detail;
    Object.assign(formModel, detail);
    showEditor.value = true;
  } catch {
    // 错误由统一请求处理展示，详情失败时保持编辑弹窗关闭。
  } finally {
    loadingMessage.destroy();
    if (requestSequence === editRequestSequence) editingLoadingId.value = null;
  }
}

function openDelete(organization: OrganizationListOutput) {
  if (actionLoading.value) return;
  deletingOrganization.value = organization;
  showDeleteConfirm.value = true;
}

async function submitEditor() {
  // submitting 在校验前同步置位：校验是异步过程，置位晚于校验会导致双击绕过按钮 loading 重复提交。
  if (submitting.value) return;
  submitting.value = true;
  try {
    await formRef.value?.validate();
    const input: OrganizationMutationInput = {
      code: formModel.code,
      name: formModel.name,
      enable: formModel.enable,
      parentId: formModel.parentId,
      sortOrder: formModel.sortOrder,
    };
    if (formModel.id && formModel.version) {
      await updateOrganization({ ...input, id: formModel.id, version: formModel.version });
      window.$message.success(t("organizations.messages.updated"));
    } else {
      await createOrganization(input);
      window.$message.success(t("organizations.messages.created"));
    }
    showEditor.value = false;
    await loadOrganizations();
  } finally {
    submitting.value = false;
  }
}

async function confirmDelete() {
  if (!deletingOrganization.value || deleting.value) return;
  deleting.value = true;
  try {
    await deleteOrganization(deletingOrganization.value.id);
    window.$message.success(t("organizations.messages.deleted"));
    showDeleteConfirm.value = false;
    deletingOrganization.value = null;
    await loadOrganizations();
  } finally {
    deleting.value = false;
  }
}

async function loadOrganizations() {
  loading.value = true;
  try {
    organizations.value = (await getOrganizationList()) ?? [];
    expandedRowKeys.value = hasFilter.value ? collectExpandableKeys(filteredTree.value) : [];
  } finally {
    loading.value = false;
  }
}

// 刷新：保持当前筛选条件，仅重新拉取全量数据；树形数据加载后按筛选态恢复展开。
function refreshOrganizations() {
  if (actionLoading.value) return;
  void loadOrganizations();
}

watch([keyword, statusFilter], () => {
  expandedRowKeys.value = collectExpandableKeys(filteredTree.value);
});

onMounted(() => Promise.all([loadOrganizations(), permissionsStore.getPermissions()]));
</script>

<style lang="scss" scoped>
.organization-list-page {
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
