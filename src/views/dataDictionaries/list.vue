<!--suppress ExceptionCaughtLocallyJS -->
<template>
  <div class="data-dictionary-page">
    <n-grid :x-gap="16" :y-gap="16" cols="1 900:2" responsive="self">
      <n-grid-item>
        <n-card :bordered="false" :title="t('dataDictionaries.dictionaryTitle')">
          <div class="toolbar">
            <n-space :wrap="true">
              <n-input
                v-model:value="keyword"
                :disabled="actionLoading"
                :placeholder="t('dataDictionaries.filters.keyword')"
                class="keyword-input"
                clearable
              />
              <n-select
                v-model:value="statusFilter"
                :disabled="actionLoading"
                :options="statusOptions"
                :placeholder="t('dataDictionaries.filters.status')"
                class="status-select"
                clearable
              />
              <n-button :disabled="actionLoading" type="primary" @click="searchDictionaries">
                {{ t("dataDictionaries.actions.search") }}
              </n-button>
              <n-button :disabled="actionLoading" @click="resetFilters">
                {{ t("dataDictionaries.actions.reset") }}
              </n-button>
            </n-space>
            <n-button v-if="canCreate" :disabled="actionLoading" type="primary" @click="openCreateDictionary">
              {{ t("dataDictionaries.actions.create") }}
            </n-button>
          </div>
          <n-data-table
            :columns="dictionaryColumns"
            :data="dictionaries"
            :loading="dictionaryLoading"
            :pagination="pagination"
            :row-key="(row: DataDictionaryListOutput) => row.id"
            :row-props="dictionaryRowProps"
            :scroll-x="canUpdate || canDelete ? 878 : 748"
            :single-line="false"
            remote
            striped
          >
            <template #empty><n-empty :description="dictionaryEmptyDescription" /></template>
          </n-data-table>
        </n-card>
      </n-grid-item>

      <n-grid-item>
        <n-card :bordered="false" :title="itemCardTitle">
          <template #header-extra>
            <n-button
              v-if="selectedDictionary && canUpdate"
              :disabled="actionLoading"
              type="primary"
              @click="openCreateItem"
            >
              {{ t("dataDictionaries.actions.createItem") }}
            </n-button>
          </template>
          <n-data-table
            v-if="selectedDictionary"
            :columns="itemColumns"
            :data="items"
            :loading="itemLoading"
            :row-key="(row: DataDictionaryItemOutput) => row.id"
            :scroll-x="canUpdate ? 600 : 470"
            :single-line="false"
            striped
          >
            <template #empty><n-empty :description="t('dataDictionaries.empty.items')" /></template>
          </n-data-table>
          <n-empty v-else :description="t('dataDictionaries.empty.select')" />
        </n-card>
      </n-grid-item>
    </n-grid>

    <n-modal
      v-model:show="showDictionaryEditor"
      :title="dictionaryEditorTitle"
      preset="card"
      style="width: 560px; max-width: calc(100vw - 32px)"
    >
      <n-form
        ref="dictionaryFormRef"
        :model="dictionaryForm"
        :rules="dictionaryRules"
        label-placement="left"
        label-width="auto"
      >
        <n-form-item :label="t('dataDictionaries.form.code')" path="code">
          <n-input v-model:value="dictionaryForm.code" :placeholder="t('dataDictionaries.placeholders.code')" />
        </n-form-item>
        <n-form-item :label="t('dataDictionaries.form.name')" path="name">
          <n-input v-model:value="dictionaryForm.name" :placeholder="t('dataDictionaries.placeholders.name')" />
        </n-form-item>
        <n-form-item :label="t('dataDictionaries.form.description')" path="description">
          <n-input
            v-model:value="dictionaryForm.description"
            :placeholder="t('dataDictionaries.placeholders.description')"
            type="textarea"
          />
        </n-form-item>
        <n-form-item :label="t('dataDictionaries.form.enable')" path="enable">
          <n-switch v-model:value="dictionaryForm.enable" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showDictionaryEditor = false">{{ t("dataDictionaries.actions.cancel") }}</n-button>
          <n-button :loading="submitting" type="primary" @click="submitDictionary">
            {{ t("dataDictionaries.actions.save") }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showItemEditor"
      :title="itemEditorTitle"
      preset="card"
      style="width: 560px; max-width: calc(100vw - 32px)"
    >
      <n-form ref="itemFormRef" :model="itemForm" :rules="itemRules" label-placement="left" label-width="auto">
        <n-form-item :label="t('dataDictionaries.form.value')" path="value">
          <n-input v-model:value="itemForm.value" :placeholder="t('dataDictionaries.placeholders.value')" />
        </n-form-item>
        <n-form-item :label="t('dataDictionaries.form.label')" path="label">
          <n-input v-model:value="itemForm.label" :placeholder="t('dataDictionaries.placeholders.label')" />
        </n-form-item>
        <n-form-item :label="t('dataDictionaries.form.sortOrder')" path="sortOrder">
          <n-input-number v-model:value="itemForm.sortOrder" :min="0" :precision="0" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showItemEditor = false">{{ t("dataDictionaries.actions.cancel") }}</n-button>
          <n-button :loading="submitting" type="primary" @click="submitItem">
            {{ t("dataDictionaries.actions.save") }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showDictionaryDelete"
      :closable="!deleting"
      :close-on-esc="!deleting"
      :mask-closable="!deleting"
      :title="t('dataDictionaries.delete.dictionaryTitle')"
      preset="dialog"
      type="warning"
    >
      {{ t("dataDictionaries.delete.dictionaryContent", { name: deletingDictionary?.name ?? "" }) }}
      <template #action>
        <n-space justify="end">
          <n-button :disabled="deleting" @click="showDictionaryDelete = false">
            {{ t("dataDictionaries.actions.cancel") }}
          </n-button>
          <n-button :loading="deleting" type="error" @click="confirmDeleteDictionary">
            {{ t("dataDictionaries.actions.delete") }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showItemDelete"
      :closable="!deleting"
      :close-on-esc="!deleting"
      :mask-closable="!deleting"
      :title="t('dataDictionaries.delete.itemTitle')"
      preset="dialog"
      type="warning"
    >
      {{ t("dataDictionaries.delete.itemContent", { label: deletingItem?.label ?? "" }) }}
      <template #action>
        <n-space justify="end">
          <n-button :disabled="deleting" @click="showItemDelete = false">
            {{ t("dataDictionaries.actions.cancel") }}
          </n-button>
          <n-button :loading="deleting" type="error" @click="confirmDeleteItem">
            {{ t("dataDictionaries.actions.delete") }}
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import { computed, h, onMounted, reactive, ref } from "vue";
import { HTTPError } from "ky";
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
  NGrid,
  NGridItem,
  NInput,
  NInputNumber,
  NModal,
  NRadio,
  NSelect,
  NSpace,
  NSwitch,
  NTag,
  type PaginationProps,
} from "naive-ui";
import {
  createDataDictionary,
  createDataDictionaryItem,
  type DataDictionaryItemOutput,
  type DataDictionaryListOutput,
  type DataDictionaryMutationInput,
  deleteDataDictionary,
  deleteDataDictionaryItem,
  getDataDictionaryItems,
  getDataDictionaryList,
  updateDataDictionary,
  updateDataDictionaryItem,
} from "@/api/dataDictionaries.ts";
import { PermissionCode } from "@/constants/permissions.ts";
import { usePermissionsStore } from "@/stores/permissions.ts";
import { useI18n } from "vue-i18n";

interface DictionaryFormModel extends DataDictionaryMutationInput {
  id: string | null;
  version: string | null;
}
interface ItemFormModel {
  id: string | null;
  value: string;
  label: string;
  sortOrder: number | null;
}
type StatusFilter = "enabled" | "disabled";

const dataChangedMessage = "dataDictionary.dataChanged";

const { t } = useI18n();
const permissionsStore = usePermissionsStore();
const dictionaries = ref<DataDictionaryListOutput[]>([]);
const items = ref<DataDictionaryItemOutput[]>([]);
const selectedDictionaryId = ref<string | null>(null);
const keyword = ref("");
const statusFilter = ref<StatusFilter | null>(null);
const appliedKeyword = ref("");
const appliedStatus = ref<StatusFilter | null>(null);
const pagination = reactive<PaginationProps>({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  pageSizes: [10, 20, 50, 100],
  showSizePicker: true,
  onChange: page => {
    if (actionLoading.value) return;
    pagination.page = page;
    void loadDictionaries();
  },
  onUpdatePageSize: pageSize => {
    if (actionLoading.value) return;
    pagination.pageSize = pageSize;
    pagination.page = 1;
    void loadDictionaries();
  },
});
const dictionaryLoading = ref(false);
const itemLoading = ref(false);
const submitting = ref(false);
const deleting = ref(false);
const showDictionaryEditor = ref(false);
const showItemEditor = ref(false);
const showDictionaryDelete = ref(false);
const showItemDelete = ref(false);
const deletingDictionary = ref<DataDictionaryListOutput | null>(null);
const deletingItem = ref<DataDictionaryItemOutput | null>(null);
const dictionaryFormRef = ref<FormInst | null>(null);
const itemFormRef = ref<FormInst | null>(null);
const dictionaryForm = reactive<DictionaryFormModel>(emptyDictionaryForm());
const itemForm = reactive<ItemFormModel>(emptyItemForm());
let itemLoadSequence = 0;

const canCreate = computed(() => permissionsStore.hasPermission(PermissionCode.DataDictionariesCreate));
const canUpdate = computed(() => permissionsStore.hasPermission(PermissionCode.DataDictionariesUpdate));
const canDelete = computed(() => permissionsStore.hasPermission(PermissionCode.DataDictionariesDelete));
// 页面操作统一互斥，避免列表、字典项和增删改请求并发修改界面状态。
const actionLoading = computed(
  () => dictionaryLoading.value || itemLoading.value || submitting.value || deleting.value
);
const selectedDictionary = computed(
  () => dictionaries.value.find(item => item.id === selectedDictionaryId.value) ?? null
);
const statusOptions = computed(() => [
  { label: t("dataDictionaries.statuses.enabled"), value: "enabled" },
  { label: t("dataDictionaries.statuses.disabled"), value: "disabled" },
]);
const dictionaryEmptyDescription = computed(() =>
  t(
    appliedKeyword.value || appliedStatus.value
      ? "dataDictionaries.empty.filtered"
      : "dataDictionaries.empty.dictionaries"
  )
);
const itemCardTitle = computed(() =>
  selectedDictionary.value
    ? `${t("dataDictionaries.itemTitle")} · ${selectedDictionary.value.name}`
    : t("dataDictionaries.itemTitle")
);
const dictionaryEditorTitle = computed(() =>
  t(dictionaryForm.id ? "dataDictionaries.editor.updateTitle" : "dataDictionaries.editor.createTitle")
);
const itemEditorTitle = computed(() =>
  t(itemForm.id ? "dataDictionaries.editor.updateItemTitle" : "dataDictionaries.editor.createItemTitle")
);
const dictionaryRules = computed<FormRules>(() => ({
  code: {
    required: true,
    whitespace: true,
    message: t("dataDictionaries.validation.code"),
    trigger: ["input", "blur"],
  },
  name: {
    required: true,
    whitespace: true,
    message: t("dataDictionaries.validation.name"),
    trigger: ["input", "blur"],
  },
}));
const itemRules = computed<FormRules>(() => ({
  value: {
    required: true,
    whitespace: true,
    message: t("dataDictionaries.validation.value"),
    trigger: ["input", "blur"],
  },
  label: {
    required: true,
    whitespace: true,
    message: t("dataDictionaries.validation.label"),
    trigger: ["input", "blur"],
  },
  sortOrder: [
    {
      required: true,
      type: "number",
      message: t("dataDictionaries.validation.sortOrderRequired"),
      trigger: ["input", "blur"],
    },
    {
      type: "number",
      min: 0,
      message: t("dataDictionaries.validation.sortOrder"),
      trigger: ["input", "blur"],
    },
  ],
}));

const dictionaryColumns = computed<DataTableColumns<DataDictionaryListOutput>>(() => {
  const columns: DataTableColumns<DataDictionaryListOutput> = [
    {
      key: "selection",
      minWidth: 48,
      fixed: "left",
      render: row =>
        h(NRadio, {
          checked: row.id === selectedDictionaryId.value,
          disabled: actionLoading.value,
          "aria-label": row.name,
          onClick: (event: MouseEvent) => event.stopPropagation(),
          onUpdateChecked: checked => {
            if (checked) void selectDictionary(row.id);
          },
        }),
    },
    { title: t("dataDictionaries.columns.code"), key: "code", minWidth: 160, render: row => textCell(row.code, 140) },
    { title: t("dataDictionaries.columns.name"), key: "name", minWidth: 160, render: row => textCell(row.name, 140) },
    {
      title: t("dataDictionaries.columns.description"),
      key: "description",
      minWidth: 200,
      render: row => textCell(row.description ?? "-", 180),
    },
    { title: t("dataDictionaries.columns.itemCount"), key: "itemCount", minWidth: 90 },
    {
      title: t("dataDictionaries.columns.status"),
      key: "enable",
      minWidth: 90,
      render: row =>
        h(
          NTag,
          { type: row.enable ? "success" : "error", bordered: false },
          { default: () => t(row.enable ? "dataDictionaries.statuses.enabled" : "dataDictionaries.statuses.disabled") }
        ),
    },
  ];
  if (canUpdate.value || canDelete.value)
    columns.push({
      title: t("dataDictionaries.columns.actions"),
      key: "actions",
      minWidth: 130,
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
                    onClick: (event: MouseEvent) => {
                      event.stopPropagation();
                      openEditDictionary(row);
                    },
                  },
                  { default: () => t("dataDictionaries.actions.edit") }
                )
              : null,
            canDelete.value
              ? h(
                  NButton,
                  {
                    text: true,
                    type: "error",
                    disabled: actionLoading.value,
                    onClick: (event: MouseEvent) => {
                      event.stopPropagation();
                      openDeleteDictionary(row);
                    },
                  },
                  { default: () => t("dataDictionaries.actions.delete") }
                )
              : null,
          ],
        }),
    });
  return columns;
});

const itemColumns = computed<DataTableColumns<DataDictionaryItemOutput>>(() => {
  const columns: DataTableColumns<DataDictionaryItemOutput> = [
    {
      title: t("dataDictionaries.columns.value"),
      key: "value",
      minWidth: 180,
      render: row => textCell(row.value, 160),
    },
    {
      title: t("dataDictionaries.columns.label"),
      key: "label",
      minWidth: 200,
      render: row => textCell(row.label, 180),
    },
    { title: t("dataDictionaries.columns.sortOrder"), key: "sortOrder", minWidth: 90 },
  ];
  if (canUpdate.value)
    columns.push({
      title: t("dataDictionaries.columns.actions"),
      key: "actions",
      minWidth: 130,
      render: row =>
        h(NSpace, null, {
          default: () => [
            h(
              NButton,
              { text: true, type: "primary", disabled: actionLoading.value, onClick: () => openEditItem(row) },
              { default: () => t("dataDictionaries.actions.edit") }
            ),
            h(
              NButton,
              { text: true, type: "error", disabled: actionLoading.value, onClick: () => openDeleteItem(row) },
              { default: () => t("dataDictionaries.actions.delete") }
            ),
          ],
        }),
    });
  return columns;
});

function emptyDictionaryForm(): DictionaryFormModel {
  return { id: null, version: null, code: "", name: "", description: null, enable: true };
}
function emptyItemForm(): ItemFormModel {
  return { id: null, value: "", label: "", sortOrder: 0 };
}
function textCell(value: string, maxWidth: number) {
  return h(NEllipsis, { tooltip: true, style: { maxWidth: `${maxWidth}px` } }, { default: () => value });
}
function dictionaryRowProps(row: DataDictionaryListOutput) {
  return {
    class: row.id === selectedDictionaryId.value ? "selected-row" : "",
    onClick: () => {
      if (!actionLoading.value) void selectDictionary(row.id);
    },
  };
}

async function selectDictionary(id: string) {
  if (actionLoading.value) return;
  if (selectedDictionaryId.value === id && items.value.length) return;
  if (selectedDictionaryId.value !== id) items.value = [];
  selectedDictionaryId.value = id;
  await loadItems();
}

function openCreateDictionary() {
  if (actionLoading.value) return;
  Object.assign(dictionaryForm, emptyDictionaryForm());
  showDictionaryEditor.value = true;
}
function openEditDictionary(row: DataDictionaryListOutput) {
  if (actionLoading.value) return;
  Object.assign(dictionaryForm, row);
  showDictionaryEditor.value = true;
}
function openDeleteDictionary(row: DataDictionaryListOutput) {
  if (actionLoading.value) return;
  deletingDictionary.value = row;
  showDictionaryDelete.value = true;
}
function openCreateItem() {
  if (actionLoading.value) return;
  Object.assign(itemForm, emptyItemForm());
  showItemEditor.value = true;
}
function openEditItem(row: DataDictionaryItemOutput) {
  if (actionLoading.value) return;
  Object.assign(itemForm, row);
  showItemEditor.value = true;
}
function openDeleteItem(row: DataDictionaryItemOutput) {
  if (actionLoading.value) return;
  deletingItem.value = row;
  showItemDelete.value = true;
}

async function submitDictionary() {
  await dictionaryFormRef.value?.validate();
  submitting.value = true;
  try {
    const input: DataDictionaryMutationInput = {
      code: dictionaryForm.code,
      name: dictionaryForm.name,
      description: dictionaryForm.description,
      enable: dictionaryForm.enable,
    };
    if (dictionaryForm.id && dictionaryForm.version) {
      await updateDataDictionary({ ...input, id: dictionaryForm.id, version: dictionaryForm.version });
      window.$message.success(t("dataDictionaries.messages.updated"));
    } else {
      const created = await createDataDictionary(input);
      if (!created) throw new Error("Data dictionary create response is empty");
      selectedDictionaryId.value = created.id;
      window.$message.success(t("dataDictionaries.messages.created"));
    }
    showDictionaryEditor.value = false;
    await loadDictionaries();
  } catch (error) {
    await reloadOnConflict(error);
    throw error;
  } finally {
    submitting.value = false;
  }
}

async function submitItem() {
  await itemFormRef.value?.validate();
  if (!selectedDictionary.value || itemForm.sortOrder === null) return;
  submitting.value = true;
  try {
    const input = {
      dictionaryId: selectedDictionary.value.id,
      value: itemForm.value,
      label: itemForm.label,
      sortOrder: itemForm.sortOrder,
      dictionaryVersion: selectedDictionary.value.version,
    };
    const result = itemForm.id
      ? await updateDataDictionaryItem({ ...input, id: itemForm.id })
      : await createDataDictionaryItem(input);
    if (!result) throw new Error("Data dictionary item mutation response is empty");
    applyDictionaryVersion(result.dictionaryVersion);
    window.$message.success(
      t(itemForm.id ? "dataDictionaries.messages.itemUpdated" : "dataDictionaries.messages.itemCreated")
    );
    showItemEditor.value = false;
    await loadItems();
  } catch (error) {
    await reloadOnConflict(error);
    throw error;
  } finally {
    submitting.value = false;
  }
}

async function confirmDeleteDictionary() {
  if (!deletingDictionary.value || deleting.value) return;
  deleting.value = true;
  try {
    await deleteDataDictionary(deletingDictionary.value.id);
    if (selectedDictionaryId.value === deletingDictionary.value.id) {
      selectedDictionaryId.value = null;
      items.value = [];
    }
    showDictionaryDelete.value = false;
    deletingDictionary.value = null;
    window.$message.success(t("dataDictionaries.messages.deleted"));
    await loadDictionaries();
  } finally {
    deleting.value = false;
  }
}

async function confirmDeleteItem() {
  if (!selectedDictionary.value || !deletingItem.value || deleting.value) return;
  deleting.value = true;
  try {
    const result = await deleteDataDictionaryItem({
      dictionaryId: selectedDictionary.value.id,
      id: deletingItem.value.id,
      dictionaryVersion: selectedDictionary.value.version,
    });
    if (!result) throw new Error("Data dictionary item delete response is empty");
    applyDictionaryVersion(result.dictionaryVersion);
    showItemDelete.value = false;
    deletingItem.value = null;
    window.$message.success(t("dataDictionaries.messages.itemDeleted"));
    await loadItems();
  } catch (error) {
    await reloadOnConflict(error);
    throw error;
  } finally {
    deleting.value = false;
  }
}

async function loadDictionaries() {
  dictionaryLoading.value = true;
  pagination.disabled = true;
  try {
    const result = await getDataDictionaryList({
      index: pagination.page ?? 1,
      limit: pagination.pageSize ?? 20,
      keyword: appliedKeyword.value || undefined,
      enable: appliedStatus.value === null ? undefined : appliedStatus.value === "enabled",
    });
    dictionaries.value = result?.list ?? [];
    pagination.itemCount = result?.total ?? 0;
    const lastPage = Math.max(1, Math.ceil((pagination.itemCount ?? 0) / (pagination.pageSize ?? 20)));
    if ((pagination.page ?? 1) > lastPage) {
      pagination.page = lastPage;
      await loadDictionaries();
      return;
    }
    if (selectedDictionaryId.value && !dictionaries.value.some(item => item.id === selectedDictionaryId.value))
      selectedDictionaryId.value = null;
    if (!selectedDictionaryId.value && dictionaries.value.length) selectedDictionaryId.value = dictionaries.value[0].id;
    if (selectedDictionaryId.value) await loadItems();
  } finally {
    dictionaryLoading.value = false;
    pagination.disabled = false;
  }
}

function searchDictionaries() {
  if (actionLoading.value) return;
  appliedKeyword.value = keyword.value.trim();
  appliedStatus.value = statusFilter.value;
  pagination.page = 1;
  void loadDictionaries();
}

function resetFilters() {
  if (actionLoading.value) return;
  keyword.value = "";
  statusFilter.value = null;
  appliedKeyword.value = "";
  appliedStatus.value = null;
  pagination.page = 1;
  void loadDictionaries();
}

async function loadItems() {
  const sequence = ++itemLoadSequence;
  if (!selectedDictionaryId.value) {
    items.value = [];
    itemLoading.value = false;
    return;
  }
  const requestedId = selectedDictionaryId.value;
  itemLoading.value = true;
  try {
    const result = await getDataDictionaryItems(requestedId);
    if (!result) throw new Error("Data dictionary items response is empty");
    if (sequence !== itemLoadSequence || selectedDictionaryId.value !== requestedId) return;
    items.value = result.items ?? [];
    applyDictionaryVersion(result.version);
    const dictionary = dictionaries.value.find(item => item.id === requestedId);
    if (dictionary) dictionary.itemCount = items.value.length;
  } finally {
    if (sequence === itemLoadSequence) itemLoading.value = false;
  }
}

function applyDictionaryVersion(version: string) {
  const dictionary = selectedDictionary.value;
  if (dictionary) dictionary.version = version;
}

async function reloadOnConflict(error: unknown) {
  if (
    !(error instanceof HTTPError) ||
    error.response.status !== 409 ||
    !error.data ||
    typeof error.data !== "object" ||
    !("message" in error.data) ||
    error.data.message !== dataChangedMessage
  )
    return;

  const editingDictionaryId = dictionaryForm.id;
  const editingItemId = itemForm.id;
  const deletingItemId = deletingItem.value?.id ?? null;
  await loadDictionaries();

  if (showDictionaryEditor.value && editingDictionaryId) {
    const currentDictionary = dictionaries.value.find(item => item.id === editingDictionaryId);
    if (currentDictionary) Object.assign(dictionaryForm, currentDictionary);
    else showDictionaryEditor.value = false;
  }
  if (showItemEditor.value && editingItemId) {
    const currentItem = items.value.find(item => item.id === editingItemId);
    if (currentItem) Object.assign(itemForm, currentItem);
    else showItemEditor.value = false;
  }
  if (showItemDelete.value && deletingItemId) {
    deletingItem.value = items.value.find(item => item.id === deletingItemId) ?? null;
    if (!deletingItem.value) showItemDelete.value = false;
  }
}

onMounted(() => Promise.all([loadDictionaries(), permissionsStore.getPermissions()]));
</script>

<style lang="scss" scoped>
.data-dictionary-page {
  min-width: 0;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}
.keyword-input {
  width: 230px;
}
.status-select {
  width: 140px;
}
:deep(.n-data-table-tr) {
  cursor: pointer;
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
