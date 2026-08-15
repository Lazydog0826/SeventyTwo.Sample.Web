<template>
  <div class="product-edit-page">
    <n-card :bordered="false" :title="pageTitle">
      <n-spin :show="detailLoading">
        <div v-if="loadFailed" class="load-failed">
          <n-empty :description="t('products.editor.loadFailed')" />
          <n-button class="load-failed-back" type="primary" @click="goBack">
            {{ t("products.editor.backToList") }}
          </n-button>
        </div>
        <n-form v-else ref="formRef" :model="formModel" :rules="formRules" label-placement="left" label-width="auto">
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
      </n-spin>
      <template #footer>
        <n-space justify="end">
          <n-button :disabled="submitting" @click="goBack">
            {{ t("products.actions.cancel") }}
          </n-button>
          <n-button v-if="canSubmit" :loading="submitting" type="primary" @click="submit">
            {{ t("products.actions.save") }}
          </n-button>
        </n-space>
      </template>
    </n-card>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  type FormInst,
  type FormRules,
  NButton,
  NCard,
  NEmpty,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSpace,
  NSpin,
  NSwitch,
  NTreeSelect,
  type TreeSelectOption,
} from "naive-ui";
import { getProductCategoryList, type ProductCategoryListOutput } from "@/api/productCategories.ts";
import {
  createProduct,
  getProductDetail,
  type ProductMutationInput,
  productStatus,
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
const route = useRoute();
const router = useRouter();
const permissionsStore = usePermissionsStore();
const categories = ref<ProductCategoryListOutput[]>([]);
const detailLoading = ref(false);
const loadFailed = ref(false);
const submitting = ref(false);
const formRef = ref<FormInst | null>(null);
const formModel = reactive<ProductFormModel>(createEmptyForm());
// 编辑模式通过 query.id 区分；本页仅由列表页跳转进入，路由切换必然重新挂载，mounted 读取一次即可。
const editId = typeof route.query.id === "string" && route.query.id ? route.query.id : null;
const pageTitle = computed(() => t(editId ? "products.editor.updateTitle" : "products.editor.createTitle"));
// 保存动作沿用按钮权限：新增用 productsCreate，编辑用 productsUpdate。
const canSubmit = computed(() =>
  editId
    ? permissionsStore.hasPermission(PermissionCode.ProductsUpdate)
    : permissionsStore.hasPermission(PermissionCode.ProductsCreate)
);
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
// 编辑页用开关表达上架状态：开=上架（OnShelf），关=下架（OffShelf）。
const statusChecked = computed({
  get: () => formModel.status === productStatus.onShelf,
  set: value => {
    formModel.status = value ? productStatus.onShelf : productStatus.offShelf;
  },
});
// 详情加载防竞态：离开页面后丢弃过期响应，避免覆盖表单状态。
let requestSequence = 0;

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

async function loadDetail() {
  if (!editId) return;
  const currentSequence = ++requestSequence;
  detailLoading.value = true;
  try {
    const detail = await getProductDetail(editId);
    if (!detail || currentSequence !== requestSequence) return;
    Object.assign(formModel, {
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
  } catch {
    // 错误由统一请求处理展示；详情失败时展示失败态，避免提交一份空表单。
    if (currentSequence === requestSequence) loadFailed.value = true;
  } finally {
    if (currentSequence === requestSequence) detailLoading.value = false;
  }
}

async function loadCategories() {
  categories.value = (await getProductCategoryList()) ?? [];
}

function goBack() {
  void router.push("/products/list");
}

async function submit() {
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
    goBack();
  } finally {
    submitting.value = false;
  }
}

onMounted(() => Promise.all([loadDetail(), loadCategories(), permissionsStore.getPermissions()]));
</script>

<style lang="scss" scoped>
.product-edit-page {
  min-width: 0;
  max-width: 560px;
}
.load-failed {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px 0;
}
.load-failed-back {
  min-width: 120px;
}
</style>
