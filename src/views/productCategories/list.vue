<template>
  <div class="product-category-list-page">
    <n-card :bordered="false">
      <!-- 布局规范与商品列表页一致：筛选区一行五列，不足五列用空项补齐。
           树形数据为即时过滤（输入即过滤），因此筛选区无搜索/重置按钮。 -->
      <div class="toolbar">
        <n-grid :cols="5" :x-gap="16" :y-gap="16">
          <n-gi>
            <n-input
              v-model:value="keyword"
              :disabled="actionLoading"
              :placeholder="t('productCategories.filters.keyword')"
              clearable
            />
          </n-gi>
          <n-gi />
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
                  {{ t("productCategories.actions.create") }}
                </n-button>
              </n-space>
            </n-gi>
            <n-gi>
              <n-space justify="end">
                <n-button
                  :aria-label="t('productCategories.actions.refresh')"
                  :disabled="actionLoading"
                  :title="t('productCategories.actions.refresh')"
                  quaternary
                  @click="refreshCategories"
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
                      :aria-label="t('productCategories.actions.settings')"
                      :title="t('productCategories.actions.settings')"
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
      style="width: 520px; max-width: calc(100vw - 32px)"
    >
      <n-form ref="formRef" :model="formModel" :rules="formRules" label-placement="left" label-width="auto">
        <n-form-item :label="t('productCategories.form.name')" path="name">
          <n-input v-model:value="formModel.name" :placeholder="t('productCategories.placeholders.name')" />
        </n-form-item>
        <n-form-item :label="t('productCategories.form.sortOrder')" path="sortOrder">
          <n-input-number
            v-model:value="formModel.sortOrder"
            :min="0"
            :placeholder="t('productCategories.placeholders.sortOrder')"
            :precision="0"
            style="width: 100%"
          />
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
          <n-button :disabled="submitting" @click="showEditor = false">
            {{ t("productCategories.actions.cancel") }}
          </n-button>
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
  NSpace,
  NTreeSelect,
  type TreeSelectOption,
} from "naive-ui";
import { RefreshCw, Settings } from "@lucide/vue";
import {
  createProductCategory,
  deleteProductCategory,
  getProductCategoryDetail,
  getProductCategoryList,
  type ProductCategoryListOutput,
  type ProductCategoryMutationInput,
  updateProductCategory,
} from "@/api/productCategories.ts";
import ColumnSettings from "@/components/ColumnSettings.vue";
import { useColumnSettings } from "@/composables/useColumnSettings.ts";
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
// 页面操作统一互斥：列表加载、提交、删除、详情加载任一进行中时禁用全部操作入口。
const actionLoading = computed(
  () => loading.value || submitting.value || deleting.value || editingLoadingId.value !== null
);
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
// 全量树：供编辑弹窗的上级选项使用，不受筛选影响。
const categoryTree = computed(() => buildCategoryTree(categories.value));
const hasFilter = computed(() => Boolean(keyword.value.trim()));
// 表格展示走扁平筛选链路：先在扁平数据上按标记法过滤（命中节点 + 上溯补全祖先链），再对保留集合建树。
const filteredTree = computed(() =>
  hasFilter.value ? buildCategoryTree(filterCategoryItems(categories.value)) : categoryTree.value
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
  name: {
    required: true,
    whitespace: true,
    message: t("productCategories.validation.name"),
    trigger: ["input", "blur"],
  },
  sortOrder: {
    required: true,
    type: "number",
    validator: (_rule, value) =>
      typeof value === "number" && Number.isInteger(value) && value >= 0
        ? true
        : new Error(t("productCategories.validation.sortOrder")),
    trigger: ["input", "blur"],
  },
}));

// 列设置范围：可配置列为 name/actions 之外的 2 列；固定列（name 最左、actions 最右）不参与配置。
const configurableColumnKeys = ["path", "sortOrder"] as const;

// name 列固定最左，不参与列设置。
const nameColumn = computed<DataTableColumn<ProductCategoryTreeNode>>(() => ({
  title: t("productCategories.columns.name"),
  key: "name",
  minWidth: 280,
  fixed: "left",
}));

// 可配置列定义（key → 列定义）；computed 保证语言切换后标题响应式更新。
const configurableColumnMap = computed<Record<string, DataTableColumn<ProductCategoryTreeNode>>>(() => ({
  path: {
    title: t("productCategories.columns.path"),
    key: "path",
    minWidth: 320,
    render: row => renderText(formatCategoryPath(row), 300),
  },
  sortOrder: { title: t("productCategories.columns.sortOrder"), key: "sortOrder", minWidth: 90 },
}));

// 列设置状态（顺序 + 显隐），localStorage 持久化，storage key 按页面唯一。
const { orderedKeys, hiddenKeys, visibleKeys, toggleColumn, moveColumn, resetColumns } = useColumnSettings({
  storageKey: "columnSettings.productCategoriesList",
  defaultOrder: [...configurableColumnKeys],
});

// 列设置面板展示项：全量可配置列（默认顺序），组件内部按 orderedKeys 排序展示。
const columnSettingItems = computed(() =>
  configurableColumnKeys.map(key => ({ key, title: t(`productCategories.columns.${key}`) }))
);

// actions 列固定最右且按权限动态追加，不参与列设置。
const actionsColumn = computed<DataTableColumn<ProductCategoryTreeNode>>(() => ({
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
}));

const columns = computed<DataTableColumns<ProductCategoryTreeNode>>(() => {
  const result: DataTableColumns<ProductCategoryTreeNode> = [nameColumn.value];
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
  let width = 280; // name 列
  for (const key of visibleKeys.value) {
    const minWidth = configurableColumnMap.value[key].minWidth;
    if (typeof minWidth === "number") width += minWidth;
  }
  return hasActions.value ? width + 140 : width;
});

function createEmptyForm(): ProductCategoryFormModel {
  return { id: null, version: null, name: "", parentId: null, sortOrder: 0 };
}

function renderText(value: string, maxWidth: number) {
  return h(NEllipsis, { tooltip: true, style: { maxWidth: `${maxWidth}px` } }, { default: () => value || "-" });
}

// Path 由类目 ID 以“/”连接（顶级类目仅含自身 ID），展示时逐段映射为类目名称，如“家用电器 / 大家电 / 冰箱”。
function formatCategoryPath(category: ProductCategoryListOutput): string {
  if (!category.path) return "";
  return category.path
    .split("/")
    .map(id => categoryById.value.get(id)?.name ?? id)
    .join(" / ");
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
  // 同级按排序号升序、其次按 ID 兜底，保证树形展示顺序稳定。
  const compareNodes = (left: ProductCategoryTreeNode, right: ProductCategoryTreeNode) =>
    left.sortOrder - right.sortOrder || left.id.localeCompare(right.id);
  roots.sort(compareNodes);
  nodes.forEach(node => node.children?.sort(compareNodes));
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

// 扁平标记法过滤：线性扫描收集命中节点，再迭代上溯把祖先补进保留集合，
// 未命中的父级作为命中节点的路径骨架保留；命中节点的未命中子级仍被过滤，与树形递归过滤行为一致。
function filterCategoryItems(items: ProductCategoryListOutput[]): ProductCategoryListOutput[] {
  const normalizedKeyword = keyword.value.trim().toLocaleLowerCase();
  const matched = new Set(
    items
      .filter(item => !normalizedKeyword || item.name.toLocaleLowerCase().includes(normalizedKeyword))
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
function collectExpandableKeys(nodes: ProductCategoryTreeNode[]): DataTableRowKey[] {
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
  // submitting 在校验前同步置位：校验是异步过程，置位晚于校验会导致双击绕过按钮 loading 重复提交。
  if (submitting.value) return;
  submitting.value = true;
  try {
    await formRef.value?.validate();
    const input: ProductCategoryMutationInput = {
      name: formModel.name,
      parentId: formModel.parentId,
      sortOrder: formModel.sortOrder,
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

// 刷新：保持当前筛选条件，仅重新拉取全量数据；树形数据加载后按筛选态恢复展开。
function refreshCategories() {
  if (actionLoading.value) return;
  void loadCategories();
}

watch(keyword, () => {
  expandedRowKeys.value = collectExpandableKeys(filteredTree.value);
});

onMounted(() => Promise.all([loadCategories(), permissionsStore.getPermissions()]));
</script>

<style lang="scss" scoped>
.product-category-list-page {
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
