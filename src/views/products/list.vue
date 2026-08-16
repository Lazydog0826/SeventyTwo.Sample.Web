<template>
  <div class="product-list-page">
    <n-card :bordered="false">
      <div class="toolbar">
        <!-- 外层 5 列：条件区固定占前四列（放不下自动换行续排），第五列永远留给按钮组；
             item-responsive 让 n-gi 的 span 支持 "1 s:4" 响应式写法，断点与原 640px 媒体查询一致。 -->
        <n-grid :x-gap="16" :y-gap="16" cols="1 s:5" item-responsive responsive="screen">
          <n-gi span="1 s:4">
            <n-grid :x-gap="16" :y-gap="16" cols="2 s:4" responsive="screen">
              <n-gi>
                <n-input
                  v-model:value="keyword"
                  :disabled="actionLoading"
                  :placeholder="t('products.filters.keyword')"
                  clearable
                  @keyup.enter="searchProducts"
                />
              </n-gi>
              <n-gi>
                <n-select
                  v-model:value="statusFilter"
                  :disabled="actionLoading"
                  :options="statusOptions"
                  :placeholder="t('products.filters.status')"
                  clearable
                />
              </n-gi>
              <!-- category/brand/barcode/supplier 仅为布局占位，不参与查询逻辑，仅绑定值以支持重置清空 -->
              <n-gi>
                <n-input
                  v-model:value="categoryFilter"
                  :disabled="actionLoading"
                  :placeholder="t('products.filters.category')"
                  clearable
                />
              </n-gi>
              <n-gi>
                <n-input
                  v-model:value="brandFilter"
                  :disabled="actionLoading"
                  :placeholder="t('products.filters.brand')"
                  clearable
                />
              </n-gi>
              <!-- n-grid 对 v-show 的支持存在缺陷（首次隐藏后无法恢复显示），这里用 v-if 直接控制渲染 -->
              <n-gi v-if="filterExpanded">
                <n-input
                  v-model:value="barcodeFilter"
                  :disabled="actionLoading"
                  :placeholder="t('products.filters.barcode')"
                  clearable
                />
              </n-gi>
              <n-gi v-if="filterExpanded">
                <n-input
                  v-model:value="supplierFilter"
                  :disabled="actionLoading"
                  :placeholder="t('products.filters.supplier')"
                  clearable
                />
              </n-gi>
            </n-grid>
          </n-gi>
          <n-gi>
            <div class="filter-actions">
              <n-button :disabled="actionLoading" type="primary" @click="searchProducts">
                {{ t("products.actions.search") }}
              </n-button>
              <n-button :disabled="actionLoading" @click="resetFilters">{{ t("products.actions.reset") }}</n-button>
              <n-button
                :aria-label="t(filterExpanded ? 'products.actions.collapse' : 'products.actions.expand')"
                :disabled="actionLoading"
                :title="t(filterExpanded ? 'products.actions.collapse' : 'products.actions.expand')"
                @click="filterExpanded = !filterExpanded"
              >
                <template #icon>
                  <n-icon>
                    <ChevronUp v-if="filterExpanded" :size="16" :stroke-width="1.5"></ChevronUp>
                    <ChevronDown v-else :size="16" :stroke-width="1.5"></ChevronDown>
                  </n-icon>
                </template>
              </n-button>
            </div>
          </n-gi>
        </n-grid>

        <!-- 操作区先分左右两块：左侧业务操作（左对齐）、右侧统一操作（右对齐）；每块内部用 n-space 排布。
             上架/下架/删除/刷新/设置均为占位（disabled），仅预留布局。 -->
        <div class="action-bar">
          <n-grid :x-gap="16" :y-gap="12" cols="1 s:2" responsive="screen">
            <n-gi>
              <n-space>
                <n-button v-if="canCreate" :disabled="actionLoading" type="primary" @click="openCreate">
                  {{ t("products.actions.create") }}
                </n-button>
                <n-button disabled>{{ t("products.actions.onShelf") }}</n-button>
                <n-button disabled>{{ t("products.actions.offShelf") }}</n-button>
              </n-space>
            </n-gi>
            <n-gi>
              <n-space justify="end">
                <n-button :aria-label="t('products.actions.delete')" :title="t('products.actions.delete')" disabled>
                  <template #icon>
                    <n-icon>
                      <Trash2 :size="16" :stroke-width="1.5"></Trash2>
                    </n-icon>
                  </template>
                </n-button>
                <n-button :aria-label="t('products.actions.refresh')" :title="t('products.actions.refresh')" disabled>
                  <template #icon>
                    <n-icon>
                      <RefreshCw :size="16" :stroke-width="1.5"></RefreshCw>
                    </n-icon>
                  </template>
                </n-button>
                <n-button :aria-label="t('products.actions.settings')" :title="t('products.actions.settings')" disabled>
                  <template #icon>
                    <n-icon>
                      <Settings2 :size="16" :stroke-width="1.5"></Settings2>
                    </n-icon>
                  </template>
                </n-button>
              </n-space>
            </n-gi>
          </n-grid>
        </div>
      </div>

      <n-data-table
        :columns="columns"
        :data="products"
        :loading="loading"
        :pagination="pagination"
        :row-key="row => row.id"
        :scroll-x="hasActions ? 1150 : 900"
        flex-height
        remote
        striped
        style="height: 100%"
      >
        <template #empty><n-empty :description="emptyDescription" /></template>
      </n-data-table>
    </n-card>

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
  NButton,
  NCard,
  NDataTable,
  NEllipsis,
  NEmpty,
  NGi,
  NGrid,
  NIcon,
  NInput,
  NModal,
  NSelect,
  NSpace,
  NTag,
  type PaginationProps,
} from "naive-ui";
import { ChevronDown, ChevronUp, RefreshCw, Settings2, Trash2 } from "@lucide/vue";
import {
  changeProductStatus,
  deleteProduct,
  getProductPage,
  type ProductOutput,
  productStatus,
  type ProductStatus,
} from "@/api/products.ts";
import { useRefreshOnActivated } from "@/composables/useRefreshOnActivated.ts";
import { PermissionCode } from "@/constants/permissions.ts";
import { usePermissionsStore } from "@/stores/permissions.ts";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

const { t } = useI18n();
const router = useRouter();
const permissionsStore = usePermissionsStore();
const products = ref<ProductOutput[]>([]);
const keyword = ref("");
const statusFilter = ref<ProductStatus | null>(null);
// 占位筛选条件：仅支撑布局展示与重置清空，不参与查询。
const categoryFilter = ref("");
const brandFilter = ref("");
const barcodeFilter = ref("");
const supplierFilter = ref("");
const appliedKeyword = ref("");
const appliedStatus = ref<ProductStatus | null>(null);
const loading = ref(false);
const deleting = ref(false);
const changingStatusId = ref<string | null>(null);
// 表格内操作互斥：列表加载、上下架、删除期间禁用其他操作入口。
const actionLoading = computed(() => changingStatusId.value !== null || loading.value || deleting.value);
const showDeleteConfirm = ref(false);
const deletingProduct = ref<ProductOutput | null>(null);
// 筛选区展开标记：控制第二行占位筛选条件的显示与隐藏。
const filterExpanded = ref(false);
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
const statusOptions = computed(() => [
  { label: t("products.statuses.onShelf"), value: productStatus.onShelf },
  { label: t("products.statuses.offShelf"), value: productStatus.offShelf },
]);

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

function renderText(value: string, maxWidth: number) {
  return h(NEllipsis, { tooltip: true, style: { maxWidth: `${maxWidth}px` } }, { default: () => value || "-" });
}

// 路径 "/products/edit" 对应后端 productsEdit 页面权限下发的 RoutePath。
function openCreate() {
  if (actionLoading.value) return;
  void router.push("/products/edit");
}

function openEdit(product: ProductOutput) {
  if (actionLoading.value) return;
  void router.push({ path: "/products/edit", query: { id: product.id } });
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
  const toOnShelf = nextStatus === productStatus.onShelf;
  changingStatusId.value = product.id;
  // duration 为 0 让 loading 提示常驻：成功后原地切换为成功提示并延时关闭；失败时直接关闭，错误由请求层统一提示。
  const messageReactive = window.$message.loading(
    t(toOnShelf ? "products.messages.onShelfLoading" : "products.messages.offShelfLoading"),
    { duration: 0 }
  );
  try {
    await changeProductStatus({ id: product.id, status: nextStatus, version: product.version });
    messageReactive.type = "success";
    messageReactive.content = t(toOnShelf ? "products.messages.onShelf" : "products.messages.offShelf");
    window.setTimeout(() => messageReactive.destroy(), 3000);
    await loadProducts();
  } catch (error) {
    messageReactive.destroy();
    throw error;
  } finally {
    changingStatusId.value = null;
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
  categoryFilter.value = "";
  brandFilter.value = "";
  barcodeFilter.value = "";
  supplierFilter.value = "";
  appliedKeyword.value = "";
  appliedStatus.value = null;
  pagination.page = 1;
  void loadProducts();
}

onMounted(() => Promise.all([loadProducts(), permissionsStore.getPermissions()]));
useRefreshOnActivated(() => void loadProducts());
</script>

<style lang="scss" scoped>
.product-list-page {
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

  // 按钮列内的排布；列定位与响应式由 n-grid 承担。
  .filter-actions {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 12px;
  }

  // 分割线颜色取卡片主题边框色，跟随明暗主题；上方 16px 由 toolbar 的 gap 提供。
  .action-bar {
    border-top: 1px solid var(--n-border-color);
    padding-top: 16px;
  }
}
</style>
