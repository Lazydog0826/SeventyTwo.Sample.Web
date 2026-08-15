<template>
  <div class="product-list-page">
    <n-card :bordered="false" :title="t('products.title')">
      <div class="toolbar">
        <n-space :wrap="true">
          <n-input
            v-model:value="keyword"
            :disabled="actionLoading"
            :placeholder="t('products.filters.keyword')"
            class="keyword-input"
            clearable
            @keyup.enter="searchProducts"
          />
          <n-select
            v-model:value="statusFilter"
            :disabled="actionLoading"
            :options="statusOptions"
            :placeholder="t('products.filters.status')"
            class="status-select"
            clearable
          />
          <n-button :disabled="actionLoading" type="primary" @click="searchProducts">
            {{ t("products.actions.search") }}
          </n-button>
          <n-button :disabled="actionLoading" @click="resetFilters">{{ t("products.actions.reset") }}</n-button>
        </n-space>
        <n-button v-if="canCreate" :disabled="actionLoading" type="primary" @click="openCreate">
          {{ t("products.actions.create") }}
        </n-button>
      </div>

      <n-data-table
        :columns="columns"
        :data="products"
        :loading="loading"
        :pagination="pagination"
        :row-key="row => row.id"
        :scroll-x="hasActions ? 1150 : 900"
        remote
        striped
      >
        <template #empty><n-empty :description="emptyDescription" /></template>
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
        <n-form-item :label="t('products.form.name')" path="name">
          <n-input v-model:value="formModel.name" :placeholder="t('products.placeholders.name')" />
        </n-form-item>
        <n-form-item :label="t('products.form.code')" path="code">
          <n-input v-model:value="formModel.code" :placeholder="t('products.placeholders.code')" />
        </n-form-item>
        <n-form-item :label="t('products.form.price')" path="price">
          <n-input-number
            v-model:value="formModel.price"
            :min="0.01"
            :placeholder="t('products.placeholders.price')"
            :precision="2"
            style="width: 100%"
          >
            <template #prefix>￥</template>
          </n-input-number>
        </n-form-item>
        <n-form-item :label="t('products.form.category')" path="categoryId">
          <n-tree-select
            v-model:value="formModel.categoryId"
            :options="categoryOptions"
            :placeholder="t('products.placeholders.category')"
            clearable
          />
        </n-form-item>
        <n-form-item :label="t('products.form.unit')" path="unit">
          <n-input v-model:value="formModel.unit" :placeholder="t('products.placeholders.unit')" />
        </n-form-item>
        <n-form-item :label="t('products.form.description')" path="description">
          <n-input
            v-model:value="formModel.description"
            :maxlength="2000"
            :placeholder="t('products.placeholders.description')"
            show-count
            type="textarea"
          />
        </n-form-item>
        <n-form-item :label="t('products.form.status')" path="status">
          <n-switch v-model:value="statusChecked" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button :disabled="submitting" @click="showEditor = false">
            {{ t("products.actions.cancel") }}
          </n-button>
          <n-button :loading="submitting" type="primary" @click="submitEditor">
            {{ t("products.actions.save") }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showDeleteConfirm"
      :closable="!deleting"
      :close-on-esc="!deleting"
      :mask-closable="!deleting"
      :title="t('products.delete.title')"
      preset="dialog"
      type="warning"
    >
      {{ t("products.delete.content", { name: deletingProduct?.name ?? "" }) }}
      <template #action>
        <n-space justify="end">
          <n-button :disabled="deleting" @click="showDeleteConfirm = false">
            {{ t("products.actions.cancel") }}
          </n-button>
          <n-button :loading="deleting" type="error" @click="confirmDelete">
            {{ t("products.actions.delete") }}
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import { computed, h, onMounted, reactive, ref } from "vue";
import {
  type DataTableColumns,
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
  type PaginationProps,
  type TreeSelectOption,
} from "naive-ui";
import { getProductCategoryList, type ProductCategoryListOutput } from "@/api/productCategories.ts";
import {
  changeProductStatus,
  createProduct,
  deleteProduct,
  getProductDetail,
  getProductPage,
  type ProductMutationInput,
  type ProductOutput,
  productStatus,
  type ProductStatus,
  updateProduct,
} from "@/api/products.ts";
import { PermissionCode } from "@/constants/permissions.ts";
import { usePermissionsStore } from "@/stores/permissions.ts";
import { useI18n } from "vue-i18n";

interface ProductFormModel extends ProductMutationInput {
  id: string | null;
  version: string | null;
}

interface CategoryTreeNode extends ProductCategoryListOutput {
  children?: CategoryTreeNode[];
}

const { t } = useI18n();
const permissionsStore = usePermissionsStore();
const products = ref<ProductOutput[]>([]);
const categories = ref<ProductCategoryListOutput[]>([]);
const keyword = ref("");
const statusFilter = ref<ProductStatus | null>(null);
const appliedKeyword = ref("");
const appliedStatus = ref<ProductStatus | null>(null);
const loading = ref(false);
const submitting = ref(false);
const deleting = ref(false);
const changingStatusId = ref<string | null>(null);
const editingLoadingId = ref<string | null>(null);
// 表格与弹窗操作互斥：列表加载、编辑详情加载、提交、上下架、删除期间禁用其他操作入口。
const actionLoading = computed(
  () =>
    changingStatusId.value !== null ||
    editingLoadingId.value !== null ||
    loading.value ||
    submitting.value ||
    deleting.value
);
let editRequestSequence = 0;
const showEditor = ref(false);
const showDeleteConfirm = ref(false);
const deletingProduct = ref<ProductOutput | null>(null);
const formRef = ref<FormInst | null>(null);
const formModel = reactive<ProductFormModel>(createEmptyForm());
const pagination = reactive<PaginationProps>({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  pageSizes: [10, 20, 50, 100],
  showSizePicker: true,
  onChange: page => {
    if (actionLoading.value) return;
    pagination.page = page;
    void loadProducts();
  },
  onUpdatePageSize: pageSize => {
    if (actionLoading.value) return;
    pagination.pageSize = pageSize;
    pagination.page = 1;
    void loadProducts();
  },
});

const canCreate = computed(() => permissionsStore.hasPermission(PermissionCode.ProductsCreate));
const canUpdate = computed(() => permissionsStore.hasPermission(PermissionCode.ProductsUpdate));
const canDelete = computed(() => permissionsStore.hasPermission(PermissionCode.ProductsDelete));
const hasActions = computed(() => canUpdate.value || canDelete.value);
const hasFilter = computed(() => Boolean(appliedKeyword.value) || appliedStatus.value !== null);
const emptyDescription = computed(() => t(hasFilter.value ? "products.empty.filtered" : "products.empty.data"));
const editorTitle = computed(() => t(formModel.id ? "products.editor.updateTitle" : "products.editor.createTitle"));
const statusOptions = computed(() => [
  { label: t("products.statuses.onShelf"), value: productStatus.onShelf },
  { label: t("products.statuses.offShelf"), value: productStatus.offShelf },
]);
const categoryOptions = computed<TreeSelectOption[]>(() => buildCategoryOptions(buildCategoryTree(categories.value)));
const formRules = computed<FormRules>(() => ({
  name: { required: true, whitespace: true, message: t("products.validation.name"), trigger: ["input", "blur"] },
  code: { required: true, whitespace: true, message: t("products.validation.code"), trigger: ["input", "blur"] },
  price: {
    required: true,
    type: "number",
    validator: (_rule, value) =>
      typeof value === "number" && value > 0 ? true : new Error(t("products.validation.price")),
    trigger: ["input", "blur"],
  },
}));
// 编辑弹窗用开关表达上架状态：开=上架（OnShelf），关=下架（OffShelf）。
const statusChecked = computed({
  get: () => formModel.status === productStatus.onShelf,
  set: value => {
    formModel.status = value ? productStatus.onShelf : productStatus.offShelf;
  },
});

const columns = computed<DataTableColumns<ProductOutput>>(() => {
  const result: DataTableColumns<ProductOutput> = [
    { title: t("products.columns.name"), key: "name", minWidth: 200, fixed: "left" },
    { title: t("products.columns.code"), key: "code", minWidth: 160, render: row => renderText(row.code, 140) },
    {
      title: t("products.columns.price"),
      key: "price",
      minWidth: 110,
      render: row => `￥${row.price.toFixed(2)}`,
    },
    { title: t("products.columns.unit"), key: "unit", minWidth: 90, render: row => renderText(row.unit ?? "", 70) },
    {
      title: t("products.columns.description"),
      key: "description",
      minWidth: 220,
      render: row => renderText(row.description ?? "", 200),
    },
    {
      title: t("products.columns.status"),
      key: "status",
      minWidth: 100,
      render: row =>
        h(
          NTag,
          { type: row.status === productStatus.onShelf ? "success" : "error", bordered: false },
          {
            default: () =>
              t(row.status === productStatus.onShelf ? "products.statuses.onShelf" : "products.statuses.offShelf"),
          }
        ),
    },
  ];
  if (hasActions.value) {
    result.push({
      title: t("products.columns.actions"),
      key: "actions",
      minWidth: 200,
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
                  { default: () => t("products.actions.edit") }
                )
              : null,
            canUpdate.value
              ? h(
                  NButton,
                  {
                    text: true,
                    type: row.status === productStatus.onShelf ? "warning" : "success",
                    disabled: actionLoading.value,
                    onClick: () => changeStatus(row),
                  },
                  {
                    default: () =>
                      t(
                        row.status === productStatus.onShelf ? "products.actions.offShelf" : "products.actions.onShelf"
                      ),
                  }
                )
              : null,
            canDelete.value
              ? h(
                  NButton,
                  {
                    text: true,
                    type: "error",
                    disabled: actionLoading.value,
                    onClick: () => openDelete(row),
                  },
                  { default: () => t("products.actions.delete") }
                )
              : null,
          ],
        }),
    });
  }
  return result;
});

function createEmptyForm(): ProductFormModel {
  return {
    id: null,
    version: null,
    name: "",
    code: "",
    price: null as unknown as number,
    description: null,
    unit: null,
    categoryId: null,
    status: productStatus.offShelf,
  };
}

function renderText(value: string, maxWidth: number) {
  return h(NEllipsis, { tooltip: true, style: { maxWidth: `${maxWidth}px` } }, { default: () => value || "-" });
}

function buildCategoryTree(items: ProductCategoryListOutput[]): CategoryTreeNode[] {
  const nodes = new Map<string, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];
  items.forEach(item => nodes.set(item.id, { ...item }));
  items.forEach(item => {
    const node = nodes.get(item.id)!;
    const parent = item.parentId ? nodes.get(item.parentId) : undefined;
    if (parent) (parent.children ??= []).push(node);
    else roots.push(node);
  });
  const sortNodes = (list: CategoryTreeNode[]) => {
    list.sort((left, right) => left.sortOrder - right.sortOrder || left.id.localeCompare(right.id));
    list.forEach(node => node.children && sortNodes(node.children));
  };
  sortNodes(roots);
  return roots;
}

function buildCategoryOptions(nodes: CategoryTreeNode[]): TreeSelectOption[] {
  return nodes.map(node => ({
    label: node.name,
    key: node.id,
    children: node.children?.length ? buildCategoryOptions(node.children) : undefined,
  }));
}

function openCreate() {
  if (actionLoading.value) return;
  editRequestSequence++;
  editingLoadingId.value = null;
  Object.assign(formModel, createEmptyForm());
  showEditor.value = true;
}

async function openEdit(product: ProductOutput) {
  if (actionLoading.value) return;
  const requestSequence = ++editRequestSequence;
  showEditor.value = false;
  editingLoadingId.value = product.id;
  const loadingMessage = window.$message.loading(t("common.loading"), { duration: 0 });
  try {
    const detail = await getProductDetail(product.id);
    if (!detail || requestSequence !== editRequestSequence) return;
    Object.assign(formModel, createEmptyForm(), {
      id: detail.id,
      version: detail.version,
      name: detail.name,
      code: detail.code,
      price: detail.price,
      description: detail.description,
      unit: detail.unit,
      categoryId: detail.categoryId,
      status: detail.status,
    });
    showEditor.value = true;
  } catch {
    // 错误由统一请求处理展示，详情失败时保持编辑弹窗关闭。
  } finally {
    loadingMessage.destroy();
    if (requestSequence === editRequestSequence) editingLoadingId.value = null;
  }
}

function openDelete(product: ProductOutput) {
  if (actionLoading.value) return;
  deletingProduct.value = product;
  showDeleteConfirm.value = true;
}

async function changeStatus(product: ProductOutput) {
  if (actionLoading.value) return;
  const nextStatus: ProductStatus =
    product.status === productStatus.onShelf ? productStatus.offShelf : productStatus.onShelf;
  changingStatusId.value = product.id;
  try {
    await changeProductStatus({ id: product.id, status: nextStatus, version: product.version });
    window.$message.success(
      t(nextStatus === productStatus.onShelf ? "products.messages.onShelf" : "products.messages.offShelf")
    );
    await loadProducts();
  } finally {
    changingStatusId.value = null;
  }
}

async function submitEditor() {
  await formRef.value?.validate();
  submitting.value = true;
  try {
    const input: ProductMutationInput = {
      name: formModel.name.trim(),
      code: formModel.code.trim(),
      price: formModel.price,
      description: formModel.description?.trim() || null,
      unit: formModel.unit?.trim() || null,
      categoryId: formModel.categoryId,
      status: formModel.status,
    };
    if (formModel.id && formModel.version) {
      await updateProduct({ ...input, id: formModel.id, version: formModel.version });
      window.$message.success(t("products.messages.updated"));
    } else {
      await createProduct(input);
      window.$message.success(t("products.messages.created"));
    }
    showEditor.value = false;
    await loadProducts();
  } finally {
    submitting.value = false;
  }
}

async function confirmDelete() {
  if (!deletingProduct.value || deleting.value) return;
  deleting.value = true;
  try {
    await deleteProduct({ id: deletingProduct.value.id, version: deletingProduct.value.version });
    window.$message.success(t("products.messages.deleted"));
    showDeleteConfirm.value = false;
    deletingProduct.value = null;
    await loadProducts();
  } finally {
    deleting.value = false;
  }
}

async function loadProducts() {
  loading.value = true;
  pagination.disabled = true;
  try {
    const result = await getProductPage({
      index: pagination.page ?? 1,
      limit: pagination.pageSize ?? 20,
      keyword: appliedKeyword.value || undefined,
      status: appliedStatus.value ?? undefined,
    });
    products.value = result?.list ?? [];
    pagination.itemCount = result?.total ?? 0;
    const lastPage = Math.max(1, Math.ceil((pagination.itemCount ?? 0) / (pagination.pageSize ?? 20)));
    if ((pagination.page ?? 1) > lastPage) {
      pagination.page = lastPage;
      await loadProducts();
    }
  } finally {
    loading.value = false;
    pagination.disabled = false;
  }
}

function searchProducts() {
  if (actionLoading.value) return;
  appliedKeyword.value = keyword.value.trim();
  appliedStatus.value = statusFilter.value;
  pagination.page = 1;
  void loadProducts();
}

function resetFilters() {
  if (actionLoading.value) return;
  keyword.value = "";
  statusFilter.value = null;
  appliedKeyword.value = "";
  appliedStatus.value = null;
  pagination.page = 1;
  void loadProducts();
}

async function loadCategories() {
  categories.value = (await getProductCategoryList()) ?? [];
}

onMounted(() => Promise.all([loadProducts(), loadCategories(), permissionsStore.getPermissions()]));
</script>

<style lang="scss" scoped>
.product-list-page {
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
