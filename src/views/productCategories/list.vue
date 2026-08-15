<template>
  <div class="product-category-list-page">
    <n-card :bordered="false" :title="t('productCategories.title')">
      <div class="toolbar">
        <n-space :wrap="true">
          <n-input
            v-model:value="keyword"
            :placeholder="t('productCategories.filters.keyword')"
            class="keyword-input"
            clearable
          />
        </n-space>
        <n-button v-if="canCreate" :disabled="actionLoading" type="primary" @click="openCreate">
          {{ t("productCategories.actions.create") }}
        </n-button>
      </div>

      <n-data-table
        v-model:expanded-row-keys="expandedRowKeys"
        :columns="columns"
        :data="filteredTree"
        :loading="loading"
        :row-key="row => row.id"
        :scroll-x="hasActions ? 640 : 480"
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
      style="width: 520px; max-width: calc(100vw - 32px)"
    >
      <n-form ref="formRef" :model="formModel" :rules="formRules" label-placement="left" label-width="auto">
        <n-form-item :label="t('productCategories.form.name')" path="name">
          <n-input v-model:value="formModel.name" :placeholder="t('productCategories.placeholders.name')" />
        </n-form-item>
        <n-form-item :label="t('productCategories.form.parent')" path="parentId">
          <n-tree-select
            v-model:value="formModel.parentId"
            :options="parentOptions"
            :placeholder="t('productCategories.placeholders.parent')"
            clearable
            filterable
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showEditor = false">{{ t("productCategories.actions.cancel") }}</n-button>
          <n-button :loading="submitting" type="primary" @click="submitEditor">
            {{ t("productCategories.actions.save") }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showDeleteConfirm"
      :closable="!deleting"
      :close-on-esc="!deleting"
      :mask-closable="!deleting"
      :title="t('productCategories.delete.title')"
      preset="dialog"
      type="warning"
    >
      {{ t("productCategories.delete.content", { name: deletingCategory?.name ?? "" }) }}
      <template #action>
        <n-space justify="end">
          <n-button :disabled="deleting" @click="showDeleteConfirm = false">
            {{ t("productCategories.actions.cancel") }}
          </n-button>
          <n-button :loading="deleting" type="error" @click="confirmDelete">
            {{ t("productCategories.actions.delete") }}
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
  NModal,
  NSpace,
  NTreeSelect,
  type TreeSelectOption,
} from "naive-ui";
import {
  createProductCategory,
  deleteProductCategory,
  getProductCategoryDetail,
  getProductCategoryList,
  type ProductCategoryListOutput,
  type ProductCategoryMutationInput,
  updateProductCategory,
} from "@/api/productCategories.ts";
import { PermissionCode } from "@/constants/permissions.ts";
import { usePermissionsStore } from "@/stores/permissions.ts";
import { useI18n } from "vue-i18n";

interface ProductCategoryTreeNode extends ProductCategoryListOutput {
  children?: ProductCategoryTreeNode[];
}

interface ProductCategoryFormModel extends ProductCategoryMutationInput {
  id: string | null;
  version: string | null;
}

const { t } = useI18n();
const permissionsStore = usePermissionsStore();
const categories = ref<ProductCategoryListOutput[]>([]);
const keyword = ref("");
const loading = ref(false);
const submitting = ref(false);
const deleting = ref(false);
const editingLoadingId = ref<string | null>(null);
// 表格操作互斥：详情加载期间禁用全部操作按钮。
const actionLoading = computed(() => editingLoadingId.value !== null);
let editRequestSequence = 0;
const showEditor = ref(false);
const showDeleteConfirm = ref(false);
const deletingCategory = ref<ProductCategoryListOutput | null>(null);
const expandedRowKeys = ref<DataTableRowKey[]>([]);
const formRef = ref<FormInst | null>(null);
const formModel = reactive<ProductCategoryFormModel>(createEmptyForm());

const canCreate = computed(() => permissionsStore.hasPermission(PermissionCode.ProductCategoriesCreate));
const canUpdate = computed(() => permissionsStore.hasPermission(PermissionCode.ProductCategoriesUpdate));
const canDelete = computed(() => permissionsStore.hasPermission(PermissionCode.ProductCategoriesDelete));
const hasActions = computed(() => canUpdate.value || canDelete.value);
const categoryById = computed(() => new Map(categories.value.map(item => [item.id, item])));
const categoryChildrenByParent = computed(() => {
  const result = new Map<string, ProductCategoryListOutput[]>();
  categories.value.forEach(item => {
    if (!item.parentId) return;
    const children = result.get(item.parentId) ?? [];
    children.push(item);
    result.set(item.parentId, children);
  });
  return result;
});
const categoryTree = computed(() => buildCategoryTree(categories.value));
const hasFilter = computed(() => Boolean(keyword.value.trim()));
const filteredTree = computed(() =>
  hasFilter.value ? filterCategoryTree(categoryTree.value) : categoryTree.value
);
const emptyDescription = computed(() =>
  t(hasFilter.value ? "productCategories.empty.filtered" : "productCategories.empty.data")
);
const editorTitle = computed(() =>
  t(formModel.id ? "productCategories.editor.updateTitle" : "productCategories.editor.createTitle")
);
// 编辑时排除自身及其后代，避免把类目挂到自己的子树下形成环。
const excludedParentIds = computed(() =>
  formModel.id ? new Set([formModel.id, ...collectDescendantIds(formModel.id)]) : new Set<string>()
);
const parentOptions = computed<TreeSelectOption[]>(() => buildParentOptions(categoryTree.value));
const formRules = computed<FormRules>(() => ({
  name: { required: true, whitespace: true, message: t("productCategories.validation.name"), trigger: ["input", "blur"] },
}));

const columns = computed<DataTableColumns<ProductCategoryTreeNode>>(() => {
  const result: DataTableColumns<ProductCategoryTreeNode> = [
    { title: t("productCategories.columns.name"), key: "name", minWidth: 280, fixed: "left" },
    {
      title: t("productCategories.columns.parent"),
      key: "parentName",
      minWidth: 220,
      render: row => {
        const parent = row.parentId ? categoryById.value.get(row.parentId) : undefined;
        return renderText(parent?.name ?? "-", 200);
      },
    },
  ];
  if (hasActions.value) {
    result.push({
      title: t("productCategories.columns.actions"),
      key: "actions",
      minWidth: 140,
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
                  { default: () => t("productCategories.actions.edit") }
                )
              : null,
            canDelete.value
              ? h(
                  NButton,
                  { text: true, type: "error", disabled: actionLoading.value, onClick: () => openDelete(row) },
                  { default: () => t("productCategories.actions.delete") }
                )
              : null,
          ],
        }),
    });
  }
  return result;
});

function createEmptyForm(): ProductCategoryFormModel {
  return { id: null, version: null, name: "", parentId: null };
}

function renderText(value: string, maxWidth: number) {
  return h(NEllipsis, { tooltip: true, style: { maxWidth: `${maxWidth}px` } }, { default: () => value || "-" });
}

function buildCategoryTree(items: ProductCategoryListOutput[]): ProductCategoryTreeNode[] {
  const nodes = new Map<string, ProductCategoryTreeNode>();
  const roots: ProductCategoryTreeNode[] = [];
  items.forEach(item => nodes.set(item.id, { ...item }));
  items.forEach(item => {
    const node = nodes.get(item.id)!;
    const parent = item.parentId ? nodes.get(item.parentId) : undefined;
    if (parent) (parent.children ??= []).push(node);
    else roots.push(node);
  });
  return roots;
}

function buildParentOptions(nodes: ProductCategoryTreeNode[]): TreeSelectOption[] {
  return nodes.flatMap(node => {
    if (excludedParentIds.value.has(node.id)) return [];
    const children = buildParentOptions(node.children ?? []);
    return [
      {
        label: node.name,
        key: node.id,
        children: children.length ? children : undefined,
      },
    ];
  });
}

function collectDescendantIds(id: string): string[] {
  const children = categoryChildrenByParent.value.get(id) ?? [];
  return children.flatMap(child => [child.id, ...collectDescendantIds(child.id)]);
}

function filterCategoryTree(nodes: ProductCategoryTreeNode[]): ProductCategoryTreeNode[] {
  const normalizedKeyword = keyword.value.trim().toLocaleLowerCase();
  return nodes.flatMap(node => {
    const children = node.children ? filterCategoryTree(node.children) : [];
    const matchesKeyword = !normalizedKeyword || node.name.toLocaleLowerCase().includes(normalizedKeyword);
    if (!matchesKeyword && children.length === 0) return [];
    return [{ ...node, children: children.length ? children : undefined }];
  });
}

function collectExpandableKeys(nodes: ProductCategoryTreeNode[]): DataTableRowKey[] {
  return nodes.flatMap(node => (node.children?.length ? [node.id, ...collectExpandableKeys(node.children)] : []));
}

function openCreate() {
  if (actionLoading.value) return;
  editRequestSequence++;
  editingLoadingId.value = null;
  Object.assign(formModel, createEmptyForm());
  showEditor.value = true;
}

async function openEdit(category: ProductCategoryListOutput) {
  if (actionLoading.value) return;
  const requestSequence = ++editRequestSequence;
  showEditor.value = false;
  editingLoadingId.value = category.id;
  const loadingMessage = window.$message.loading(t("common.loading"), { duration: 0 });
  try {
    const detail = await getProductCategoryDetail(category.id);
    if (!detail || requestSequence !== editRequestSequence) return;
    Object.assign(formModel, detail);
    showEditor.value = true;
  } catch {
    // 错误由统一请求处理展示，详情失败时保持编辑弹窗关闭。
  } finally {
    loadingMessage.destroy();
    if (requestSequence === editRequestSequence) editingLoadingId.value = null;
  }
}

function openDelete(category: ProductCategoryListOutput) {
  if (actionLoading.value) return;
  deletingCategory.value = category;
  showDeleteConfirm.value = true;
}

async function submitEditor() {
  await formRef.value?.validate();
  submitting.value = true;
  try {
    const input: ProductCategoryMutationInput = {
      name: formModel.name,
      parentId: formModel.parentId,
    };
    if (formModel.id && formModel.version) {
      await updateProductCategory({ ...input, id: formModel.id, version: formModel.version });
      window.$message.success(t("productCategories.messages.updated"));
    } else {
      await createProductCategory(input);
      window.$message.success(t("productCategories.messages.created"));
    }
    showEditor.value = false;
    await loadCategories();
  } finally {
    submitting.value = false;
  }
}

async function confirmDelete() {
  if (!deletingCategory.value || deleting.value) return;
  deleting.value = true;
  try {
    await deleteProductCategory(deletingCategory.value.id);
    window.$message.success(t("productCategories.messages.deleted"));
    showDeleteConfirm.value = false;
    deletingCategory.value = null;
    await loadCategories();
  } finally {
    deleting.value = false;
  }
}

async function loadCategories() {
  loading.value = true;
  try {
    categories.value = (await getProductCategoryList()) ?? [];
    expandedRowKeys.value = hasFilter.value ? collectExpandableKeys(filteredTree.value) : [];
  } finally {
    loading.value = false;
  }
}

watch(keyword, () => {
  expandedRowKeys.value = collectExpandableKeys(filteredTree.value);
});

onMounted(() => Promise.all([loadCategories(), permissionsStore.getPermissions()]));
</script>

<style lang="scss" scoped>
.product-category-list-page {
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
@media (max-width: 640px) {
  .toolbar {
    align-items: stretch;
    flex-direction: column;
  }
  .keyword-input {
    width: 100%;
  }
}
</style>
