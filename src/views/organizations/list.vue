<template>
  <div class="organization-list-page">
    <n-card :bordered="false" :title="t('organizations.title')">
      <div class="toolbar">
        <n-space :wrap="true">
          <n-input
            v-model:value="keyword"
            :placeholder="t('organizations.filters.keyword')"
            class="keyword-input"
            clearable
          />
          <n-select
            v-model:value="statusFilter"
            :options="statusOptions"
            :placeholder="t('organizations.filters.status')"
            class="status-select"
            clearable
          />
        </n-space>
        <n-button v-if="canCreate" :disabled="actionLoading" type="primary" @click="openCreate">
          {{ t("organizations.actions.create") }}
        </n-button>
      </div>

      <n-data-table
        v-model:expanded-row-keys="expandedRowKeys"
        :columns="columns"
        :data="filteredTree"
        :loading="loading"
        :row-key="row => row.id"
        :scroll-x="hasActions ? 830 : 670"
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
          <n-button @click="showEditor = false">{{ t("organizations.actions.cancel") }}</n-button>
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
import {
  createOrganization,
  deleteOrganization,
  getOrganizationDetail,
  getOrganizationList,
  type OrganizationListOutput,
  type OrganizationMutationInput,
  updateOrganization,
} from "@/api/organizations.ts";
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
// 表格操作互斥：详情加载期间禁用全部操作按钮。
const actionLoading = computed(() => editingLoadingId.value !== null);
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
const organizationTree = computed(() => buildOrganizationTree(organizations.value));
const hasFilter = computed(() => Boolean(keyword.value.trim()) || statusFilter.value !== null);
const filteredTree = computed(() =>
  hasFilter.value ? filterOrganizationTree(organizationTree.value) : organizationTree.value
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

const columns = computed<DataTableColumns<OrganizationTreeNode>>(() => {
  const result: DataTableColumns<OrganizationTreeNode> = [
    { title: t("organizations.columns.name"), key: "name", minWidth: 260, fixed: "left", ellipsis: { tooltip: true } },
    { title: t("organizations.columns.code"), key: "code", minWidth: 220, render: row => renderText(row.code, 200) },
    { title: t("organizations.columns.sortOrder"), key: "sortOrder", minWidth: 90 },
    {
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
  ];
  if (hasActions.value) {
    result.push({
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
    });
  }
  return result;
});

function createEmptyForm(): OrganizationFormModel {
  return { id: null, version: null, code: "", name: "", enable: true, parentId: null, sortOrder: 0 };
}

function renderText(value: string, maxWidth: number) {
  return h(NEllipsis, { tooltip: true, style: { maxWidth: `${maxWidth}px` } }, { default: () => value || "-" });
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
    if (!visited.add(current.id)) return null;
    current = organizationById.value.get(current.parentId);
  }
  return current?.id ?? null;
}

function filterOrganizationTree(nodes: OrganizationTreeNode[]): OrganizationTreeNode[] {
  const normalizedKeyword = keyword.value.trim().toLocaleLowerCase();
  return nodes.flatMap(node => {
    const children = node.children ? filterOrganizationTree(node.children) : [];
    const matchesKeyword =
      !normalizedKeyword ||
      node.name.toLocaleLowerCase().includes(normalizedKeyword) ||
      node.code.toLocaleLowerCase().includes(normalizedKeyword);
    const matchesStatus =
      statusFilter.value === null || (statusFilter.value === "enabled" ? node.enable : !node.enable);
    if (!(matchesKeyword && matchesStatus) && children.length === 0) return [];
    return [{ ...node, children: children.length ? children : undefined }];
  });
}

function collectExpandableKeys(nodes: OrganizationTreeNode[]): DataTableRowKey[] {
  return nodes.flatMap(node => (node.children?.length ? [node.id, ...collectExpandableKeys(node.children)] : []));
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
  await formRef.value?.validate();
  submitting.value = true;
  try {
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

watch([keyword, statusFilter], () => {
  expandedRowKeys.value = collectExpandableKeys(filteredTree.value);
});

onMounted(() => Promise.all([loadOrganizations(), permissionsStore.getPermissions()]));
</script>

<style lang="scss" scoped>
.organization-list-page {
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
.status-select {
  width: 160px;
}
@media (max-width: 640px) {
  .toolbar {
    align-items: stretch;
    flex-direction: column;
  }
  .keyword-input,
  .status-select {
    width: 100%;
  }
}
</style>
